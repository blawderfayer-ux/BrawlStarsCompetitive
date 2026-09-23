"use server";

import { redirect } from "next/navigation";
import { file, num, runAction, str, type ActionResult } from "@/lib/action-result";
import { createSession, destroySession, requireStaff } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import type { Slot } from "@/lib/bracket";
import { connectDB } from "@/lib/db";
import { parseRegistrationForm } from "@/lib/registration-form";
import {
  createFirstAdmin,
  createStaffUser,
  saveMap,
  saveMode,
  seedCatalog,
  updateStaffUser,
} from "@/lib/services/catalog";
import {
  declareWalkover,
  reportGameResult,
  resetSeriesResult,
  scheduleSeries,
  setSeriesGameMap,
  setSeriesStatus,
  undoLastGameResult,
  type ManualSeriesStatus,
} from "@/lib/services/matches";
import {
  adminUpdateTeam,
  importTeams,
  reviewRegistration,
  setTeamCheck,
  setTeamSeed,
  type ReviewAction,
} from "@/lib/services/registrations";
import {
  createTournament,
  deleteTournament,
  disqualifyTeam,
  generateBracket,
  resetBracket,
  setMapPool,
  setTournamentStatus,
  updateRoundPlan,
  updateTournament,
  type SeedingMethod,
  type TournamentInput,
} from "@/lib/services/tournaments";
import { regenerateAccessCode } from "@/lib/services/room";
import { UserError } from "@/lib/services/tx";
import { parseLocalDateTime } from "@/lib/utils";
import { User, type StaffRole, type TournamentStatus } from "@/models";

type Result = ActionResult | null;

/* ─────────────── Sesión ─────────────── */

export async function loginAction(_prev: Result, form: FormData): Promise<ActionResult> {
  const email = str(form, "email").toLowerCase();
  const password = str(form, "password");
  await connectDB();
  const user = await User.findOne({ email }).lean();
  // Mismo mensaje para email o contraseña incorrectos.
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "Email o contraseña incorrectos." };
  }
  await createSession(String(user._id));
  redirect("/admin");
}

export async function setupAction(_prev: Result, form: FormData): Promise<ActionResult> {
  let userId = "";
  const res = await runAction(async () => {
    if (str(form, "password") !== str(form, "password2")) throw new UserError("Las contraseñas no coinciden.");
    userId = await createFirstAdmin({
      name: str(form, "name"),
      email: str(form, "email"),
      password: str(form, "password"),
    });
  });
  if (!res.ok) return res;
  await createSession(userId);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

/* ─────────────── Torneos ─────────────── */

/** Solo rutas internas (/img/…) o URLs https, para no inyectar esquemas raros en <img>. */
function safePosterUrl(value: string) {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    return new URL(value).protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

function tournamentInput(form: FormData): TournamentInput {
  const bestOfByRound = str(form, "bestOfByRound")
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number);
  return {
    name: str(form, "name"),
    slug: str(form, "slug") || undefined,
    description: str(form, "description"),
    startsAt: parseLocalDateTime(str(form, "startsAt")),
    maxTeams: Math.min(128, Math.max(2, num(form, "maxTeams", 16))),
    defaultBestOf: num(form, "defaultBestOf", 3),
    bestOfByRound,
    roundDurationMinutes: Math.max(5, num(form, "roundDurationMinutes", 30)),
    rules: str(form, "rules"),
    posterUrl: safePosterUrl(str(form, "posterUrl")),
  };
}

export async function createTournamentAction(_prev: Result, form: FormData): Promise<ActionResult> {
  let slug = "";
  const res = await runAction(async () => {
    const user = await requireStaff(["admin"]);
    const input = tournamentInput(form);
    if (input.name.length < 3) throw new UserError("El nombre es muy corto.");
    slug = (await createTournament(input, user.id)).slug;
  });
  if (!res.ok) return res;
  redirect(`/admin/torneos/${slug}`);
}

export async function updateTournamentAction(_prev: Result, form: FormData): Promise<ActionResult> {
  let slug = "";
  const originalSlug = str(form, "originalSlug");
  const res = await runAction(async () => {
    const user = await requireStaff(["admin"]);
    slug = (await updateTournament(str(form, "id"), tournamentInput(form), user.id)).slug;
  }, "Configuración guardada.");
  if (res.ok && slug !== originalSlug) redirect(`/admin/torneos/${slug}/configuracion`);
  return res;
}

export async function setTournamentStatusAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    await setTournamentStatus(str(form, "id"), str(form, "status") as TournamentStatus, user.id);
  }, "Estado actualizado.");
}

export async function deleteTournamentAction(_prev: Result, form: FormData): Promise<ActionResult> {
  const res = await runAction(async () => {
    await requireStaff(["admin"]);
    await deleteTournament(str(form, "id"));
  });
  if (res.ok) redirect("/admin");
  return res;
}

export async function setMapPoolAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    await setMapPool(str(form, "id"), form.getAll("maps").map(String), user.id);
  }, "Pool de mapas guardado.");
}

export async function generateBracketAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    await generateBracket(str(form, "id"), (str(form, "seeding") || "random") as SeedingMethod, user.id);
  }, "¡Bracket generado!");
}

export async function resetBracketAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    if (str(form, "confirm") !== "REINICIAR") throw new UserError("Escribe REINICIAR para confirmar.");
    await resetBracket(str(form, "id"), user.id);
  }, "Bracket reiniciado.");
}

