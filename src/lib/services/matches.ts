import "server-only";
import { Types, type ClientSession } from "mongoose";
import {
  SeriesError,
  reportGame,
  resetSeries as resetSeriesOp,
  roundName,
  undoGame,
  walkover as walkoverOp,
  type BracketChange,
  type SeriesState,
  type Slot,
} from "../bracket";
import { Series, Team, Tournament, TournamentEvent, type SeriesDoc } from "@/models";
import { UserError, withTransaction } from "./tx";

export function toState(s: SeriesDoc): SeriesState {
  return {
    key: s.key,
    round: s.round,
    position: s.position,
    teamA: s.teamA ? String(s.teamA) : null,
    teamB: s.teamB ? String(s.teamB) : null,
    bestOf: s.bestOf,
    scoreA: s.scoreA ?? 0,
    scoreB: s.scoreB ?? 0,
    winnerSlot: (s.winnerSlot as Slot | null) ?? null,
    status: s.status as SeriesState["status"],
    isBye: !!s.isBye,
    walkover: !!s.walkover,
    nextKey: s.nextKey ?? null,
    nextSlot: (s.nextSlot as Slot | null) ?? null,
    games: (s.games ?? []).map((g) => ({
      number: g.number,
      modeId: g.mode ? String(g.mode) : null,
      mapId: g.map ? String(g.map) : null,
      status: g.status as "pending" | "finished" | "skipped",
      winnerSlot: (g.winnerSlot as Slot | null) ?? null,
    })),
  };
}

export function stateToFields(s: SeriesState) {
  const oid = (v: string | null) => (v ? new Types.ObjectId(v) : null);
  return {
    teamA: oid(s.teamA),
    teamB: oid(s.teamB),
    bestOf: s.bestOf,
    scoreA: s.scoreA,
    scoreB: s.scoreB,
    winnerSlot: s.winnerSlot,
    status: s.status,
    isBye: s.isBye,
    walkover: s.walkover,
    games: s.games.map((g) => ({
      number: g.number,
      mode: oid(g.modeId),
      map: oid(g.mapId),
      status: g.status,
      winnerSlot: g.winnerSlot,
    })),
  };
}

interface Loaded {
  series: SeriesDoc;
  all: SeriesDoc[];
  totalRounds: number;
  teamNames: Map<string, string>;
}

async function load(seriesId: string, session: ClientSession | null): Promise<Loaded> {
  if (!Types.ObjectId.isValid(seriesId)) throw new UserError("Serie inválida.");
  const series = await Series.findById(seriesId).session(session).lean();
  if (!series) throw new UserError("La serie no existe.");
  const tournament = await Tournament.findById(series.tournament).session(session).lean();
  if (!tournament) throw new UserError("El torneo no existe.");
  if (tournament.status === "cancelled") throw new UserError("El torneo está cancelado.");
  const all = await Series.find({ tournament: series.tournament }).session(session).lean();
  const teams = await Team.find({ tournament: series.tournament }, { name: 1 }).session(session).lean();
  return {
    series,
    all,
    totalRounds: tournament.totalRounds ?? 0,
    teamNames: new Map(teams.map((t) => [String(t._id), t.name])),
  };
}

