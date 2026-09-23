import "server-only";
import type { Types } from "mongoose";
import { roundName } from "./bracket";
import { connectDB } from "./db";
import {
  GameMap,
  GameMode,
  Series,
  Team,
  Tournament,
  TournamentEvent,
  type GameMapDoc,
  type GameModeDoc,
  type SeriesDoc,
  type TeamDoc,
  type TournamentDoc,
} from "@/models";
import type {
  EventView,
  MapView,
  ModeView,
  SeriesView,
  TeamAdminView,
  TeamView,
  TournamentData,
  TournamentView,
} from "./views";

const idOf = (v: Types.ObjectId | string | null | undefined) => (v ? String(v) : null);
const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

export function toModeView(m: GameModeDoc): ModeView {
  return {
    id: String(m._id),
    slug: m.slug,
    name: m.name,
    icon: m.icon ?? "🎮",
    color: m.color ?? "#7c3aed",
    description: m.description ?? "",
    active: m.active ?? true,
  };
}

export function toMapView(m: GameMapDoc): MapView {
  return { id: String(m._id), name: m.name, modeId: String(m.mode), active: m.active ?? true };
}

function toTeamView(t: TeamDoc, record?: { wins: number; losses: number }): TeamView {
  return {
    id: String(t._id),
    slug: t.slug,
    name: t.name,
    color: t.color ?? "#3b82f6",
    hasLogo: !!t.hasLogo,
    logoUrl: t.hasLogo ? `/api/logos/${t._id}?v=${new Date(t.updatedAt ?? 0).getTime()}` : null,
    members: (t.members ?? []).map((m) => ({
      name: m.name,
      tag: m.tag,
      role: m.role as TeamView["members"][number]["role"],
      ficct: m.ficct ?? null,
    })),
    registrationStatus: t.registrationStatus,
    competitionStatus: t.competitionStatus,
    seed: t.seed ?? null,
    wins: record?.wins ?? 0,
    losses: record?.losses ?? 0,
    createdAt: iso(t.createdAt)!,
  };
}

export function toTeamAdminView(t: TeamDoc): TeamAdminView {
  return {
    ...toTeamView(t),
    captainContact: t.captainContact ?? "",
    adminNote: t.adminNote ?? "",
    accessCode: t.accessCode ?? "",
    paid: !!t.paid,
    idsChecked: !!t.idsChecked,
  };
}

function toTournamentView(t: TournamentDoc, approvedTeams: number): TournamentView {
  return {
    id: String(t._id),
    slug: t.slug,
    name: t.name,
    description: t.description ?? "",
    startsAt: iso(t.startsAt),
    maxTeams: t.maxTeams,
    teamSize: t.teamSize ?? 3,
    format: t.format,
    defaultBestOf: t.defaultBestOf,
    bestOfByRound: t.bestOfByRound ?? [],
    roundDurationMinutes: t.roundDurationMinutes ?? 30,
    status: t.status,
    rules: t.rules ?? "",
    posterUrl: t.posterUrl ?? "",
    mapPool: (t.mapPool ?? []).map(String),
    roundPlans: (t.roundPlans ?? []).map((games) =>
      games.map((g) => ({ modeId: idOf(g.mode), mapId: idOf(g.map) })),
    ),
    totalRounds: t.totalRounds ?? 0,
    bracketGeneratedAt: iso(t.bracketGeneratedAt),
    championTeamId: idOf(t.championTeam),
    approvedTeams,
  };
}

export async function getCatalog(opts: { onlyActive?: boolean } = {}) {
  await connectDB();
  const filter = opts.onlyActive ? { active: true } : {};
  const [modes, maps] = await Promise.all([
    GameMode.find(filter).sort({ order: 1, name: 1 }).lean(),
    GameMap.find(filter).sort({ order: 1, name: 1 }).lean(),
  ]);
  return { modes: modes.map(toModeView), maps: maps.map(toMapView) };
}

