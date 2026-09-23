import Link from "next/link";
import { EmptyState, StatusBadge, TeamLogo } from "@/components/ui";
import { COMPETITION_STATUS } from "@/lib/labels";
import { loadTournament } from "../data";

const ORDER: Record<string, number> = { champion: 0, active: 1, registered: 2, eliminated: 3, disqualified: 4 };

export default async function TeamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { teams, series } = await loadTournament(slug);
  const playing = new Set(
    series.filter((s) => s.status === "live").flatMap((s) => [s.teamA?.id, s.teamB?.id]).filter(Boolean),
  );
  const sorted = [...teams].sort(
    (a, b) => (ORDER[a.competitionStatus] ?? 9) - (ORDER[b.competitionStatus] ?? 9) || a.name.localeCompare(b.name),
  );

  if (teams.length === 0) {
    return (
      <EmptyState title="Todavía no hay equipos aprobados">
        Los equipos aparecen aquí cuando la organización aprueba su inscripción.
      </EmptyState>
    );
  }

  return (
    <div>
      <h2 className="font-display mb-3 text-xl uppercase">Equipos participantes ({teams.length})</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((t) => {
          const status = playing.has(t.id) ? "in_match" : t.competitionStatus;
          return (
            <Link
              key={t.id}
              href={`/torneos/${slug}/equipos/${t.slug}`}
              className="card flex items-center gap-3 p-3"
              style={{ borderLeft: `5px solid ${t.color}` }}
            >
              <TeamLogo team={t} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-extrabold">{t.name}</p>
                <p className="text-xs text-muted">
                  {t.members.filter((m) => m.role !== "sub").length} jugadores
                  {t.seed ? ` · Seed ${t.seed}` : ""} · {t.wins}V {t.losses}D
                </p>
              </div>
              <StatusBadge map={COMPETITION_STATUS} value={status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
