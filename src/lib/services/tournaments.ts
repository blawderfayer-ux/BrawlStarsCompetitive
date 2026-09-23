import "server-only";
import { Types } from "mongoose";
import {
  BEST_OF_OPTIONS,
  generateSingleElimination,
  nextPowerOfTwo,
  roundName,
  suggestRoundPlan,
  type GamePlan,
} from "../bracket";
import { connectDB } from "../db";
import { slugify } from "../utils";
import {
  GameMap,
  Series,
  Team,
  TeamLogo,
  Tournament,
  TournamentEvent,
  type TournamentStatus,
} from "@/models";
import { declareWalkover, stateToFields } from "./matches";
import { UserError, withTransaction } from "./tx";

export interface TournamentInput {
  name: string;
  slug?: string;
  description: string;
  startsAt: Date | null;
  maxTeams: number;
  defaultBestOf: number;
  bestOfByRound: number[];
  roundDurationMinutes: number;
  rules: string;
}

function validateBestOf(n: number) {
  if (!BEST_OF_OPTIONS.includes(n as (typeof BEST_OF_OPTIONS)[number])) {
    throw new UserError("El formato de serie debe ser BO1, BO3, BO5 o BO7.");
  }
}

export async function createTournament(input: TournamentInput, actorId: string) {
  await connectDB();
  validateBestOf(input.defaultBestOf);
  input.bestOfByRound.forEach(validateBestOf);
  const slug = slugify(input.slug || input.name);
  if (await Tournament.exists({ slug })) {
    throw new UserError(`Ya existe un torneo con la dirección "${slug}". Cambia el nombre o el slug.`);
  }
  // Por defecto todo el pool de mapas activo.
  const maps = await GameMap.find({ active: true }, { _id: 1 }).lean();
  const t = await Tournament.create({ ...input, slug, mapPool: maps.map((m) => m._id), status: "draft" });
  await TournamentEvent.create({
    tournament: t._id,
    type: "tournament_updated",
    message: `Torneo creado: ${t.name}.`,
    public: false,
    actor: actorId,
  });
  return { id: String(t._id), slug: t.slug };
}

export async function updateTournament(id: string, input: TournamentInput, actorId: string) {
  await connectDB();
  validateBestOf(input.defaultBestOf);
  input.bestOfByRound.forEach(validateBestOf);
  const t = await Tournament.findById(id);
  if (!t) throw new UserError("El torneo no existe.");

  const slug = slugify(input.slug || input.name);
  if (slug !== t.slug && (await Tournament.exists({ slug }))) {
    throw new UserError(`Ya existe un torneo con la dirección "${slug}".`);
  }
  const approved = await Team.countDocuments({ tournament: t._id, registrationStatus: "approved" });
  if (input.maxTeams < approved) {
    throw new UserError(`Ya hay ${approved} equipos aprobados; el máximo no puede ser menor.`);
  }
  const bracketLocked = !!t.bracketGeneratedAt;
  t.set({
    name: input.name,
    slug,
    description: input.description,
    startsAt: input.startsAt,
    maxTeams: input.maxTeams,
    roundDurationMinutes: input.roundDurationMinutes,
    rules: input.rules,
    // Con el bracket generado, el BO de cada serie ya está fijado; no se cambia aquí.
    ...(bracketLocked ? {} : { defaultBestOf: input.defaultBestOf, bestOfByRound: input.bestOfByRound }),
  });
  await t.save();
  await TournamentEvent.create({
    tournament: t._id,
    type: "tournament_updated",
    message: "Se actualizó la configuración del torneo.",
    public: false,
    actor: actorId,
  });
  return { slug: t.slug };
}

const STATUS_FLOW: Record<TournamentStatus, TournamentStatus[]> = {
  draft: ["registration_open", "registration_closed", "cancelled"],
  registration_open: ["draft", "registration_closed", "cancelled"],
  registration_closed: ["registration_open", "cancelled"],
  live: ["cancelled"],
  finished: [],
  cancelled: ["draft"],
};

export async function setTournamentStatus(id: string, status: TournamentStatus, actorId: string) {
  await connectDB();
  const t = await Tournament.findById(id);
  if (!t) throw new UserError("El torneo no existe.");
  if (!STATUS_FLOW[t.status as TournamentStatus]?.includes(status)) {
    throw new UserError("Ese cambio de estado no está permitido.");
  }
  if (t.bracketGeneratedAt && status !== "cancelled") {
    throw new UserError("El bracket ya está generado. Reinícialo para volver a inscripciones.");
  }
  t.status = status;
  await t.save();
  const messages: Partial<Record<TournamentStatus, string>> = {
    registration_open: "📝 ¡Inscripciones abiertas!",
    registration_closed: "🔒 Inscripciones cerradas.",
    cancelled: "⛔ El torneo fue cancelado.",
  };
  await TournamentEvent.create({
    tournament: t._id,
    type: "tournament_updated",
    message: messages[status] ?? "Se actualizó el estado del torneo.",
    public: status !== "draft",
    actor: actorId,
  });
}

