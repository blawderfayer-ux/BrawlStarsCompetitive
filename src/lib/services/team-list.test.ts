import { describe, expect, it } from "vitest";
import { parseTeamList } from "./team-list";

describe("parseTeamList", () => {
  it("lee la lista pegada de WhatsApp", () => {
    const teams = parseTeamList(`Equipos de brawl
1.- Enginner team
-steven
-iker
-mario
5 los papus misteriosos
-julioby2006
- reytilin
Los pura boca Z4
-IAN
7.- Los Viola Derecks
•.  David
•  Erick #2pp0y8q
11.-The masters
-mikasita`);
    expect(teams.map((t) => t.name)).toEqual([
      "Enginner team",
      "los papus misteriosos",
      "Los pura boca Z4",
      "Los Viola Derecks",
      "The masters",
    ]);
    expect(teams[0].players.map((p) => p.name)).toEqual(["steven", "iker", "mario"]);
    expect(teams[1].players.map((p) => p.name)).toEqual(["julioby2006", "reytilin"]);
    expect(teams[3].players).toEqual([
      { name: "David", tag: "" },
      { name: "Erick", tag: "#2PP0Y8Q" },
    ]);
  });
});
