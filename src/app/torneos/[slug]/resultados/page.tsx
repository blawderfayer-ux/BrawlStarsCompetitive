import { Crown } from "lucide-react";
import Link from "next/link";
import { EmptyState, TeamLogo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { loadTournament } from "../data";

/** Historial del torneo: resultado de cada serie por ronda y el campeón. */
export default async function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament, teams, series } = await loadTournament(slug);
  const played = series.filter((s) => s.winnerSlot && !s.isBye);
  const champion = teams.find((t) => t.id === tournament.championTeamId);

  if (played.length === 0) {
    return <EmptyState title="Todavía no hay resultados" />;
  }

  const rounds = [...new Set(played.map((s) => s.round))].sort((a, b) => a - b);
  return (
    <div className="space-y-6">
      {champion ? (
        <div className="card flex items-center gap-3 border-brand/60 p-4">
          <Crown size={30} className="text-brand" fill="currentColor" />
          <TeamLogo team={champion} size={44} />
          <div>
            <p className="text-xs font-extrabold uppercase text-muted">Campeón</p>
            <p className="font-display text-2xl text-brand">{champion.name}</p>
          </div>
        </div>
      ) : null}
      {rounds.map((round) => (
        <section key={round}>
          <h2 className="font-display mb-2 text-xl uppercase">{played.find((s) => s.round === round)?.roundName}</h2>
          <ul className="card divide-y divide-line/70">
            {played
              .filter((s) => s.round === round)
              .map((s) => (
                <li key={s.id}>
                  <Link href={`/torneos/${slug}/partidas/${s.number}`} className="flex items-center gap-2 px-4 py-3 text-sm">
                    <span className={cn("min-w-0 flex-1 truncate text-right font-extrabold", s.winnerSlot === "A" ? "text-brand" : "text-muted")}>
                      {s.teamA?.name}
                    </span>
                    <span className="font-display shrink-0 rounded-lg bg-bg-soft px-2 py-0.5 text-base">
                      {s.walkover ? "W.O." : `${s.scoreA}-${s.scoreB}`}
                    </span>
                    <span className={cn("min-w-0 flex-1 truncate font-extrabold", s.winnerSlot === "B" ? "text-brand" : "text-muted")}>
                      {s.teamB?.name}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