/** Guarda las series modificadas y aplica los efectos sobre equipos y torneo. */
async function persist(
  ctx: Loaded,
  change: BracketChange,
  actorId: string,
  session: ClientSession | null,
  extraEvents: { type: string; message: string; public?: boolean }[] = [],
) {
  const tournamentId = ctx.series.tournament;
  const byKey = new Map(ctx.all.map((s) => [s.key, s]));

  for (const s of change.changed) {
    const doc = byKey.get(s.key)!;
    await Series.updateOne({ _id: doc._id }, { $set: stateToFields(s) }, { session: session ?? undefined });
  }

  const name = (id: string | null) => (id ? ctx.teamNames.get(id) ?? "Equipo" : "Equipo");
  const events = [...extraEvents];

  for (const id of change.reactivatedTeams) {
    await Team.updateOne({ _id: id }, { $set: { competitionStatus: "active" } }, { session: session ?? undefined });
  }
  if (change.championRevoked) {
    await Team.updateMany(
      { tournament: tournamentId, competitionStatus: "champion" },
      { $set: { competitionStatus: "active" } },
      { session: session ?? undefined },
    );
    await Tournament.updateOne(
      { _id: tournamentId },
      { $set: { championTeam: null, status: "live" } },
      { session: session ?? undefined },
    );
  }

  if (change.eliminatedTeam) {
    await Team.updateOne(
      { _id: change.eliminatedTeam, competitionStatus: { $ne: "disqualified" } },
      { $set: { competitionStatus: "eliminated" } },
      { session: session ?? undefined },
    );
    events.push({ type: "team_eliminated", message: `${name(change.eliminatedTeam)} ha sido eliminado.` });
  }

  if (change.championTeam) {
    await Team.updateOne(
      { _id: change.championTeam },
      { $set: { competitionStatus: "champion" } },
      { session: session ?? undefined },
    );
    await Tournament.updateOne(
      { _id: tournamentId },
      { $set: { championTeam: change.championTeam, status: "finished" } },
      { session: session ?? undefined },
    );
    events.push({ type: "champion", message: `¡${name(change.championTeam)} es el CAMPEÓN del torneo!` });
  } else if (change.winnerTeam) {
    const advancedTo = change.changed.find((s) => s.key === byKey.get(ctx.series.key)?.nextKey);
    events.push({
      type: "team_advanced",
      message: `¡${name(change.winnerTeam)} avanza a ${advancedTo ? roundTarget(advancedTo.round, ctx.totalRounds) : "la siguiente ronda"}!`,
    });
    if (advancedTo?.teamA && advancedTo.teamB && advancedTo.status === "pending") {
      events.push({
        type: "series_updated",
        message: `Próxima partida disponible: ${name(advancedTo.teamA)} vs ${name(advancedTo.teamB)}.`,
      });
    }
  }

  if (events.length) {
    await TournamentEvent.insertMany(
      events.map((e) => ({
        tournament: tournamentId,
        type: e.type,
        message: e.message,
        public: e.public ?? true,
        actor: actorId,
        series: ctx.series._id,
      })),
      { session: session ?? undefined },
    );
  }
}

function roundTarget(round: number, totalRounds: number) {
  const name = roundName(round, totalRounds);
  if (name === "Final") return "la final";
  if (name === "Semifinal") return "semifinales";
  return name.toLowerCase();
}

function wrap(err: unknown): never {
  if (err instanceof SeriesError) throw new UserError(err.message);
  throw err;
}

export async function reportGameResult(seriesId: string, gameNumber: number, slot: Slot, actorId: string) {
  return withTransaction(async (session) => {
    const ctx = await load(seriesId, session);
    let change: ReturnType<typeof reportGame>;
    try {
      change = reportGame(ctx.all.map(toState), ctx.series.key, gameNumber, slot);
    } catch (e) {
      wrap(e);
    }
    const s = change.changed[0];
    const a = ctx.teamNames.get(s.teamA!) ?? "A";
    const b = ctx.teamNames.get(s.teamB!) ?? "B";
    const winnerName = slot === "A" ? a : b;
    await persist(ctx, change, actorId, session, [
      {
        type: "game_reported",
        message: `Partida #${ctx.series.number} · Game ${gameNumber}: gana ${winnerName} (${a} ${s.scoreA}-${s.scoreB} ${b}).`,
      },
    ]);
    return { decided: change.decided };
  });
}

export async function undoLastGameResult(seriesId: string, actorId: string) {
  return withTransaction(async (session) => {
    const ctx = await load(seriesId, session);
    let change: BracketChange;
    try {
      change = undoGame(ctx.all.map(toState), ctx.series.key);
    } catch (e) {
      wrap(e);
    }
    await persist(ctx, change, actorId, session, [
      { type: "result_corrected", message: `Se corrigió el resultado de la partida #${ctx.series.number}.` },
    ]);
  });
}

export async function declareWalkover(seriesId: string, slot: Slot, actorId: string) {
  return withTransaction(async (session) => {
    const ctx = await load(seriesId, session);
    let change: BracketChange;
    try {
      change = walkoverOp(ctx.all.map(toState), ctx.series.key, slot);
    } catch (e) {
      wrap(e);
    }
    const winner = change.winnerTeam ? ctx.teamNames.get(change.winnerTeam) : "Equipo";
    await persist(ctx, change, actorId, session, [
      { type: "series_updated", message: `Partida #${ctx.series.number}: ${winner} gana por walkover.` },
    ]);
  });
}

