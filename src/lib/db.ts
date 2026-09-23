import mongoose from "mongoose";

declare global {
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = (globalThis.__mongoose ??= { conn: null, promise: null });

/** Conexión única reutilizada entre requests (y entre recargas en desarrollo). */
export async function connectDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta la variable de entorno MONGODB_URI (ver .env.example).");
  }
  cached.promise ??= mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || "brawl_tournaments",
    serverSelectionTimeoutMS: 10_000,
  });
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
