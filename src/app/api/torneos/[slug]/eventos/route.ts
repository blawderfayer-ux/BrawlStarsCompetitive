import { connectDB } from "@/lib/db";
import { Tournament, TournamentEvent } from "@/models";

/** Eventos públicos nuevos desde `after` (lo usan los avisos en vivo del navegador). */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const after = new Date(new URL(req.url).searchParams.get("after") ?? "");
  await connectDB();
  const t = await Tournament.findOne({ slug }, { _id: 1 }).lean();
  if (!t) return Response.json({ events: [] }, { status: 404 });
  const events = await TournamentEvent.find({
    tournament: t._id,
    public: true,
    ...(Number.isNaN(after.getTime()) ? {} : { createdAt: { $gt: after } }),
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  return Response.json(
    {
      events: events.map((e) => ({ id: String(e._id), message: e.message, createdAt: e.createdAt.toISOString() })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
