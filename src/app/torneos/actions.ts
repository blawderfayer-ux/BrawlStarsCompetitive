"use server";

import { headers } from "next/headers";
import { file, runAction, str, type ActionResult } from "@/lib/action-result";
import { parseRegistrationForm } from "@/lib/registration-form";
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
