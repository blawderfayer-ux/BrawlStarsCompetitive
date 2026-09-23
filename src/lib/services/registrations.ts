import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "../db";
import { slugify } from "../utils";
import { Team, TeamLogo, Tournament, TournamentEvent, type RegistrationStatus } from "@/models";
import { TAG_RE, normalizeTag, parseTeamList } from "./team-list";
import { UserError } from "./tx";


const memberSchema = z.object({
  ficct: z.boolean().nullable().default(null),
  name: z.string().trim().min(1, "Falta el nombre de un jugador").max(40),
  tag: z
    .string()
    .transform(normalizeTag)
    .refine((t) => t === "" || TAG_RE.test(t), "Tag inválido (ejemplo: #2PP0Y8Q)"),
});

export const registrationSchema = z.object({
  teamName: z.string().trim().min(2, "El nombre del equipo es muy corto").max(32, "Máximo 32 caracteres"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b82f6"),
  captainContact: z.string().trim().min(5, "Deja un contacto (WhatsApp, Discord…)").max(80),
  captain: memberSchema,
  players: z.array(memberSchema),
  sub: memberSchema.nullable(),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

/** Para el panel: el contacto puede quedar vacío (equipos importados). */
export const adminRegistrationSchema = registrationSchema.extend({
  captainContact: z.string().trim().max(80),
});

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const LOGO_MAX_BYTES = 300 * 1024;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashIp(ip: string) {
  return createHash("sha256").update(`${process.env.SESSION_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);
}

function buildMembers(input: RegistrationInput, teamSize: number, allowIncomplete = false) {
  if (allowIncomplete ? input.players.length > teamSize - 1 : input.players.length !== teamSize - 1) {
    throw new UserError(`El equipo debe tener ${teamSize} jugadores titulares.`);
  }
  const members = [
    { ...input.captain, role: "captain" as const },
    ...input.players.map((p) => ({ ...p, role: "player" as const })),
    ...(input.sub ? [{ ...input.sub, role: "sub" as const }] : []),
  ];
  const tags = members.map((m) => m.tag).filter(Boolean);
  if (new Set(tags).size !== tags.length) throw new UserError("Hay tags de jugador repetidos.");
  return members;
}

async function assertNoDuplicates(tournamentId: Types.ObjectId, name: string, tags: string[], exceptTeam?: Types.ObjectId) {
  const active = { $in: ["pending", "needs_changes", "approved"] as RegistrationStatus[] };
  const base = { tournament: tournamentId, registrationStatus: active, ...(exceptTeam ? { _id: { $ne: exceptTeam } } : {}) };
  const sameName = await Team.findOne({ ...base, slug: slugify(name) }, { _id: 1 }).lean();
  if (sameName) throw new UserError("Ya hay un equipo inscrito con ese nombre.");
  tags = tags.filter(Boolean);
  if (tags.length === 0) return;
  const sameTag = await Team.findOne({ ...base, "members.tag": { $in: tags } }, { name: 1, members: 1 }).lean();
  if (sameTag) {
    const tag = sameTag.members.find((m) => tags.includes(m.tag))?.tag;
    throw new UserError(`El jugador ${tag} ya está inscrito en otro equipo (${sameTag.name}).`);
  }
}

async function uniqueSlug(tournamentId: Types.ObjectId, name: string, exceptTeam?: Types.ObjectId) {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; await Team.exists({ tournament: tournamentId, slug, ...(exceptTeam ? { _id: { $ne: exceptTeam } } : {}) }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

async function saveLogo(teamId: Types.ObjectId, logo: File | null) {
  if (!logo || logo.size === 0) return false;
  if (!LOGO_TYPES.includes(logo.type)) throw new UserError("El logo debe ser PNG, JPG o WEBP.");
  if (logo.size > LOGO_MAX_BYTES) throw new UserError("El logo es muy pesado (máximo 300 KB).");
  const data = Buffer.from(await logo.arrayBuffer());
  await TeamLogo.updateOne(
    { team: teamId },
    { $set: { data, contentType: logo.type, updatedAt: new Date() } },
    { upsert: true },
  );
  return true;
}

export async function submitRegistration(
  tournamentSlug: string,
  input: RegistrationInput,
  logo: File | null,
  ip: string,
) {
  await connectDB();
  const t = await Tournament.findOne({ slug: tournamentSlug }).lean();
  if (!t || t.status !== "registration_open") throw new UserError("Las inscripciones de este torneo están cerradas.");

  const ipHash = hashIp(ip);
  const recent = await Team.countDocuments({
    ipHash,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (recent >= 5) throw new UserError("Demasiadas inscripciones desde esta conexión. Intenta más tarde.");

  const approved = await Team.countDocuments({ tournament: t._id, registrationStatus: "approved" });
  if (approved >= t.maxTeams) throw new UserError("El torneo ya alcanzó el máximo de equipos.");

  const members = buildMembers(input, t.teamSize ?? 3);
  await assertNoDuplicates(t._id, input.teamName, members.map((m) => m.tag));

  const token = randomBytes(24).toString("base64url");
  const team = await Team.create({
    tournament: t._id,
    name: input.teamName,
    slug: await uniqueSlug(t._id, input.teamName),
    color: input.color,
    captainContact: input.captainContact,
    members,
    editTokenHash: hashToken(token),
    ipHash,
  });
  if (await saveLogo(team._id, logo)) {
    await Team.updateOne({ _id: team._id }, { $set: { hasLogo: true } });
  }
  await TournamentEvent.create({
    tournament: t._id,
    type: "registration_submitted",
    message: `Nueva inscripción: ${team.name}.`,
    public: false,
  });
  return { token };
}

export async function findTeamByToken(token: string) {
  await connectDB();
  if (!token || token.length < 20) return null;
  const team = await Team.findOne({ editTokenHash: hashToken(token) }).lean();
  if (!team) return null;
  const tournament = await Tournament.findById(team.tournament, { name: 1, slug: 1, status: 1, teamSize: 1 }).lean();
  return tournament ? { team, tournament } : null;
}

/** El capitán corrige su inscripción (solo mientras esté pendiente o con corrección solicitada). */
export async function updateRegistrationByToken(token: string, input: RegistrationInput, logo: File | null) {
  const found = await findTeamByToken(token);
  if (!found) throw new UserError("Enlace inválido.");
  const { team, tournament } = found;
  if (!["pending", "needs_changes"].includes(team.registrationStatus)) {
    throw new UserError("Esta inscripción ya fue revisada y no se puede editar. Contacta a la organización.");
  }
  const members = buildMembers(input, tournament.teamSize ?? 3);
  await assertNoDuplicates(team.tournament, input.teamName, members.map((m) => m.tag), team._id);
  const hasLogo = (await saveLogo(team._id, logo)) || team.hasLogo;
  await Team.updateOne(
    { _id: team._id },
    {
      $set: {
        name: input.teamName,
        slug: await uniqueSlug(team.tournament, input.teamName, team._id),
        color: input.color,
        captainContact: input.captainContact,
        members,
        hasLogo,
        registrationStatus: "pending",
      },
    },
  );
  await TournamentEvent.create({
    tournament: team.tournament,
    type: "registration_submitted",
    message: `${input.teamName} corrigió su inscripción.`,
    public: false,
  });
}

export async function withdrawRegistration(token: string) {
  const found = await findTeamByToken(token);
  if (!found) throw new UserError("Enlace inválido.");
  if (found.team.registrationStatus === "approved" && found.tournament.status === "live") {
    throw new UserError("El torneo ya empezó. Contacta a la organización.");
  }
  await Team.updateOne({ _id: found.team._id }, { $set: { registrationStatus: "withdrawn" } });
}

export type ReviewAction = "approve" | "reject" | "needs_changes" | "pending";

export async function reviewRegistration(teamId: string, action: ReviewAction, note: string, actorId: string) {
  await connectDB();
  const team = await Team.findById(teamId);
  if (!team) throw new UserError("El equipo no existe.");
  const t = await Tournament.findById(team.tournament).lean();
  if (!t) throw new UserError("El torneo no existe.");
  if (t.bracketGeneratedAt && team.registrationStatus === "approved") {
    throw new UserError("El bracket ya está generado; usa 'Descalificar' en lugar de cambiar la inscripción.");
  }
  if (action === "approve") {
    if (t.bracketGeneratedAt) throw new UserError("El bracket ya está generado: no se pueden aprobar más equipos.");
    const approved = await Team.countDocuments({ tournament: t._id, registrationStatus: "approved" });
    if (approved >= t.maxTeams) throw new UserError(`Ya hay ${t.maxTeams} equipos aprobados (máximo del torneo).`);
  }
  const status = ({ approve: "approved", reject: "rejected", needs_changes: "needs_changes", pending: "pending" } as const)[action];
  team.registrationStatus = status;
  team.adminNote = note.slice(0, 500);
  await team.save();
  await TournamentEvent.create({
    tournament: team.tournament,
    type: "registration_reviewed",
    message:
      action === "approve"
        ? `${team.name} fue aprobado y ya forma parte del torneo.`
        : `Inscripción de ${team.name}: ${status}.`,
    public: action === "approve",
    actor: actorId,
  });
}

/** Edición directa por el admin (corrige nombres, tags, contacto o color). */
export async function adminUpdateTeam(teamId: string, input: RegistrationInput, logo: File | null, actorId: string) {
  await connectDB();
  const team = await Team.findById(teamId);
  if (!team) throw new UserError("El equipo no existe.");
  const t = await Tournament.findById(team.tournament).lean();
  const members = buildMembers(input, t?.teamSize ?? 3, true);
  await assertNoDuplicates(team.tournament, input.teamName, members.map((m) => m.tag), team._id);
  if (await saveLogo(team._id, logo)) team.hasLogo = true;
  team.set({
    name: input.teamName,
    slug: await uniqueSlug(team.tournament, input.teamName, team._id),
    color: input.color,
    captainContact: input.captainContact,
    members,
  });
  await team.save();
  await TournamentEvent.create({
    tournament: team.tournament,
    type: "registration_reviewed",
    message: `Datos de ${team.name} editados por la organización.`,
    public: false,
    actor: actorId,
  });
}

export async function setTeamSeed(teamId: string, seed: number | null) {
  await connectDB();
  await Team.updateOne({ _id: teamId }, { $set: { seed: seed && seed > 0 ? seed : null } });
}

export interface ImportResult {
  created: string[];
  skipped: string[];
  incomplete: string[];
}

/** Crea de una vez los equipos de una lista (por ejemplo, los inscritos por WhatsApp). */
export async function importTeams(tournamentId: string, text: string, approve: boolean, actorId: string): Promise<ImportResult> {
  await connectDB();
  const t = await Tournament.findById(tournamentId).lean();
  if (!t) throw new UserError("El torneo no existe.");
  if (t.bracketGeneratedAt) throw new UserError("El bracket ya está generado: no se pueden agregar equipos.");
  const parsed = parseTeamList(text);
  if (parsed.length === 0) throw new UserError("No encontré equipos en el texto. Revisa el formato del ejemplo.");

  const teamSize = t.teamSize ?? 3;
  let approved = await Team.countDocuments({ tournament: t._id, registrationStatus: "approved" });
  const result: ImportResult = { created: [], skipped: [], incomplete: [] };

  for (const entry of parsed) {
    const exists = await Team.exists({
      tournament: t._id,
      slug: slugify(entry.name),
      registrationStatus: { $in: ["pending", "needs_changes", "approved"] as RegistrationStatus[] },
    });
    if (exists) {
      result.skipped.push(entry.name);
      continue;
    }
    const members = entry.players.map((p, i) => ({
      name: p.name,
      tag: p.tag,
      role: (i === 0 ? "captain" : i < teamSize ? "player" : "sub") as "captain" | "player" | "sub",
    }));
    if (entry.players.length < teamSize) result.incomplete.push(entry.name);
    const canApprove = approve && approved < t.maxTeams;
    await Team.create({
      tournament: t._id,
      name: entry.name,
      slug: await uniqueSlug(t._id, entry.name),
      color: TEAM_COLORS[(approved + result.created.length) % TEAM_COLORS.length],
      members,
      registrationStatus: canApprove ? "approved" : "pending",
      editTokenHash: hashToken(randomBytes(24).toString("base64url")),
    });
    if (canApprove) approved++;
    result.created.push(entry.name);
  }

  await TournamentEvent.create({
    tournament: t._id,
    type: "registration_reviewed",
    message: `Se importaron ${result.created.length} equipos.`,
    public: false,
    actor: actorId,
  });
  return result;
}

const TEAM_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];

/** Control del día del torneo: pagó la entrada / mostró los carnets. */
export async function setTeamCheck(teamId: string, field: "paid" | "idsChecked", value: boolean) {
  await connectDB();
  await Team.updateOne({ _id: teamId }, { $set: { [field]: value } });
}
