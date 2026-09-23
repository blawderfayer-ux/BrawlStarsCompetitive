import "server-only";
import { str } from "./action-result";
import { registrationSchema, type RegistrationInput } from "./services/registrations";

/** Lee el formulario de inscripción (mismo formato para inscribir, corregir y editar desde el panel). */
export function parseRegistrationForm(form: FormData, teamSize: number): RegistrationInput {
  const member = (prefix: string) => ({ name: str(form, `${prefix}Name`), tag: str(form, `${prefix}Tag`) });
  const players = Array.from({ length: Math.max(0, teamSize - 1) }, (_, i) => member(`player${i + 2}`));
  const sub = member("sub");
  return registrationSchema.parse({
    teamName: str(form, "teamName"),
    color: str(form, "color") || "#3b82f6",
    captainContact: str(form, "captainContact"),
    captain: member("captain"),
    players,
    sub: sub.name || sub.tag ? sub : null,
  });
}
