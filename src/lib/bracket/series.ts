import type { GamePlan, GameState, SeriesState, Slot } from "./types";

export const BEST_OF_OPTIONS = [1, 3, 5, 7] as const;

/** Victorias necesarias para ganar una serie: BO1 → 1, BO3 → 2, BO5 → 3. */
export function winsNeeded(bestOf: number): number {
  return Math.floor(bestOf / 2) + 1;
}

export function otherSlot(slot: Slot): Slot {
  return slot === "A" ? "B" : "A";
}

export function teamInSlot(series: Pick<SeriesState, "teamA" | "teamB">, slot: Slot) {
  return slot === "A" ? series.teamA : series.teamB;
}

export function buildGames(bestOf: number, plan: GamePlan[] = []): GameState[] {
  return Array.from({ length: bestOf }, (_, i) => ({
    number: i + 1,
    modeId: plan[i]?.modeId ?? null,
    mapId: plan[i]?.mapId ?? null,
    status: "pending" as const,
    winnerSlot: null,
  }));
}

/** El próximo game que se debe jugar, o null si la serie ya terminó. */
export function currentGame(series: SeriesState): GameState | null {
  if (series.winnerSlot) return null;
  return series.games.find((g) => g.status === "pending") ?? null;
}

export class SeriesError extends Error {}

function scoreOf(games: GameState[]) {
  let a = 0;
  let b = 0;
  for (const g of games) {
    if (g.status !== "finished") continue;
    if (g.winnerSlot === "A") a++;
    if (g.winnerSlot === "B") b++;
  }
  return { a, b };
}

/**
 * Registra el ganador de un game dentro de una serie (BO1/BO3/BO5).
 * Devuelve una copia de la serie. `decided` indica si con este game se definió la serie.
 */
export function applyGameResult(
  series: SeriesState,
  gameNumber: number,
  winnerSlot: Slot,
): { series: SeriesState; decided: boolean } {
  if (!series.teamA || !series.teamB) {
    throw new SeriesError("La serie todavía no tiene ambos equipos.");
  }
  if (series.winnerSlot || series.status === "finished") {
    throw new SeriesError("La serie ya terminó.");
  }
  if (series.status === "cancelled") {
    throw new SeriesError("La serie está cancelada.");
  }
  const next = currentGame(series);
  if (!next || next.number !== gameNumber) {
    throw new SeriesError(
      `Solo se puede registrar el game ${next?.number ?? "-"} de esta serie.`,
    );
  }

  const games = series.games.map((g) =>
    g.number === gameNumber ? { ...g, status: "finished" as const, winnerSlot } : { ...g },
  );
  const { a, b } = scoreOf(games);
  const need = winsNeeded(series.bestOf);
  const winner: Slot | null = a >= need ? "A" : b >= need ? "B" : null;

  if (winner) {
    for (const g of games) if (g.status === "pending") g.status = "skipped";
  }

  return {
    decided: winner !== null,
    series: {
      ...series,
      games,
      scoreA: a,
      scoreB: b,
      winnerSlot: winner,
      status: winner ? "finished" : "live",
    },
  };
}

/** Deshace el último game registrado (para corregir un error del árbitro). */
export function undoLastGame(series: SeriesState): { series: SeriesState; wasDecided: boolean } {
  if (series.walkover) {
    throw new SeriesError("La serie se definió por walkover; usa 'Reiniciar serie'.");
  }
  const finished = series.games.filter((g) => g.status === "finished");
  const last = finished[finished.length - 1];
  if (!last) throw new SeriesError("No hay games registrados en esta serie.");

  const games = series.games.map((g) => {
    if (g.number === last.number) return { ...g, status: "pending" as const, winnerSlot: null };
    if (g.status === "skipped") return { ...g, status: "pending" as const };
    return { ...g };
  });
  const { a, b } = scoreOf(games);
  return {
    wasDecided: series.winnerSlot !== null,
    series: {
      ...series,
      games,
      scoreA: a,
      scoreB: b,
      winnerSlot: null,
      status: a + b > 0 ? "live" : "pending",
    },
  };
}

/** Declara ganador sin jugar (no presentación, descalificación del rival, etc.). */
export function applyWalkover(series: SeriesState, winnerSlot: Slot): SeriesState {
  if (!teamInSlot(series, winnerSlot)) {
    throw new SeriesError("No hay equipo en ese lado de la serie.");
  }
  if (series.winnerSlot) throw new SeriesError("La serie ya terminó.");
  return {
    ...series,
    games: series.games.map((g) => (g.status === "pending" ? { ...g, status: "skipped" as const } : { ...g })),
    winnerSlot,
    walkover: true,
    status: "finished",
  };
}

/** Deja la serie como si no se hubiera jugado (mantiene equipos y mapas). */
export function resetSeriesState(series: SeriesState): SeriesState {
  return {
    ...series,
    games: series.games.map((g) => ({ ...g, status: "pending" as const, winnerSlot: null })),
    scoreA: 0,
    scoreB: 0,
    winnerSlot: null,
    walkover: false,
    status: series.teamA && series.teamB ? "pending" : "waiting",
  };
}

/** Una serie se puede corregir si la siguiente todavía no empezó. */
export function canCorrect(next: SeriesState | null | undefined): boolean {
  if (!next) return true;
  return !next.winnerSlot && next.games.every((g) => g.status === "pending");
}
