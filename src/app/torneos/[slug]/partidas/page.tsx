import { SeriesCard } from "@/components/series-card";
import { EmptyState } from "@/components/ui";
import { loadTournament } from "../data";

export default async function MatchesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament, series } = await loadTournament(slug);
  const playable = series.filter((s) => !s.isBye);

  if (!tournament.bracketGeneratedAt || playable.length === 0) {
    return <EmptyState icon="⚔️" title="Todavía no hay partidas" />;
  }

  const rounds = [...new Set(playable.map((s) => s.round))].sort((a, b) => a - b);
  return (
    <div className="space-y-8">
      {rounds.map((round) => {
        const list = playable.filter((s) => s.round === round);
        const done = list.filter((s) => s.winnerSlot).length;
        return (
          <section key={round}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-xl uppercase">{list[0].roundName}</h2>
              <span className="text-xs font-bold text-muted">
                {done}/{list.length} jugadas · BO{list[0].bestOf}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((s) => (
                <SeriesCard key={s.id} series={s} href={`/torneos/${slug}/partidas/${s.number}`} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