export async function resetSeriesResult(seriesId: string, actorId: string) {
  return withTransaction(async (session) => {
    const ctx = await load(seriesId, session);
    let change: BracketChange;
    try {
      change = resetSeriesOp(ctx.all.map(toState), ctx.series.key);
    } catch (e) {
      wrap(e);
    }
    await persist(ctx, change, actorId, session, [
      { type: "result_corrected", message: `La partida #${ctx.series.number} se reinició y se volverá a jugar.` },
    ]);
  });
}

const MANUAL_STATUSES = ["pending", "live", "awaiting_result", "disputed", "cancelled"] as const;
export type ManualSeriesStatus = (typeof MANUAL_STATUSES)[number];

export async function setSeriesStatus(seriesId: string, status: ManualSeriesStatus, actorId: string) {
  if (!MANUAL_STATUSES.includes(status)) throw new UserError("Estado inválido.");
  return withTransaction(async (session) => {
    const ctx = await load(seriesId, session);
    const s = ctx.series;
    if (s.winnerSlot) throw new UserError("La serie ya terminó. Corrige el resultado primero.");
    if (!s.teamA || !s.teamB) throw new UserError("La serie todavía no tiene ambos equipos.");
    await Series.updateOne({ _id: s._id }, { $set: { status } }, { session: session ?? undefined });
    const a = ctx.teamNames.get(String(s.teamA));
    const b = ctx.teamNames.get(String(s.teamB));
    const messages: Record<ManualSeriesStatus, string> = {
      live: `Comienza la partida #${s.number}: ${a} vs ${b}.`,
      pending: `La partida #${s.number} (${a} vs ${b}) vuelve a estar pendiente.`,
      awaiting_result: `Partida #${s.number}: esperando confirmación del resultado.`,
      disputed: `La partida #${s.number} está en revisión por un reclamo.`,
      cancelled: `La partida #${s.number} fue cancelada.`,
    };
    await TournamentEvent.create(
      [
        {
          tournament: s.tournament,
          type: status === "live" ? "series_live" : "series_updated",
          message: messages[status],
          actor: actorId,
          series: s._id,
        },
      ],
      { session: session ?? undefined },
    );
  });
}

export async function scheduleSeries(seriesId: string, when: Date | null, notes: string, actorId: string) {
  return withTransaction(async (session) => {
    const ctx = await load(seriesId, session);
    const s = ctx.series;
    await Series.updateOne(
      { _id: s._id },
      { $set: { scheduledAt: when, notes: notes.slice(0, 500) } },
      { session: session ?? undefined },
    );
    const changed = String(s.scheduledAt ?? "") !== String(when ?? "");
    if (changed && when) {
      await TournamentEvent.create(
        [
          {
            tournament: s.tournament,
            type: "series_updated",
            message: `Se reprogramó la partida #${s.number}.`,
            actor: actorId,
            series: s._id,
          },
        ],
        { session: session ?? undefined },
      );
    }
  });
}

/** Cambia el modo/mapa de un game concreto (override puntual del plan de la ronda). */
export async function setSeriesGameMap(
  seriesId: string,
  gameNumber: number,
  modeId: string | null,
  mapId: string | null,
  actorId: string,
) {
  return withTransaction(async (session) => {
    const ctx = await load(seriesId, session);
    const game = ctx.series.games.find((g) => g.number === gameNumber);
    if (!game) throw new UserError("Ese game no existe.");
    if (game.status !== "pending") throw new UserError("Ese game ya se jugó.");
    await Series.updateOne(
      { _id: ctx.series._id, "games.number": gameNumber },
      {
        $set: {
          "games.$.mode": modeId ? new Types.ObjectId(modeId) : null,
          "games.$.map": mapId ? new Types.ObjectId(mapId) : null,
        },
      },
      { session: session ?? undefined },
    );
    await TournamentEvent.create(
      [
        {
          tournament: ctx.series.tournament,
          type: "series_updated",
          message: `Se actualizó el mapa del game ${gameNumber} de la partida #${ctx.series.number}.`,
          actor: actorId,
          series: ctx.series._id,
        },
      ],
      { session: session ?? undefined },
    );
  });
}
