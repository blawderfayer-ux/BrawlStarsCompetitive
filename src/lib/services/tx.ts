import "server-only";
import mongoose, { type ClientSession } from "mongoose";
import { connectDB } from "../db";

/**
 * Ejecuta `fn` dentro de una transacción de MongoDB para que el bracket nunca quede a medias
 * (por ejemplo: serie cerrada pero ganador sin avanzar). MongoDB Atlas siempre soporta
 * transacciones; para un `mongod` local sin replica set se puede desactivar con
 * MONGODB_TRANSACTIONS=false.
 */
export async function withTransaction<T>(fn: (session: ClientSession | null) => Promise<T>): Promise<T> {
  await connectDB();
  if (process.env.MONGODB_TRANSACTIONS === "false") return fn(null);
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}

/** Error esperado que se muestra tal cual al usuario. */
export class UserError extends Error {}