export async function deleteTournament(id: string) {
  return withTransaction(async (session) => {
    const t = await Tournament.findById(id).session(session);
    if (!t) throw new UserError("El torneo no existe.");
    if (t.status !== "draft" && t.status !== "cancelled") {
      throw new UserError("Solo se pueden eliminar torneos en borrador o cancelados.");
    }
    const opts = { session: session ?? undefined };
    const teams = await Team.find({ tournament: t._id }, { _id: 1 }).session(session).lean();
    await TeamLogo.deleteMany({ team: { $in: teams.map((x) => x._id) } }, opts);
    await Team.deleteMany({ tournament: t._id }, opts);
    await Series.deleteMany({ tournament: t._id }, opts);
    await TournamentEvent.deleteMany({ tournament: t._id }, opts);
    await Tournament.deleteOne({ _id: t._id }, opts);
  });
}

export async function setMapPool(id: string, mapIds: string[], actorId: string) {
  await connectDB();
  const valid = await GameMap.find({ _id: { $in: mapIds.filter((m) => Types.ObjectId.isValid(m)) } }, { _id: 1 }).lean();
  await Tournament.updateOne({ _id: id }, { $set: { mapPool: valid.map((m) => m._id) } });
  await TournamentEvent.create({
    tournament: id,
    type: "tournament_updated",
    message: `Pool de mapas actualizado (${valid.length} mapas).`,
    public: false,
    actor: actorId,
  });
}

async function poolFor(tournamentId: Types.ObjectId | string) {
  const t = await Tournament.findById(tournamentId, { mapPool: 1 }).lean();
  const maps = await GameMap.find({ _id: { $in: t?.mapPool ?? [] }, active: true })
    .sort({ order: 1, name: 1 })
    .lean();
  // Orden estable por modo para que la rotación sea predecible.
  maps.sort((a, b) => String(a.mode).localeCompare(String(b.mode)) || (a.order ?? 0) - (b.order ?? 0));
  return maps.map((m) => ({ mapId: String(m._id), modeId: String(m.mode) }));
}

export type SeedingMethod = "random" | "registration" | "manual";

/**
 * GENERAR BRACKET: toma los equipos aprobados, los siembra, crea todas las series
 * (con BYE si hace falta) y propone modo/mapa por game según el pool del torneo.
 */
export async function generateBracket(tournamentId: string, seeding: SeedingMethod, actorId: string) {
  return withTransaction(async (session) => {
    const opts = { session: session ?? undefined };
    const t = await Tournament.findById(tournamentId).session(session);
    if (!t) throw new UserError("El torneo no existe.");
    if (t.bracketGeneratedAt) throw new UserError("El bracket ya fue generado.");
    if (!["registration_open", "registration_closed"].includes(t.status)) {
      throw new UserError("Abre o cierra las inscripciones antes de generar el bracket.");
    }

    const teams = await Team.find({ tournament: t._id, registrationStatus: "approved" })
      .sort({ createdAt: 1 })
      .session(session)
      .lean();
    if (teams.length < 2) throw new UserError("Se necesitan al menos 2 equipos aprobados.");

    let ordered = teams;
    if (seeding === "random") {
      ordered = [...teams];
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    } else if (seeding === "manual") {
      const seeds = teams.map((x) => x.seed);
      if (seeds.some((s) => !s) || new Set(seeds).size !== teams.length) {
        throw new UserError("Para siembra manual, cada equipo aprobado necesita un seed único.");
      }
      ordered = [...teams].sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
    }

    const size = nextPowerOfTwo(ordered.length);
    const totalRounds = Math.log2(size);
    const bestOfByRound = Array.from(
      { length: totalRounds },
      (_, i) => t.bestOfByRound?.[i] || t.defaultBestOf,
    );
    const pool = await poolFor(t._id);
    const mapPlanByRound: GamePlan[][] = bestOfByRound.map((bo, i) => suggestRoundPlan(pool, bo, i + 1));

    const bracket = generateSingleElimination(
      ordered.map((x) => String(x._id)),
      { defaultBestOf: t.defaultBestOf, bestOfByRound, mapPlanByRound },
    );

    // Numeración "Partida #N": en orden de ronda, sin contar BYE.
    let number = 0;
    const docs = bracket.series.map((s) => ({
      tournament: t._id,
      key: s.key,
      number: s.isBye ? 0 : ++number,
      round: s.round,
      position: s.position,
      nextKey: s.nextKey,
      nextSlot: s.nextSlot,
      scheduledAt: null,
      ...stateToFields(s),
    }));
    await Series.insertMany(docs, opts);

    for (const [i, team] of ordered.entries()) {
      await Team.updateOne({ _id: team._id }, { $set: { seed: i + 1, competitionStatus: "active" } }, opts);
    }

    t.set({
      totalRounds,
      bestOfByRound,
      roundPlans: mapPlanByRound.map((games) =>
        games.map((g) => ({ mode: g.modeId, map: g.mapId })),
      ),
      bracketGeneratedAt: new Date(),
      status: "live",
    });
    await t.save(opts);

    const byeNote = bracket.byes ? ` (${bracket.byes} BYE)` : "";
    await TournamentEvent.create(
      [
        {
          tournament: t._id,
          type: "bracket_generated",
          message: `🏁 ¡Bracket generado! ${ordered.length} equipos${byeNote}. Comienza ${roundName(1, totalRounds).toLowerCase()}.`,
          actor: actorId,
        },
      ],
      opts,
    );
  });
}

