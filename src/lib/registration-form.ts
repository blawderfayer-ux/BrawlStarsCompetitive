import "server-only";
import { str } from "./action-result";
import { adminRegistrationSchema, registrationSchema, type RegistrationInput } from "./services/registrations";

/**
 * Lee el formulario de inscripción (mismo formato para inscribir, corregir y editar desde el panel).
 * Desde el panel (`admin`) se aceptan equipos incompletos y sin contacto.
 */
export function parseRegistrationForm(form: FormData, teamSize: number, admin = false): RegistrationInput {
  const member = (prefix: string) => ({ name: str(form, `${prefix}Name`), tag: str(form, `${prefix}Tag`) });
  let players = Array.from({ length: Math.max(0, teamSize - 1) }, (_, i) => member(`player${i + 2}`));
  if (admin) players = players.filter((p) => p.name || p.tag);
  const sub = member("sub");
  return (admin ? adminRegistrationSchema : registrationSchema).parse({
    teamName: str(form, "teamName"),
    color: str(form, "color") || "#3b82f6",
    captainContact: str(form, "captainContact"),
    captain: member("captain"),
    players,
    sub: sub.name || sub.tag ? sub : null,
  });
}
