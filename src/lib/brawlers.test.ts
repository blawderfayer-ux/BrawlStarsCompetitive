import { describe, expect, it } from "vitest";
import { cleanBans, revealedBans } from "./brawlers";

describe("bans", () => {
  it("limpia nombres, corrige mayúsculas de brawlers conocidos y quita repetidos", () => {
    expect(cleanBans(["  mina ", "KAZE", "", "Mina"], 2)).toEqual(["Mina", "Kaze"]);
    expect(cleanBans(["Brawler Nuevo"], 1)).toEqual(["Brawler Nuevo"]);
  });
  it("exige la cantidad exacta", () => {
    expect(() => cleanBans(["Mina", "mina"], 2)).toThrow();
    expect(() => cleanBans(["Mina", "Kaze", "Poco"], 2)).toThrow();
  });
  it("solo revela cuando los dos equipos enviaron", () => {
    expect(revealedBans([{ team: "a", brawlers: ["Mina"] }], "a", "b")).toBeNull();
    expect(revealedBans([{ team: "b", brawlers: ["Kaze"] }, { team: "a", brawlers: ["Mina"] }], "a", "b")).toEqual({ A: ["Mina"], B: ["Kaze"] });
  });
});
