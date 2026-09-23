import type { GamePlan } from "./types";

export interface PoolMap {
  mapId: string;
  modeId: string;
}

/**
 * Propone un plan de modo/mapa por game para una ronda, a partir del pool del torneo.
 * - No repite modo dentro de la serie mientras haya modos suficientes (como en BSC 2026).
 * - Rota modos y mapas entre rondas para que no se juegue siempre lo mismo.
 * El administrador puede editar el resultado después.
 */
export function suggestRoundPlan(pool: PoolMap[], bestOf: number, round: number): GamePlan[] {
  if (pool.length === 0) {
    return Array.from({ length: bestOf }, () => ({ modeId: null, mapId: null }));
  }
  const modes: string[] = [];
  const mapsByMode = new Map<string, string[]>();
  for (const m of pool) {
    if (!mapsByMode.has(m.modeId)) {
      mapsByMode.set(m.modeId, []);
      modes.push(m.modeId);
    }
    mapsByMode.get(m.modeId)!.push(m.mapId);
  }

  const plan: GamePlan[] = [];
  const offset = ((round - 1) * bestOf) % modes.length;
  for (let i = 0; i < bestOf; i++) {
    const modeIndex = (offset + i) % modes.length;
    const modeId = modes[modeIndex];
    const maps = mapsByMode.get(modeId)!;
    // Cada vez que el mismo modo vuelve a aparecer, se usa el siguiente mapa de ese modo.
    const appearance = Math.floor(((round - 1) * bestOf + i) / modes.length);
    plan.push({ modeId, mapId: maps[appearance % maps.length] });
  }
  return plan;
}

/** Devuelve los números de game cuyo modo se repite dentro de la serie. */
export function repeatedModes(plan: GamePlan[]): number[] {
  const seen = new Set<string>();
  const repeated: number[] = [];
  plan.forEach((g, i) => {
    if (!g.modeId) return;
    if (seen.has(g.modeId)) repeated.push(i + 1);
    seen.add(g.modeId);
  });
  return repeated;
}

/**
 * Sortea modo y mapa para una serie: cada partida recibe su propio sorteo.
 * - Los modos salen en orden aleatorio y no se repiten dentro de la serie mientras alcancen.
 * - Cada modo recibe un mapa al azar de los que hay en el pool.
 */
export function randomSeriesPlan(pool: PoolMap[], bestOf: number, random: () => number = Math.random): GamePlan[] {
  if (pool.length === 0) {
    return Array.from({ length: bestOf }, () => ({ modeId: null, mapId: null }));
  }
  const mapsByMode = new Map<string, string[]>();
  for (const m of pool) {
    if (!mapsByMode.has(m.modeId)) mapsByMode.set(m.modeId, []);
    mapsByMode.get(m.modeId)!.push(m.mapId);
  }
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const shuffle = <T>(list: T[]) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const modes: string[] = [];
  while (modes.length < bestOf) modes.push(...shuffle([...mapsByMode.keys()]));
  const usedMaps = new Set<string>();
  return modes.slice(0, bestOf).map((modeId) => {
    const maps = mapsByMode.get(modeId)!;
    const fresh = maps.filter((m) => !usedMaps.has(m));
    const mapId = pick(fresh.length ? fresh : maps);
    usedMaps.add(mapId);
    return { modeId, mapId };
  });
}
