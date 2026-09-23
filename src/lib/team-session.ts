import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { Types } from "mongoose";
import { cookies } from "next/headers";
import { cache } from "react";
import { getCurrentUser } from "./auth";
import { connectDB } from "./db";
import { Series, Team } from "@/models";

/**
 * Los jugadores no tienen cuenta: el capitán entra con el código de 6 caracteres de su equipo
 * y queda una cookie firmada que dice "soy del equipo X". Con eso puede usar la sala de su partida.
 */
const TEAM_COOKIE = "bt_team";
const DAYS = 3;

function key() {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
}

export async function createTeamSession(teamId: string) {
  const token = await new SignJWT({ kind: "team" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(teamId)
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(key());
  (await cookies()).set(TEAM_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DAYS * 24 * 60 * 60,
  });
}

export async function destroyTeamSession() {
  (await cookies()).delete(TEAM_COOKIE);
}

export interface TeamSession {
  teamId: string;
  tournamentId: string;
  name: string;
}

export const getTeamSession = cache(async (): Promise<TeamSession | null> => {
  const token = (await cookies()).get(TEAM_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.kind !== "team" || !payload.sub || !Types.ObjectId.isValid(payload.sub)) return null;
    await connectDB();
    const team = await Team.findById(payload.sub, { name: 1, tournament: 1, registrationStatus: 1 }).lean();
    if (!team || team.registrationStatus !== "approved") return null;
    return { teamId: String(team._id), tournamentId: String(team.tournament), name: team.name };
  } catch {
    return null;
  }
});

export type RoomAccess =
  | { kind: "none" }
  | { kind: "staff"; name: string; userId: string }
  | { kind: "team"; slot: "A" | "B"; teamId: string; name: string };

/** Quién puede ver la sala de una serie: el staff o los dos equipos que la juegan. */
export async function getRoomAccess(series: { teamA: unknown; teamB: unknown }): Promise<RoomAccess> {
  const user = await getCurrentUser();
  if (user) return { kind: "staff", name: user.name, userId: user.id };
  const team = await getTeamSession();
  if (!team) return { kind: "none" };
  if (series.teamA && String(series.teamA) === team.teamId) return { kind: "team", slot: "A", teamId: team.teamId, name: team.name };
  if (series.teamB && String(series.teamB) === team.teamId) return { kind: "team", slot: "B", teamId: team.teamId, name: team.name };
  return { kind: "none" };
}

export async function loadSeriesWithAccess(seriesId: string) {
  if (!Types.ObjectId.isValid(seriesId)) return null;
  await connectDB();
  const series = await Series.findById(seriesId).lean();
  if (!series) return null;
  return { series, access: await getRoomAccess(series) };
}