/** Borra el bracket y deja el torneo con inscripciones cerradas (no toca los equipos aprobados). */
export async function resetBracket(tournamentId: string, actorId: string) {
  return withTransaction(async (session) => {
    const opts = { session: session ?? undefined };
    const t = await Tournament.findById(tournamentId).session(session);
    if (!t) throw new UserError("El torneo no existe.");
    await Series.deleteMany({ tournament: t._id }, opts);
    await Team.updateMany(
      { tournament: t._id, registrationStatus: "approved" },
      { $set: { competitionStatus: "registered" } },
      opts,
    );
    t.set({ bracketGeneratedAt: null, totalRounds: 0, roundPlans: [], championTeam: null, status: "registration_closed" });
    await t.save(opts);
    await TournamentEvent.create(
      [{ tournament: t._id, type: "bracket_reset", message: "El bracket fue reiniciado por la organización.", actor: actorId }],
      opts,
    );
  });
}

/**
 * Cambia el plan de modos/mapas de una ronda. Se aplica a todas las series de esa ronda
 * que todavía no empezaron (las que ya tienen games jugados no se tocan).
 */
export async function updateRoundPlan(tournamentId: string, round: number, plan: GamePlan[], actorId: string) {
  return withTransaction(async (session) => {
    const opts = { session: session ?? undefined };
    const t = await Tournament.findById(tournamentId).session(session);
    if (!t) throw new UserError("El torneo no existe.");
    if (!t.bracketGeneratedAt) throw new UserError("Primero genera el bracket.");
    if (round < 1 || round > (t.totalRounds ?? 0)) throw new UserError("Ronda inválida.");

    const roundPlans = (t.roundPlans ?? []).map((games) => games.map((g) => ({ mode: g.mode, map: g.map })));
    roundPlans[round - 1] = plan.map((g) => ({
      mode: g.modeId ? new Types.ObjectId(g.modeId) : null,
      map: g.mapId ? new Types.ObjectId(g.mapId) : null,
    }));
    t.set({ roundPlans });
    await t.save(opts);

    const series = await Series.find({ tournament: t._id, round }).session(session);
    let updated = 0;
    for (const s of series) {
      if (s.isBye || s.games.some((g) => g.status !== "pending")) continue;
      s.games.forEach((g, i) => {
        g.mode = roundPlans[round - 1][i]?.mode ?? null;
        g.map = roundPlans[round - 1][i]?.map ?? null;
      });
      await s.save(opts);
      updated++;
    }
    await TournamentEvent.create(
      [
        {
          tournament: t._id,
          type: "series_updated",
          message: `🗺️ Se actualizaron los mapas de ${roundName(round, t.totalRounds ?? 0).toLowerCase()}.`,
          actor: actorId,
        },
      ],
      opts,
    );
    return { updated };
  });
}

/** Descalifica a un equipo; si tiene una serie pendiente, su rival gana por walkover. */
export async function disqualifyTeam(teamId: string, actorId: string) {
  await connectDB();
  const team = await Team.findById(teamId);
  if (!team) throw new UserError("El equipo no existe.");
  const series = await Series.findOne({
    tournament: team.tournament,
    winnerSlot: null,
    isBye: false,
    $or: [{ teamA: team._id }, { teamB: team._id }],
  }).lean();
  if (series && series.teamA && series.teamB) {
    const rivalSlot = String(series.teamA) === String(team._id) ? "B" : "A";
    await declareWalkover(String(series._id), rivalSlot, actorId);
  }
  team.competitionStatus = "disqualified";
  await team.save();
  await TournamentEvent.create({
    tournament: team.tournament,
    type: "team_eliminated",
    message: `⛔ ${team.name} fue descalificado.`,
    actor: actorId,
  });
}
