import { BracketView } from "@/components/bracket-view";
import { EmptyState } from "@/components/ui";
import { loadTournament } from "../data";

export default async function BracketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament, series, teams } = await loadTournament(slug);
  if (!tournament.bracketGeneratedAt || series.length === 0) {
    return (
      <EmptyState icon="🏆" title="El bracket todavía no se generó">
        Se genera automáticamente cuando la organización cierra las inscripciones.
      </EmptyState>
    );
  }
  const champion = teams.find((t) => t.id === tournament.championTeamId);
  return <BracketView series={series} totalRounds={tournament.totalRounds} slug={slug} championName={champion?.name} />;
}
