import { describe, expect, it } from "vitest";
import { feeStatus } from "./entry-fee";

const team = (...ficct: (boolean | null)[]) =>
  ficct.map((f, i) => ({ role: i === 0 ? "captain" : i < 3 ? "player" : "sub", ficct: f }));

describe("feeStatus (regla PIXEL)", () => {
  it("3 de la FICCT: no paga", () => expect(feeStatus(team(true, true, true))).toBe("free"));
  it("2 de la FICCT y 1 de afuera: no paga", () => expect(feeStatus(team(true, false, true))).toBe("free"));
  it("1 de la FICCT y 2 de afuera: paga", () => expect(feeStatus(team(false, true, false))).toBe("pays"));
  it("ninguno de la FICCT: paga", () => expect(feeStatus(team(false, false, false))).toBe("pays"));
  it("el suplente no cuenta", () => {
    expect(feeStatus(team(true, false, false, true))).toBe("pays");
    expect(feeStatus(team(true, true, false, false))).toBe("free");
  });
  it("sin datos suficientes: por verificar", () => {
    expect(feeStatus(team(null, null, null))).toBe("unknown");
    expect(feeStatus(team(true, null, false))).toBe("unknown");
  });
  it("con 2 de afuera ya se sabe que paga aunque falte un dato", () => {
    expect(feeStatus(team(false, false, null))).toBe("pays");
  });
});
