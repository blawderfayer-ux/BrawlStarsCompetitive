import Link from "next/link";
import { SeriesControl } from "@/components/admin/series-control";
import { SeriesCard } from "@/components/series-card";
import { EmptyState } from "@/components/ui";
import { requireStaffPage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { loadAdminTournament } from "../data";

export default async function AdminMatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ver?: string }>;
}) {
  const user = await requireStaffPage();
  const { slug } = await params;
  const { ver = "activas" } = await searchParams;
  const { tournament, series, modes, maps } = await loadAdminTournament(slug);

  if (!tournament.bracketGeneratedAt) {
    return (
      <EmptyState image="/img/vs.webp" title="Todavía no hay partidas">
        {user.role === "admin" ? "Genera el bracket desde el Resumen." : "El administrador todavía no generó el bracket."}
      </EmptyState>
    );
  }

  const playable = series.filter((s) => !s.isBye);
  const open = playable.filter((s) => !s.winnerSlot && s.teamA && s.teamB);
  const waiting = playable.filter((s) => !s.winnerSlot && (!s.teamA || !s.teamB));
  const finished = playable.filter((s) => s.winnerSlot);
  const list = ver === "terminadas" ? finished : ver === "todas" ? playable : open;
  // En curso primero, luego por número de partida.
  const sorted = [...list].sort(
    (a, b) => Number(b.status === "live") - Number(a.status === "live") || a.number - b.number,
  );

  const filters = [
    { key: "activas", label: `Por jugar (${open.length})` },
    { key: "terminadas", label: `Terminadas (${finished.length})` },
    { key: "todas", label: "Todas" },
  ];

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`?ver=${f.key}`}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-sm font-extrabold",
              ver === f.key ? "border-brand bg-brand/15 text-brand" : "border-line bg-card text-muted",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {tournament.championTeamId ? (
        <p className="card border-brand/60 p-4 font-extrabold text-brand">Torneo finalizado.</p>
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState title={ver === "activas" ? "No hay partidas listas para jugar" : "Nada por aquí"}>
          {ver === "activas" && waiting.length ? `${waiting.length} partidas esperan a que se definan sus equipos.` : null}
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((s) =>
            s.winnerSlot && ver !== "todas" && ver !== "terminadas" ? (
              <SeriesCard key={s.id} series={s} />
            ) : (
              <SeriesControl key={s.id} series={s} modes={modes} maps={maps} isAdmin={user.role === "admin"} slug={slug} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
