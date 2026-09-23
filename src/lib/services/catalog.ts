import "server-only";
import { connectDB } from "../db";
import { Types } from "mongoose";
import { DEFAULT_MODES, MAP_RENAMES, RETIRED_MAPS } from "../catalog";
import { slugify } from "../utils";
import { GameMap, GameMode, Tournament, User, type StaffRole, STAFF_ROLES } from "@/models";
import { hashPassword } from "../password";
import { UserError } from "./tx";

/**
 * Carga o actualiza el catálogo de modos y mapas (idempotente):
 * - crea los modos y mapas que falten,
 * - renombra al español los mapas que se cargaron en inglés y desactiva los que salieron de rotación,
 * - agrega los mapas nuevos al pool de los torneos que no terminaron.
 */
export async function seedCatalog() {
  await connectDB();
  let modes = 0;
  let maps = 0;
  let renamed = 0;
  const catalogMapIds: Types.ObjectId[] = [];
  for (const [i, m] of DEFAULT_MODES.entries()) {
    let mode = await GameMode.findOne({ slug: m.slug });
    if (!mode) {
      mode = await GameMode.create({
        slug: m.slug,
        name: m.name,
        icon: m.icon,
        color: m.color,
        description: m.description,
        order: i,
      });
      modes++;
    }
    for (const [en, es] of Object.entries(MAP_RENAMES)) {
      const old = await GameMap.findOne({ mode: mode._id, name: en });
      if (!old) continue;
      if (await GameMap.exists({ mode: mode._id, name: es })) {
        await GameMap.updateOne({ _id: old._id }, { $set: { active: false } });
      } else {
        await GameMap.updateOne({ _id: old._id }, { $set: { name: es, active: true } });
        renamed++;
      }
    }
    await GameMap.updateMany({ mode: mode._id, name: { $in: RETIRED_MAPS } }, { $set: { active: false } });
    for (const [j, name] of m.maps.entries()) {
      const r = await GameMap.findOneAndUpdate(
        { mode: mode._id, name },
        { $setOnInsert: { order: j } },
        { upsert: true, returnDocument: "after", includeResultMetadata: true },
      );
      if (!r.lastErrorObject?.updatedExisting) maps++;
      if (r.value) catalogMapIds.push(r.value._id);
    }
  }
  const retired = await GameMap.find({ name: { $in: RETIRED_MAPS } }, { _id: 1 }).lean();
  const openTournaments = { status: { $nin: ["finished" as const, "cancelled" as const] } };
  if (retired.length) {
    await Tournament.updateMany(openTournaments, { $pull: { mapPool: { $in: retired.map((r) => r._id) } } });
  }
  const pools = await Tournament.updateMany(openTournaments, { $addToSet: { mapPool: { $each: catalogMapIds } } });
  return { modes, maps, renamed, tournaments: pools.modifiedCount };
}

export async function saveMode(
  id: string | null,
  input: { name: string; icon: string; color: string; description: string; active: boolean },
) {
  await connectDB();
  if (!input.name.trim()) throw new UserError("El modo necesita un nombre.");
  if (id) {
    await GameMode.updateOne({ _id: id }, { $set: input });
    return;
  }
  const slug = slugify(input.name);
  if (await GameMode.exists({ slug })) throw new UserError("Ya existe un modo con ese nombre.");
  const order = await GameMode.countDocuments();
  await GameMode.create({ ...input, slug, order });
}

export async function saveMap(id: string | null, input: { name: string; modeId: string; active: boolean }) {
  await connectDB();
  if (!input.name.trim()) throw new UserError("El mapa necesita un nombre.");
  if (!(await GameMode.exists({ _id: input.modeId }))) throw new UserError("Modo inválido.");
  const dup = await GameMap.findOne({ mode: input.modeId, name: input.name.trim(), ...(id ? { _id: { $ne: id } } : {}) });
  if (dup) throw new UserError("Ya existe un mapa con ese nombre en ese modo.");
  const doc = { name: input.name.trim(), mode: input.modeId, active: input.active };
  if (id) await GameMap.updateOne({ _id: id }, { $set: doc });
  else await GameMap.create({ ...doc, order: await GameMap.countDocuments({ mode: input.modeId }) });
}

/* ─────────────── Staff ─────────────── */

export async function listStaff() {
  await connectDB();
  const users = await User.find().sort({ role: 1, name: 1 }).lean();
  return users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role as StaffRole,
    active: u.active ?? true,
  }));
}

export async function createStaffUser(input: { name: string; email: string; password: string; role: StaffRole }) {
  await connectDB();
  if (!STAFF_ROLES.includes(input.role)) throw new UserError("Rol inválido.");
  if (input.password.length < 8) throw new UserError("La contraseña debe tener al menos 8 caracteres.");
  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new UserError("Email inválido.");
  if (await User.exists({ email })) throw new UserError("Ya existe un usuario con ese email.");
  await User.create({
    name: input.name.trim() || email,
    email,
    role: input.role,
    passwordHash: await hashPassword(input.password),
  });
}

export async function hasAnyStaff() {
  await connectDB();
  return !!(await User.exists({}));
}

/**
 * Configuración inicial: crea el primer administrador y carga el catálogo de modos y mapas.
 * Solo funciona mientras no exista ningún usuario; después queda bloqueado.
 */
export async function createFirstAdmin(input: { name: string; email: string; password: string }) {
  if (await hasAnyStaff()) throw new UserError("La plataforma ya está configurada. Inicia sesión.");
  await createStaffUser({ ...input, role: "admin" });
  const user = await User.findOne({ email: input.email.trim().toLowerCase() }, { _id: 1 }).lean();
  // Si dos personas lo intentaron al mismo tiempo, solo se queda la primera cuenta.
  const first = await User.findOne({}, { _id: 1 }).sort({ createdAt: 1, _id: 1 }).lean();
  if (!user || String(first?._id) !== String(user._id)) {
    if (user) await User.deleteOne({ _id: user._id });
    throw new UserError("La plataforma ya está configurada. Inicia sesión.");
  }
  await seedCatalog();
  return String(user._id);
}

export async function updateStaffUser(
  id: string,
  actorId: string,
  input: { role?: StaffRole; active?: boolean; password?: string },
) {
  await connectDB();
  if (id === actorId && (input.active === false || (input.role && input.role !== "admin"))) {
    throw new UserError("No puedes quitarte tu propio acceso de administrador.");
  }
  const set: Record<string, unknown> = {};
  if (input.role) set.role = input.role;
  if (typeof input.active === "boolean") set.active = input.active;
  if (input.password) {
    if (input.password.length < 8) throw new UserError("La contraseña debe tener al menos 8 caracteres.");
    set.passwordHash = await hashPassword(input.password);
  }
  await User.updateOne({ _id: id }, { $set: set });
}
