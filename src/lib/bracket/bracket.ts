import {
  SeriesError,
  applyGameResult,
  applyWalkover,
  canCorrect,
  otherSlot,
  resetSeriesState,
  teamInSlot,
  undoLastGame,
} from "./series";
import type { SeriesState, Slot } from "./types";

/**
 * Operaciones sobre el bracket completo. Reciben todas las series del torneo y devuelven
 * solo las que cambiaron, junto con los efectos sobre los equipos. No tocan la base de datos:
 * la capa de servicios guarda el resultado en una transacción.
 */
export interface BracketChange {
  changed: SeriesState[];
  /** Equipo que ganó la serie (si se definió). */
  winnerTeam: string | null;
  /** Equipo eliminado (si se definió). */
  eliminatedTeam: string | null;
  /** Campeón del torneo (si se definió la final). */
  championTeam: string | null;
  /** Equipos que vuelven a estar activos por una corrección. */
  reactivatedTeams: string[];
  /** true si una corrección deshizo al campeón. */
  championRevoked: boolean;
}

function emptyChange(): BracketChange {
  return {
    changed: [],
    winnerTeam: null,
    eliminatedTeam: null,
    championTeam: null,
    reactivatedTeams: [],
    championRevoked: false,
  };
}

function index(all: SeriesState[]) {
  return new Map(all.map((s) => [s.key, s]));
}

function getSeries(byKey: Map<string, SeriesState>, key: string) {
  const s = byKey.get(key);
  if (!s) throw new SeriesError("La serie no existe.");
  return s;
}

/** Coloca al ganador de `from` en su lugar de la siguiente serie. */
function advance(byKey: Map<string, SeriesState>, from: SeriesState, change: BracketChange) {
  const winner = from.winnerSlot ? teamInSlot(from, from.winnerSlot) : null;
  const loser = from.winnerSlot ? teamInSlot(from, otherSlot(from.winnerSlot)) : null;
  change.winnerTeam = winner;
  change.eliminatedTeam = loser;

  if (!from.nextKey || !from.nextSlot) {
    change.championTeam = winner;
    return;
  }
  const next = { ...getSeries(byKey, from.nextKey) };
  if (from.nextSlot === "A") next.teamA = winner;
  else next.teamB = winner;
  if (next.teamA && next.teamB && next.status === "waiting") next.status = "pending";
  change.changed.push(next);
}

/** Quita al ganador de `from` de la siguiente serie (para correcciones). */
function retract(byKey: Map<string, SeriesState>, from: SeriesState, change: BracketChange) {
  const loser = from.winnerSlot ? teamInSlot(from, otherSlot(from.winnerSlot)) : null;
  if (loser) change.reactivatedTeams.push(loser);

  if (!from.nextKey || !from.nextSlot) {
    change.championRevoked = true;
    return;
  }
  const next = getSeries(byKey, from.nextKey);
  if (!canCorrect(next)) {
    throw new SeriesError(
      "No se puede corregir: la siguiente serie ya tiene resultados. Corrige primero esa serie.",
    );
  }
  const updated = { ...next };
  if (from.nextSlot === "A") updated.teamA = null;
  else updated.teamB = null;
  if (updated.status !== "cancelled") updated.status = "waiting";
  change.changed.push(updated);
}

export function reportGame(
  all: SeriesState[],
  key: string,
  gameNumber: number,
  winnerSlot: Slot,
): BracketChange & { decided: boolean } {
  const byKey = index(all);
  const change = emptyChange();
  const { series, decided } = applyGameResult(getSeries(byKey, key), gameNumber, winnerSlot);
  change.changed.push(series);
  if (decided) advance(byKey, series, change);
  return { ...change, decided };
}

export function undoGame(all: SeriesState[], key: string): BracketChange {
  const byKey = index(all);
  const change = emptyChange();
  const current = getSeries(byKey, key);
  if (current.winnerSlot) retract(byKey, current, change);
  const { series } = undoLastGame(current);
  change.changed.unshift(series);
  return change;
}

export function walkover(all: SeriesState[], key: string, winnerSlot: Slot): BracketChange {
  const byKey = index(all);
  const change = emptyChange();
  const series = applyWalkover(getSeries(byKey, key), winnerSlot);
  change.changed.push(series);
  advance(byKey, series, change);
  return change;
}

export function resetSeries(all: SeriesState[], key: string): BracketChange {
  const byKey = index(all);
  const change = emptyChange();
  const current = getSeries(byKey, key);
  if (current.isBye) throw new SeriesError("Un BYE no se puede reiniciar.");
  if (current.winnerSlot) retract(byKey, current, change);
  change.changed.unshift(resetSeriesState(current));
  return change;
}
