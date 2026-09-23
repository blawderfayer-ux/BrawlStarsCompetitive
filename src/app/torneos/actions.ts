"use server";

import { headers } from "next/headers";
import { file, runAction, str, type ActionResult } from "@/lib/action-result";
import { parseRegistrationForm } from "@/lib/registration-form";
import { checkTeamCode, reportResult } from "@/lib/services/room";
import { createTeamSession, destroyTeamSession, loadSeriesWithAccess } from "@/lib/team-session";
import { UserError } from "@/lib/services/tx";
import {
  submitRegistration,
  updateRegistrationByToken,
  withdrawRegistration,
} from "@/lib/services/registrations";

export async function registerTeamAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult<{ token: string }>> {
  // Trampa para bots: un campo oculto que las personas no llenan.
  if (str(form, "website")) return { ok: false, error: "No se pudo enviar la inscripción." };
  const slug = str(form, "tournamentSlug");
  const teamSize = Number(str(form, "teamSize")) || 3;
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return runAction(async () => {
    const input = parseRegistrationForm(form, teamSize);
    return submitRegistration(slug, input, file(form, "logo"), ip);
  });
}

export async function updateRegistrationAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const token = str(form, "token");
  const teamSize = Number(str(form, "teamSize")) || 3;
  return runAction(async () => {
    const input = parseRegistrationForm(form, teamSize);
    await updateRegistrationByToken(token, input, file(form, "logo"));
  }, "Inscripción actualizada. Vuelve a quedar PENDIENTE de revisión.");
}

export async function withdrawRegistrationAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return runAction(() => withdrawRegistration(str(form, "token")), "Inscripción retirada.");
}

/** El capitán entra a la sala de su partida con el código de su equipo. */
export async function teamLoginAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const teamId = await checkTeamCode(str(form, "tournamentId"), str(form, "teamId"), str(form, "code"));
    await createTeamSession(teamId);
    return teamId;
  }, "¡Listo! Ya estás en la sala de tu partida.");
}

export async function teamLogoutAction() {
  await destroyTeamSession();
}

/** El equipo reporta quién ganó el game actual (el árbitro lo confirma). */
export async function reportResultAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const seriesId = str(form, "seriesId");
    const found = await loadSeriesWithAccess(seriesId);
    if (!found) throw new UserError("La partida no existe.");
    const outcome = str(form, "outcome");
    if (found.access.kind !== "team") throw new UserError("Entra con el código de tu equipo para reportar.");
    const mine = found.access.slot;
    const winnerSlot = outcome === "win" ? mine : mine === "A" ? "B" : "A";
    await reportResult(seriesId, found.access, Number(str(form, "game")), winnerSlot);
  }, "Resultado enviado. El árbitro lo confirmará en breve.");
}
