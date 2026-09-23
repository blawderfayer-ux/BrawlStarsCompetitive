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
