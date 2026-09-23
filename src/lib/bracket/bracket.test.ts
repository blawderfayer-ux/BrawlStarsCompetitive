import { describe, expect, it } from "vitest";
import {
  generateSingleElimination,
  nextPowerOfTwo,
  reportGame,
  resetSeries,
  roundName,
  seedOrder,
  suggestRoundPlan,
  randomSeriesPlan,
  repeatedModes,
  undoGame,
  walkover,
  winsNeeded,
  type SeriesState,
  type Slot,
} from ".";

const teams = (n: number) => Array.from({ length: n }, (_, i) => `T${i + 1}`);

function apply(all: SeriesState[], changed: SeriesState[]) {
  const byKey = new Map(all.map((s) => [s.key, s]));
  for (const c of changed) byKey.set(c.key, c);
  return all.map((s) => byKey.get(s.key)!);
}

/** Juega una serie completa haciendo ganar siempre al lado indicado. */
function playSeries(all: SeriesState[], key: string, slot: Slot) {
  let state = all;
  let result;
  do {
    const s = state.find((x) => x.key === key)!;
    const game = s.games.find((g) => g.status === "pending")!;
    result = reportGame(state, key, game.number, slot);
    state = apply(state, result.changed);
  } while (!result.decided);
  return { state, result };
}