export async function listTournaments() {
  await connectDB();
  const tournaments = await Tournament.find({ status: { $ne: "draft" } })
    .sort({ startsAt: -1, createdAt: -1 })
    .lean();
  const counts = await Team.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { registrationStatus: "approved" } },
    { $group: { _id: "$tournament", n: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  return tournaments.map((t) => toTournamentView(t, byId.get(String(t._id)) ?? 0));
}

export async function listAllTournamentsForAdmin() {
  await connectDB();
  const tournaments = await Tournament.find().sort({ createdAt: -1 }).lean();
  const counts = await Team.aggregate<{ _id: { t: Types.ObjectId; s: string }; n: number }>([
    { $group: { _id: { t: "$tournament", s: "$registrationStatus" }, n: { $sum: 1 } } },
  ]);
  return tournaments.map((t) => {
    const of = (s: string) =>
      counts.find((c) => String(c._id.t) === String(t._id) && c._id.s === s)?.n ?? 0;
    return { ...toTournamentView(t, of("approved")), pendingRegistrations: of("pending") };
  });
}

/**
 * Todo lo que necesita una página de torneo en una sola carga.
 * Los torneos pequeños (≤128 equipos, ≤127 series) caben cómodos en memoria.
 */
export async function getTournamentData(
  slug: string,
  opts: { includeDrafts?: boolean; eventLimit?: number } = {},
): Promise<TournamentData | null> {
  await connectDB();
  const t = await Tournament.findOne({ slug }).lean();
  if (!t || (t.status === "draft" && !opts.includeDrafts)) return null;

  const [teams, series, events, catalog] = await Promise.all([
    Team.find({ tournament: t._id, registrationStatus: "approved" }).sort({ seed: 1, name: 1 }).lean(),
    Series.find({ tournament: t._id }).sort({ round: 1, position: 1 }).lean(),
    TournamentEvent.find({ tournament: t._id, public: true })
      .sort({ createdAt: -1 })
      .limit(opts.eventLimit ?? 30)
      .lean(),
    getCatalog(),
  ]);

  const record = new Map<string, { wins: number; losses: number }>();
  const bump = (id: string | null, key: "wins" | "losses") => {
    if (!id) return;
    const r = record.get(id) ?? { wins: 0, losses: 0 };
    r[key]++;
    record.set(id, r);
  };
  for (const s of series) {
    if (!s.winnerSlot || s.isBye) continue;
    const winner = s.winnerSlot === "A" ? s.teamA : s.teamB;
    const loser = s.winnerSlot === "A" ? s.teamB : s.teamA;
    bump(idOf(winner), "wins");
    bump(idOf(loser), "losses");
  }

  const teamViews = teams.map((tm) => toTeamView(tm, record.get(String(tm._id))));
  const teamById = new Map(teamViews.map((tm) => [tm.id, tm]));
  const modeById = new Map(catalog.modes.map((m) => [m.id, m]));
  const mapById = new Map(catalog.maps.map((m) => [m.id, m]));

  return {
    tournament: toTournamentView(t, teams.length),
    teams: teamViews,
    series: series.map((s) => toSeriesView(s, t.totalRounds ?? 0, teamById, modeById, mapById)),
    modes: catalog.modes,
    maps: catalog.maps,
    events: events.map(
      (e): EventView => ({ id: String(e._id), type: e.type, message: e.message, createdAt: iso(e.createdAt)! }),
    ),
  };
}

function toSeriesView(
  s: SeriesDoc,
  totalRounds: number,
  teamById: Map<string, TeamView>,
  modeById: Map<string, ModeView>,
  mapById: Map<string, MapView>,
): SeriesView {
  return {
    id: String(s._id),
    key: s.key,
    number: s.number,
    round: s.round,
    roundName: roundName(s.round, totalRounds),
    position: s.position,
    bestOf: s.bestOf,
    teamA: s.teamA ? teamById.get(String(s.teamA)) ?? null : null,
    teamB: s.teamB ? teamById.get(String(s.teamB)) ?? null : null,
    scoreA: s.scoreA ?? 0,
    scoreB: s.scoreB ?? 0,
    winnerSlot: (s.winnerSlot as "A" | "B" | null) ?? null,
    status: s.status,
    isBye: !!s.isBye,
    walkover: !!s.walkover,
    nextKey: s.nextKey ?? null,
    nextSlot: (s.nextSlot as "A" | "B" | null) ?? null,
    scheduledAt: iso(s.scheduledAt),
    notes: s.notes ?? "",
    reports: (s.reports ?? []).map((r) => ({ game: r.game, teamId: String(r.team), winnerSlot: r.winnerSlot })),
    games: (s.games ?? []).map((g) => ({
      number: g.number,
      status: g.status as "pending" | "finished" | "skipped",
      winnerSlot: (g.winnerSlot as "A" | "B" | null) ?? null,
      mode: g.mode ? modeById.get(String(g.mode)) ?? null : null,
      map: g.map ? mapById.get(String(g.map)) ?? null : null,
    })),
  };
}

export async function getTeamsForAdmin(tournamentId: string) {
  await connectDB();
  const teams = await Team.find({ tournament: tournamentId }).sort({ createdAt: 1 }).lean();
  return teams.map(toTeamAdminView);
}

export async function getTournamentBySlugForAdmin(slug: string) {
  return getTournamentData(slug, { includeDrafts: true, eventLimit: 50 });
}

export async function getPrivateEvents(tournamentId: string, limit = 50) {
  await connectDB();
  const events = await TournamentEvent.find({ tournament: tournamentId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<{ actor: { name: string } | null }>("actor", "name")
    .lean();
  return events.map((e) => ({
    id: String(e._id),
    type: e.type,
    message: e.message,
    public: e.public,
    actorName: e.actor?.name ?? null,
    createdAt: iso(e.createdAt)!,
  }));
}
