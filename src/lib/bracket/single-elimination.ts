import { buildGames } from "./series";
import type { GamePlan, SeriesState, Slot } from "./types";

export function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

/**
 * Orden estándar de siembra para un cuadro de `size` lugares.
 * Para 8 → [1, 8, 4, 5, 2, 7, 3, 6]: los pares consecutivos son los cruces de la ronda 1,
 * y los seeds 1 y 2 solo pueden encontrarse en la final.
 */
export function seedOrder(size: number): number[] {
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new Error("El tamaño del cuadro debe ser potencia de 2 (mínimo 2).");
  }
  let order = [1, 2];
  while (order.length < size) {
    const total = order.length * 2 + 1;
    order = order.flatMap((s) => [s, total - s]);
  }
  return order;
}

export function roundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Cuartos de final";
  if (fromEnd === 3) return "Octavos de final";
  if (fromEnd === 4) return "Dieciseisavos";
  return `Ronda ${round}`;
}

export function seriesKey(round: number, position: number) {
  return `R${round}-M${position}`;
}

export interface GenerateOptions {
  /** BO por ronda (índice 0 = ronda 1). Si falta, se usa `defaultBestOf`. */
  bestOfByRound?: number[];
  defaultBestOf: number;
  /** Plan de modos/mapas por ronda (índice 0 = ronda 1). */
  mapPlanByRound?: GamePlan[][];
  /** Plan propio para cada serie (tiene prioridad sobre `mapPlanByRound`). */
  planForSeries?: (round: number, position: number, bestOf: number) => GamePlan[];
}

export interface GeneratedBracket {
  size: number;
  totalRounds: number;
  byes: number;
  series: SeriesState[];
}

/**
 * Genera un cuadro de eliminación simple.
 * `seededTeams[0]` es el seed 1. Si la cantidad no es potencia de 2, los mejores seeds
 * reciben BYE y avanzan automáticamente a la ronda 2.
 */
export function generateSingleElimination(
  seededTeams: string[],
  opts: GenerateOptions,
): GeneratedBracket {
  const n = seededTeams.length;
  if (n < 2) throw new Error("Se necesitan al menos 2 equipos para generar el bracket.");
  if (new Set(seededTeams).size !== n) throw new Error("Hay equipos repetidos en la siembra.");

  const size = nextPowerOfTwo(n);
  const totalRounds = Math.log2(size);
  const order = seedOrder(size);
  const bestOfFor = (round: number) => opts.bestOfByRound?.[round - 1] ?? opts.defaultBestOf;

  const byKey = new Map<string, SeriesState>();
  const series: SeriesState[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const matches = size / 2 ** round;
    for (let position = 1; position <= matches; position++) {
      const isFinal = round === totalRounds;
      const bestOf = bestOfFor(round);
      const s: SeriesState = {
        key: seriesKey(round, position),
        round,
        position,
        teamA: null,
        teamB: null,
        bestOf,
        scoreA: 0,
        scoreB: 0,
        winnerSlot: null,
        status: "waiting",
        isBye: false,
        walkover: false,
        nextKey: isFinal ? null : seriesKey(round + 1, Math.ceil(position / 2)),
        nextSlot: isFinal ? null : position % 2 === 1 ? "A" : "B",
        games: buildGames(bestOf, opts.planForSeries?.(round, position, bestOf) ?? opts.mapPlanByRound?.[round - 1]),
      };
      series.push(s);
      byKey.set(s.key, s);
    }
  }

  const teamForSeed = (seed: number) => (seed <= n ? seededTeams[seed - 1] : null);

  for (let position = 1; position <= size / 2; position++) {
    const s = byKey.get(seriesKey(1, position))!;
    s.teamA = teamForSeed(order[(position - 1) * 2]);
    s.teamB = teamForSeed(order[(position - 1) * 2 + 1]);

    if (s.teamA && s.teamB) {
      s.status = "pending";
      continue;
    }
    // BYE: como n > size/2, nunca hay dos BYE en la misma serie.
    const winnerSlot: Slot = s.teamA ? "A" : "B";
    s.isBye = true;
    s.winnerSlot = winnerSlot;
    s.status = "finished";
    s.games = s.games.map((g) => ({ ...g, status: "skipped" }));
    placeInNext(byKey, s, winnerSlot === "A" ? s.teamA : s.teamB);
  }

  return { size, totalRounds, byes: size - n, series };
}

function placeInNext(byKey: Map<string, SeriesState>, from: SeriesState, team: string | null) {
  if (!from.nextKey || !from.nextSlot) return;
  const next = byKey.get(from.nextKey)!;
  if (from.nextSlot === "A") next.teamA = team;
  else next.teamB = team;
  if (next.teamA && next.teamB && next.status === "waiting") next.status = "pending";
}