export async function updateRoundPlanAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    const games = num(form, "games", 0);
    const plan = Array.from({ length: games }, (_, i) => {
      const [modeId, mapId] = str(form, `game${i + 1}`).split(":");
      return { modeId: modeId || null, mapId: mapId || null };
    });
    const { updated } = await updateRoundPlan(str(form, "id"), num(form, "round"), plan, user.id);
    return updated;
  }, "Mapas de la ronda guardados.");
}

/* ─────────────── Inscripciones y equipos ─────────────── */

export async function reviewRegistrationAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    await reviewRegistration(str(form, "teamId"), str(form, "action") as ReviewAction, str(form, "note"), user.id);
  }, "Inscripción actualizada.");
}

export async function adminUpdateTeamAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    const input = parseRegistrationForm(form, num(form, "teamSize", 3), true);
    await adminUpdateTeam(str(form, "teamId"), input, file(form, "logo"), user.id);
  }, "Equipo actualizado.");
}

export async function importTeamsAction(_prev: Result, form: FormData): Promise<ActionResult> {
  const res = await runAction(async () => {
    const user = await requireStaff(["admin"]);
    return importTeams(str(form, "id"), str(form, "list"), form.get("approve") === "on", user.id);
  });
  if (!res.ok || !res.data) return res;
  const r = res.data as { created: string[]; skipped: string[]; incomplete: string[] };
  const parts = [`${r.created.length} equipos importados.`];
  if (r.skipped.length) parts.push(`Ya existían (omitidos): ${r.skipped.join(", ")}.`);
  if (r.incomplete.length) parts.push(`Con menos de 3 jugadores: ${r.incomplete.join(", ")}.`);
  return { ok: true, message: parts.join(" ") };
}

export async function regenerateCodeAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff(["admin"]);
    await regenerateAccessCode(str(form, "teamId"));
  }, "Código nuevo generado.");
}

export async function setTeamCheckAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff();
    const field = str(form, "field") === "paid" ? "paid" : "idsChecked";
    await setTeamCheck(str(form, "teamId"), field, str(form, "value") === "true");
  });
}

export async function setTeamSeedAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff(["admin"]);
    await setTeamSeed(str(form, "teamId"), num(form, "seed", 0) || null);
  }, "Seed guardado.");
}

export async function disqualifyTeamAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    await disqualifyTeam(str(form, "teamId"), user.id);
  }, "Equipo descalificado.");
}

/* ─────────────── Partidas (admin y árbitros) ─────────────── */

export async function reportGameAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff();
    const res = await reportGameResult(str(form, "seriesId"), num(form, "game"), str(form, "slot") as Slot, user.id);
    return res.decided;
  }, "Resultado registrado.");
}

export async function undoGameAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff();
    await undoLastGameResult(str(form, "seriesId"), user.id);
  }, "Último resultado deshecho.");
}

export async function walkoverAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    await declareWalkover(str(form, "seriesId"), str(form, "slot") as Slot, user.id);
  }, "Walkover registrado.");
}

export async function resetSeriesAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    await resetSeriesResult(str(form, "seriesId"), user.id);
  }, "Serie reiniciada.");
}

export async function setSeriesStatusAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff();
    await setSeriesStatus(str(form, "seriesId"), str(form, "status") as ManualSeriesStatus, user.id);
  }, "Estado de la partida actualizado.");
}

export async function scheduleSeriesAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff();
    await scheduleSeries(str(form, "seriesId"), parseLocalDateTime(str(form, "scheduledAt")), str(form, "notes"), user.id);
  }, "Horario guardado.");
}

export async function setSeriesGameMapAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    const [modeId, mapId] = str(form, "value").split(":");
    await setSeriesGameMap(str(form, "seriesId"), num(form, "game"), modeId || null, mapId || null, user.id);
  }, "Mapa actualizado.");
}

/* ─────────────── Catálogo y staff ─────────────── */

export async function seedCatalogAction(): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff(["admin"]);
    const r = await seedCatalog();
    return r;
  }, "Catálogo BSC 2026 cargado.");
}

export async function saveModeAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff(["admin"]);
    await saveMode(str(form, "id") || null, {
      name: str(form, "name"),
      icon: str(form, "icon") || "🎮",
      color: str(form, "color") || "#7c3aed",
      description: str(form, "description"),
      active: form.get("active") === "on",
    });
  }, "Modo guardado.");
}

export async function saveMapAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff(["admin"]);
    await saveMap(str(form, "id") || null, {
      name: str(form, "name"),
      modeId: str(form, "modeId"),
      active: form.get("active") === "on",
    });
  }, "Mapa guardado.");
}

export async function createStaffAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireStaff(["admin"]);
    await createStaffUser({
      name: str(form, "name"),
      email: str(form, "email"),
      password: str(form, "password"),
      role: str(form, "role") as StaffRole,
    });
  }, "Usuario creado.");
}

export async function updateStaffAction(_prev: Result, form: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff(["admin"]);
    const active = str(form, "active");
    await updateStaffUser(str(form, "userId"), user.id, {
      role: (str(form, "role") || undefined) as StaffRole | undefined,
      active: active ? active === "true" : undefined,
      password: str(form, "password") || undefined,
    });
  }, "Usuario actualizado.");
}
