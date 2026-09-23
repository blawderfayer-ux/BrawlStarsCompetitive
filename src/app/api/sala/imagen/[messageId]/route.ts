import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { getRoomAccess } from "@/lib/team-session";
import { ChatMessage, Series } from "@/models";

/** Foto enviada en la sala. Solo la ven los dos equipos de la partida y el staff. */
export async function GET(_req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  if (!Types.ObjectId.isValid(messageId)) return new Response("Not found", { status: 404 });
  await connectDB();
  const msg = await ChatMessage.findById(messageId).lean();
  if (!msg?.image) return new Response("Not found", { status: 404 });
  const series = await Series.findById(msg.series, { teamA: 1, teamB: 1 }).lean();
  if (!series || (await getRoomAccess(series)).kind === "none") return new Response("Forbidden", { status: 403 });
  const raw = msg.image.data as unknown as Buffer | { buffer: Uint8Array };
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw.buffer);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": msg.image.contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
