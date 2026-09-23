import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { TeamLogo } from "@/models";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return new Response("Not found", { status: 404 });
  await connectDB();
  const logo = await TeamLogo.findOne({ team: id }).lean();
  if (!logo) return new Response("Not found", { status: 404 });
  const data = logo.data as unknown as { buffer: ArrayBuffer } | Buffer;
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from((data as { buffer: ArrayBuffer }).buffer);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": logo.contentType,
      // La URL lleva ?v=<fecha de actualización>, así que se puede cachear mucho tiempo.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
