import { NextResponse } from "next/server";
import { listMessages, postMessage, reportsForGame } from "@/lib/services/room";
import { UserError } from "@/lib/services/tx";
import { loadSeriesWithAccess } from "@/lib/team-session";

type Ctx = { params: Promise<{ seriesId: string }> };

/** Mensajes nuevos de la sala (solo para los dos equipos y el staff). */
export async function GET(req: Request, { params }: Ctx) {
  const { seriesId } = await params;
  const found = await loadSeriesWithAccess(seriesId);
  if (!found) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (found.access.kind === "none") return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  const after = new URL(req.url).searchParams.get("after");
  const messages = await listMessages(seriesId, after ? new Date(after) : undefined);
  const current = found.series.games.find((g) => g.status === "pending");
  return NextResponse.json(
    {
      messages,
      currentGame: current?.number ?? null,
      reports: current ? reportsForGame(found.series, current.number) : [],
      scoreA: found.series.scoreA,
      scoreB: found.series.scoreB,
      finished: !!found.series.winnerSlot,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request, { params }: Ctx) {
  const { seriesId } = await params;
  const found = await loadSeriesWithAccess(seriesId);
  if (!found) return NextResponse.json({ error: "No existe" }, { status: 404 });
  try {
    const form = await req.formData();
    const text = typeof form.get("text") === "string" ? String(form.get("text")) : "";
    const image = form.get("image");
    await postMessage(found.series, found.access, text, image instanceof File && image.size > 0 ? image : null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "No se pudo enviar." }, { status: 500 });
  }
}
