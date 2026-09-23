/**
 * Regla de la entrada del torneo PIXEL: si al menos 2 de los 3 titulares son de la FICCT,
 * el equipo no paga; si 2 o más son de otra facultad, paga 10 Bs. El suplente no cuenta.
 */
export const ENTRY_FEE_BS = 10;
export const FICCT_MIN_STARTERS = 2;

export type FeeStatus = "free" | "pays" | "unknown";

export function feeStatus(members: { role: string; ficct: boolean | null }[]): FeeStatus {
  const starters = members.filter((m) => m.role !== "sub");
  const ficct = starters.filter((m) => m.ficct === true).length;
  const unknown = starters.filter((m) => m.ficct === null || m.ficct === undefined).length;
  if (ficct >= FICCT_MIN_STARTERS) return "free";
  if (ficct + unknown < FICCT_MIN_STARTERS) return "pays";
  return "unknown";
}
