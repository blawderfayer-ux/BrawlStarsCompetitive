import "server-only";
import { randomInt } from "node:crypto";
import { Types } from "mongoose";
import { connectDB } from "../db";
import type { RoomAccess } from "../team-session";
import { ChatMessage, Series, Team, TournamentEvent, type SeriesDoc } from "@/models";
import { UserError } from "./tx";

// Sin letras/números que se confunden (0/O, 1/I/L) para dictarlo por WhatsApp.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newAccessCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

/** Genera el código de acceso de los equipos aprobados que todavía no tienen uno. */
export async function ensureAccessCodes(tournamentId: string) {
  await connectDB();
  const missing = await Team.find(
    { tournament: tournamentId, registrationStatus: "approved", $or: [{ accessCode: "" }, { accessCode: { $exists: false } }] },
    { _id: 1 },
  ).lean();
  for (const t of missing) {
    await Team.updateOne({ _id: t._id, $or: [{ accessCode: "" }, { accessCode: { $exists: false } }] }, { $set: { accessCode: newAccessCode() } });
  }
}

export async function regenerateAccessCode(teamId: string) {
  await connectDB();
  await Team.updateOne({ _id: teamId }, { $set: { accessCode: newAccessCode() } });
}

/** Verifica el código de un equipo del torneo. Devuelve el id del equipo si es correcto. */
export async function checkTeamCode(tournamentId: string, teamId: string, code: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(teamId)) throw new UserError("Elige tu equipo.");
  const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
  const team = await Team.findOne({ _id: teamId, tournament: tournamentId, registrationStatus: "approved" }, { accessCode: 1 }).lean();
  if (!team || !team.accessCode || team.accessCode !== normalized) {
    throw new UserError("Código incorrecto. Pídeselo a la organización.");
  }
  return String(team._id);
}

/* ─────────────── Mensajes ─────────────── */

export interface ChatMessageView {
  id: string;
  authorType: "team" | "staff" | "system";
  teamId: string | null;
  authorName: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
}

export async function listMessages(seriesId: string, after?: Date): Promise<ChatMessageView[]> {
  await connectDB();
  const msgs = await ChatMessage.find(
    { series: seriesId, ...(after && !Number.isNaN(after.getTime()) ? { createdAt: { $gt: after } } : {}) },
    { image: 0 },
  )
    .sort({ createdAt: 1 })
    .limit(300)
    .lean();
  return msgs.map((m) => ({
    id: String(m._id),
    authorType: m.authorType,
    teamId: m.team ? String(m.team) : null,
    authorName: m.authorName,
    text: m.text,
    imageUrl: m.hasImage ? `/api/sala/imagen/${m._id}` : null,
    createdAt: m.createdAt.toISOString(),
  }));
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX = 1.5 * 1024 * 1024;

export async function postMessage(series: SeriesDoc, access: RoomAccess, text: string, image: File | null) {
  if (access.kind === "none") throw new UserError("No tienes acceso a esta sala.");
  const body = text.trim().slice(0, 600);
  if (!body && !image) throw new UserError("Escribe un mensaje o adjunta una foto.");
  if (image && (!IMAGE_TYPES.includes(image.type) || image.size > IMAGE_MAX)) {
    throw new UserError("La foto debe ser JPG, PNG o WEBP de menos de 1.5 MB.");
  }
  await connectDB();
  if (access.kind === "team") {
    const recent = await ChatMessage.countDocuments({
      series: series._id,
      team: access.teamId,
      createdAt: { $gte: new Date(Date.now() - 60_000) },
    });
    if (recent >= 20) throw new UserError("Estás enviando muchos mensajes. Espera un momento.");
  }
  await ChatMessage.create({
    tournament: series.tournament,
    series: series._id,
    authorType: access.kind,
    team: access.kind === "team" ? access.teamId : null,
    authorName: access.kind === "staff" ? `Árbitro · ${access.name}` : access.name,
    text: body,
    hasImage: !!image,
    image: image ? { data: Buffer.from(await image.arrayBuffer()), contentType: image.type } : null,
  });
}

export async function systemMessage(series: Pick<SeriesDoc, "_id" | "tournament">, text: string) {
  await ChatMessage.create({
    tournament: series.tournament,
    series: series._id,
    authorType: "system",
    authorName: "Sistema",
    text,
  });
}

/* ─────────────── Reportes de resultado ─────────────── */

/**
 * Un equipo informa quién ganó el game actual. No cambia el marcador: queda pendiente
 * hasta que el árbitro lo confirma desde el panel.
 */
export async function reportResult(seriesId: string, access: RoomAccess, game: number, winnerSlot: "A" | "B") {
  if (access.kind !== "team") throw new UserError("Solo los equipos de la partida pueden reportar.");
  await connectDB();
  const series = await Series.findById(seriesId);
  if (!series) throw new UserError("La partida no existe.");
  if (series.winnerSlot) throw new UserError("La serie ya terminó.");
  const current = series.games.find((g) => g.status === "pending");
  if (!current || current.number !== game) throw new UserError("Ese game ya fue registrado. Recarga la página.");

  const reports = (series.reports ?? []).filter((r) => !(r.game === game && String(r.team) === access.teamId));
  reports.push({ game, team: new Types.ObjectId(access.teamId), winnerSlot, createdAt: new Date() });
  series.reports = reports;
  await series.save();

  const teamIds = [series.teamA, series.teamB].map((t) => (t ? String(t) : ""));
  const names = await Team.find({ _id: { $in: teamIds.filter(Boolean) } }, { name: 1 }).lean();
  const nameOf = (slot: "A" | "B") =>
    names.find((n) => String(n._id) === teamIds[slot === "A" ? 0 : 1])?.name ?? `Equipo ${slot}`;

  await systemMessage(series, `${access.name} reportó el game ${game}: ganó ${nameOf(winnerSlot)}. Esperando confirmación del árbitro.`);

  const forGame = reports.filter((r) => r.game === game);
  const disagree = forGame.length === 2 && forGame[0].winnerSlot !== forGame[1].winnerSlot;
  if (disagree) {
    await systemMessage(series, `Los equipos reportaron resultados distintos en el game ${game}. El árbitro revisará.`);
    await TournamentEvent.create({
      tournament: series.tournament,
      type: "series_updated",
      message: `Reportes distintos en la partida #${series.number}, game ${game}.`,
      public: false,
      series: series._id,
    });
  }
}

export interface ReportView {
  game: number;
  teamId: string;
  winnerSlot: "A" | "B";
}

export function reportsForGame(series: Pick<SeriesDoc, "reports">, game: number): ReportView[] {
  return (series.reports ?? [])
    .filter((r) => r.game === game)
    .map((r) => ({ game: r.game, teamId: String(r.team), winnerSlot: r.winnerSlot }));
}
