import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { connectDB } from "./db";
import { User, type StaffRole } from "@/models";

export const SESSION_COOKIE = "bt_session";
const SESSION_DAYS = 7;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres (ver .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Usuario del staff actual. Siempre se vuelve a leer de la base para que desactivar
 * a un árbitro o cambiarle el rol tenga efecto inmediato.
 */
export const getCurrentUser = cache(async (): Promise<StaffUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    await connectDB();
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.active) return null;
    return { id: String(user._id), name: user.name, email: user.email, role: user.role as StaffRole };
  } catch {
    return null;
  }
});

/** Para páginas del panel: redirige al login si no hay sesión o el rol no alcanza. */
export async function requireStaffPage(roles: StaffRole[] = ["admin", "referee"]) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!roles.includes(user.role)) redirect("/admin?error=permiso");
  return user;
}

export class AuthError extends Error {}

/** Para server actions: lanza error si el usuario no tiene permiso. */
export async function requireStaff(roles: StaffRole[] = ["admin", "referee"]) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Tu sesión expiró. Vuelve a iniciar sesión.");
  if (!roles.includes(user.role)) throw new AuthError("No tienes permiso para esta acción.");
  return user;
}
