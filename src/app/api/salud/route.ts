import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { dbHost, diagnoseDbError } from "@/lib/db-health";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico para los organizadores: abre /api/salud y te dice si la base de datos responde
 * y, si no, qué hacer. No muestra contraseñas ni datos privados.
 */
export async function GET() {
  const env = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB || "brawl_tournaments",
    SESSION_SECRET: (process.env.SESSION_SECRET ?? "").length >= 32,
  };
  const started = Date.now();
  try {
    await connectDB();
    await mongoose.connection.db!.admin().command({ ping: 1 });
    return NextResponse.json(
      { ok: true, baseDeDatos: "conectada", servidor: dbHost(), ms: Date.now() - started, variables: env },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    const d = diagnoseDbError(err);
    console.error("[salud]", err);
    return NextResponse.json(
      {
        ok: false,
        baseDeDatos: "sin conexión",
        servidor: dbHost(),
        problema: d.problem,
        solucion: d.fix,
        codigo: d.code,
        detalle: err instanceof Error ? err.message.replace(/\/\/[^@\s]*@/g, "//***@").slice(0, 300) : String(err).slice(0, 300),
        variables: env,
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