describe("seedOrder", () => {
  it("genera el orden estándar", () => {
    expect(seedOrder(2)).toEqual([1, 2]);
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
  it("contiene todos los seeds una sola vez", () => {
    const o = seedOrder(32);
    expect(new Set(o).size).toBe(32);
    expect(Math.min(...o)).toBe(1);
    expect(Math.max(...o)).toBe(32);
  });
});

describe("winsNeeded", () => {
  it("BO1/BO3/BO5/BO7", () => {
    expect([1, 3, 5, 7].map(winsNeeded)).toEqual([1, 2, 3, 4]);
  });
});

describe("roundName", () => {
  it("nombra las rondas desde el final", () => {
    expect(roundName(4, 4)).toBe("Final");
    expect(roundName(3, 4)).toBe("Semifinal");
    expect(roundName(2, 4)).toBe("Cuartos de final");
    expect(roundName(1, 4)).toBe("Octavos de final");
  });
});

describe("generateSingleElimination", () => {
  it.each([2, 4, 8, 16, 32])("cuadro completo con %i equipos", (n) => {
    const b = generateSingleElimination(teams(n), { defaultBestOf: 3 });
    expect(b.size).toBe(n);
    expect(b.byes).toBe(0);
    expect(b.series).toHaveLength(n - 1);
    expect(b.totalRounds).toBe(Math.log2(n));
    const r1 = b.series.filter((s) => s.round === 1);
    expect(r1.every((s) => s.teamA && s.teamB && s.status === "pending")).toBe(true);
    const inR1 = r1.flatMap((s) => [s.teamA, s.teamB]);
    expect(new Set(inR1).size).toBe(n);
  });

  it("12 equipos: 4 BYE para los seeds 1-4 que ya aparecen en ronda 2", () => {
    const b = generateSingleElimination(teams(12), { defaultBestOf: 3 });
    expect(b.size).toBe(16);
    expect(b.byes).toBe(4);
    const byes = b.series.filter((s) => s.isBye);
    expect(byes).toHaveLength(4);
    const byeWinners = byes.map((s) => (s.winnerSlot === "A" ? s.teamA : s.teamB)).sort();
    expect(byeWinners).toEqual(["T1", "T2", "T3", "T4"]);
    const r2Teams = b.series.filter((s) => s.round === 2).flatMap((s) => [s.teamA, s.teamB]);
    expect(r2Teams.filter(Boolean).sort()).toEqual(["T1", "T2", "T3", "T4"]);
    // Ningún BYE contra BYE y ningún equipo repetido
    const r1 = b.series.filter((s) => s.round === 1);
    expect(r1.every((s) => s.teamA || s.teamB)).toBe(true);
  });

  it.each([3, 5, 6, 7, 9, 13, 17, 31])("con %i equipos todos juegan o avanzan", (n) => {
    const b = generateSingleElimination(teams(n), { defaultBestOf: 1 });
    const size = nextPowerOfTwo(n);
    expect(b.byes).toBe(size - n);
    const r1 = b.series.filter((s) => s.round === 1);
    const present = r1.flatMap((s) => [s.teamA, s.teamB]).filter(Boolean);
    expect(present.sort()).toEqual(teams(n).sort());
    expect(r1.every((s) => s.teamA || s.teamB)).toBe(true);
  });

  it("los seeds 1 y 2 solo se cruzan en la final", () => {
    const b = generateSingleElimination(teams(16), { defaultBestOf: 1 });
    const r1 = b.series.filter((s) => s.round === 1);
    const pos1 = r1.find((s) => s.teamA === "T1" || s.teamB === "T1")!.position;
    const pos2 = r1.find((s) => s.teamA === "T2" || s.teamB === "T2")!.position;
    expect(pos1 <= 4).not.toBe(pos2 <= 4);
  });

  it("aplica BO por ronda y el plan de mapas", () => {
    const b = generateSingleElimination(teams(4), {
      defaultBestOf: 3,
      bestOfByRound: [3, 5],
      mapPlanByRound: [[{ modeId: "gem", mapId: "m1" }]],
    });
    const final = b.series.find((s) => s.round === 2)!;
    expect(final.bestOf).toBe(5);
    expect(final.games).toHaveLength(5);
    const semi = b.series.find((s) => s.round === 1)!;
    expect(semi.games[0]).toMatchObject({ modeId: "gem", mapId: "m1" });
  });

  it("rechaza menos de 2 equipos o repetidos", () => {
    expect(() => generateSingleElimination(["A"], { defaultBestOf: 1 })).toThrow();
    expect(() => generateSingleElimination(["A", "A"], { defaultBestOf: 1 })).toThrow();
  });
});

describe("series BO3", () => {
  it("A 1-0, 1-1, 2-1 → A gana y avanza", () => {
    let all = generateSingleElimination(teams(4), { defaultBestOf: 3 }).series;
    const key = "R1-M1";
    let r = reportGame(all, key, 1, "A");
    all = apply(all, r.changed);
    expect(r.decided).toBe(false);
    expect(all.find((s) => s.key === key)).toMatchObject({ scoreA: 1, scoreB: 0, status: "live" });

    r = reportGame(all, key, 2, "B");
    all = apply(all, r.changed);
    expect(all.find((s) => s.key === key)).toMatchObject({ scoreA: 1, scoreB: 1 });

    r = reportGame(all, key, 3, "A");
    all = apply(all, r.changed);
    expect(r.decided).toBe(true);
    expect(r.winnerTeam).toBe("T1");
    expect(r.eliminatedTeam).toBe("T4");
    expect(all.find((s) => s.key === "R2-M1")!.teamA).toBe("T1");
  });

  it("2-0 marca el game 3 como no jugado", () => {
    const all = generateSingleElimination(teams(2), { defaultBestOf: 3 }).series;
    const { state, result } = playSeries(all, "R1-M1", "B");
    const s = state[0];
    expect(s.games.map((g) => g.status)).toEqual(["finished", "finished", "skipped"]);
    expect(result.championTeam).toBe("T2");
  });

  it("no permite registrar games fuera de orden ni en series sin rival", () => {
    const all = generateSingleElimination(teams(4), { defaultBestOf: 3 }).series;
    expect(() => reportGame(all, "R1-M1", 2, "A")).toThrow();
    expect(() => reportGame(all, "R2-M1", 1, "A")).toThrow();
  });
});

describe("torneo completo", () => {
  it("16 equipos hasta el campeón, ganando siempre el seed más alto", () => {
    let all = generateSingleElimination(teams(16), { defaultBestOf: 3 }).series;
    const eliminated: string[] = [];
    let champion: string | null = null;
    for (let round = 1; round <= 4; round++) {
      for (const s of all.filter((x) => x.round === round)) {
        const current = all.find((x) => x.key === s.key)!;
        const seedA = Number(current.teamA!.slice(1));
        const seedB = Number(current.teamB!.slice(1));
        const { state, result } = playSeries(all, s.key, seedA < seedB ? "A" : "B");
        all = state;
        eliminated.push(result.eliminatedTeam!);
        champion = result.championTeam ?? champion;
      }
    }
    expect(champion).toBe("T1");
    expect(eliminated).toHaveLength(15);
    const final = all.find((s) => s.round === 4)!;
    expect([final.teamA, final.teamB].sort()).toEqual(["T1", "T2"]);
  });

  it("12 equipos con BYE: ronda 2 se completa con ganadores de ronda 1", () => {
    let all = generateSingleElimination(teams(12), { defaultBestOf: 1 }).series;
    for (const s of all.filter((x) => x.round === 1 && !x.isBye)) {
      all = playSeries(all, s.key, "A").state;
    }
    const r2 = all.filter((s) => s.round === 2);
    expect(r2.every((s) => s.teamA && s.teamB && s.status === "pending")).toBe(true);
  });
});

describe("correcciones", () => {
  it("deshacer el game que definió la serie saca al ganador de la siguiente", () => {
    let all = generateSingleElimination(teams(4), { defaultBestOf: 1 }).series;
    all = playSeries(all, "R1-M1", "A").state;
    expect(all.find((s) => s.key === "R2-M1")!.teamA).toBe("T1");

    const c = undoGame(all, "R1-M1");
    all = apply(all, c.changed);
    expect(c.reactivatedTeams).toEqual(["T4"]);
    expect(all.find((s) => s.key === "R1-M1")).toMatchObject({ winnerSlot: null, status: "pending" });
    expect(all.find((s) => s.key === "R2-M1")).toMatchObject({ teamA: null, status: "waiting" });
  });

  it("no deja corregir si la siguiente serie ya empezó", () => {
    let all = generateSingleElimination(teams(4), { defaultBestOf: 3 }).series;
    all = playSeries(all, "R1-M1", "A").state;
    all = playSeries(all, "R1-M2", "A").state;
    all = apply(all, reportGame(all, "R2-M1", 1, "A").changed);
    expect(() => undoGame(all, "R1-M1")).toThrow(/siguiente serie/);
    expect(() => resetSeries(all, "R1-M1")).toThrow(/siguiente serie/);
  });

  it("deshacer la final revoca al campeón", () => {
    let all = generateSingleElimination(teams(2), { defaultBestOf: 1 }).series;
    all = playSeries(all, "R1-M1", "A").state;
    const c = undoGame(all, "R1-M1");
    expect(c.championRevoked).toBe(true);
    expect(c.reactivatedTeams).toEqual(["T2"]);
  });

  it("walkover avanza al equipo y se puede reiniciar", () => {
    let all = generateSingleElimination(teams(4), { defaultBestOf: 3 }).series;
    const w = walkover(all, "R1-M2", "B");
    all = apply(all, w.changed);
    expect(w.winnerTeam).toBe("T3");
    expect(all.find((s) => s.key === "R2-M1")!.teamB).toBe("T3");

    const r = resetSeries(all, "R1-M2");
    all = apply(all, r.changed);
    expect(all.find((s) => s.key === "R1-M2")).toMatchObject({ walkover: false, status: "pending" });
    expect(all.find((s) => s.key === "R2-M1")!.teamB).toBeNull();
  });

  it("un BYE no se puede reiniciar", () => {
    const all = generateSingleElimination(teams(3), { defaultBestOf: 1 }).series;
    const bye = all.find((s) => s.isBye)!;
    expect(() => resetSeries(all, bye.key)).toThrow();
  });
});

describe("suggestRoundPlan", () => {
  const pool = [
    { modeId: "gem", mapId: "g1" },
    { modeId: "gem", mapId: "g2" },
    { modeId: "ball", mapId: "b1" },
    { modeId: "heist", mapId: "h1" },
    { modeId: "ko", mapId: "k1" },
    { modeId: "ko", mapId: "k2" },
  ];

  it("no repite modo dentro de una serie", () => {
    for (let round = 1; round <= 5; round++) {
      expect(repeatedModes(suggestRoundPlan(pool, 3, round))).toEqual([]);
    }
  });

  it("rota modos y mapas entre rondas", () => {
    const r1 = suggestRoundPlan(pool, 3, 1).map((g) => g.mapId);
    const r2 = suggestRoundPlan(pool, 3, 2).map((g) => g.mapId);
    expect(r1).toEqual(["g1", "b1", "h1"]);
    expect(r2).toEqual(["k1", "g2", "b1"]);
  });

  it("con pool vacío devuelve games sin mapa", () => {
    expect(suggestRoundPlan([], 3, 1)).toEqual([
      { modeId: null, mapId: null },
      { modeId: null, mapId: null },
      { modeId: null, mapId: null },
    ]);
  });
});

describe("randomSeriesPlan", () => {
  const pool = [
    { modeId: "gem", mapId: "g1" },
    { modeId: "gem", mapId: "g2" },
    { modeId: "ball", mapId: "b1" },
    { modeId: "heist", mapId: "h1" },
    { modeId: "ko", mapId: "k1" },
    { modeId: "ko", mapId: "k2" },
  ];

  it("no repite modo dentro de una serie y usa mapas del pool", () => {
    for (let i = 0; i < 200; i++) {
      const plan = randomSeriesPlan(pool, 3);
      expect(repeatedModes(plan)).toEqual([]);
      for (const g of plan) expect(pool).toContainEqual({ modeId: g.modeId, mapId: g.mapId });
    }
  });

  it("no siempre empieza con el mismo modo", () => {
    const firsts = new Set(Array.from({ length: 200 }, () => randomSeriesPlan(pool, 1)[0].modeId));
    expect(firsts.size).toBe(4);
  });

  it("si el BO es mayor que la cantidad de modos, repite lo mínimo", () => {
    const plan = randomSeriesPlan(pool.filter((m) => m.modeId === "gem" || m.modeId === "ko"), 5);
    expect(plan).toHaveLength(5);
    expect(plan.every((g) => g.mapId)).toBe(true);
  });

  it("con pool vacío devuelve games sin mapa", () => {
    expect(randomSeriesPlan([], 2)).toEqual([
      { modeId: null, mapId: null },
      { modeId: null, mapId: null },
    ]);
  });
});
