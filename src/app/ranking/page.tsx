import { Medal, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container, EmptyState, SectionTitle, TeamLogo } from "@/components/ui";
import { getRanking } from "@/lib/queries";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ranking y campeones",
  description: "Campeones de cada torneo y ranking histórico de equipos de Brawl Stars en la UAGRM.",
};

export default async function RankingPage() {
  const { champions, ranking } = await getRanking();

  return (
    <Container className="space-y-10 py-8">
      <header>
        <p className="eyebrow">Torneos UAGRM · Historial</p>
        <h1 className="title-ink mt-1 text-5xl uppercase leading-none">Ranking</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Campeones de cada edición y la tabla histórica de equipos: títulos, finales jugadas y partidas ganadas en
          todos los torneos.
        </p>
      </header>

      <section>
        <SectionTitle>Salón de campeones</SectionTitle>
        {champions.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {champions.map((c) => (
              <Link key={c.tournament.id} href={`/torneos/${c.tournament.slug}`} className="card block overflow-hidden hover:border-muted/40">
                <div className="flex items-center justify-between gap-2 border-b border-line bg-bg-soft px-4 py-2">
                  <span className="font-display min-w-0 truncate text-sm uppercase tracking-wide">{c.tournament.name}</span>
                  <span className="shrink-0 text-xs text-muted">{formatDate(c.tournament.startsAt)}</span>
                </div>
                <div className="flex items-center gap-3 p-4">
                  <div className="relative">
                    <TeamLogo team={c.champion} size={52} />
                    <Trophy size={20} className="absolute -right-2 -bottom-2 rounded-full bg-bg p-0.5 text-brand" fill="currentColor" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow !text-brand">Campeón</p>
                    <p className="font-display truncate text-2xl uppercase leading-tight">{c.champion?.name ?? "—"}</p>
                    {c.runnerUp ? (
                      <p className="truncate text-sm text-muted">
                        Final {c.finalScore} vs {c.runnerUp.name}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-4 border-t border-line px-4 py-2 text-xs text-muted">
                  <span>{c.tournament.approvedTeams} equipos</span>
                  <span>BO{c.tournament.defaultBestOf}</span>
                  {c.tournament.prize ? <span className="text-brand">{c.tournament.prize}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Todavía no hay campeones">Aparecen aquí cuando termine el primer torneo.</EmptyState>
        )}
      </section>

      <section>
        <SectionTitle>Ranking de equipos</SectionTitle>
        {ranking.length ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-soft">
                <tr className="eyebrow !text-[10px] text-left">
                  <th className="w-10 py-2 pl-3 font-[inherit]">#</th>
                  <th className="py-2 font-[inherit]">Equipo</th>
                  <th className="px-2 py-2 text-center font-[inherit]" title="Títulos">Tít.</th>
                  <th className="px-2 py-2 text-center font-[inherit]" title="Partidas ganadas - perdidas">G-P</th>
                  <th className="hidden px-2 py-2 text-center font-[inherit] sm:table-cell" title="Diferencia de mapas">Dif.</th>
                  <th className="hidden py-2 pr-3 text-center font-[inherit] sm:table-cell">Torneos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ranking.map((r, i) => {
                  const diff = r.gamesWon - r.gamesLost;
                  return (
                    <tr key={r.key} className={cn(i < 3 && "bg-brand/[0.04]")}>
                      <td className="py-2.5 pl-3">
                        <span className={cn("font-display text-lg", i === 0 ? "text-brand" : i < 3 ? "text-text" : "text-muted")}>
                          {i < 3 ? <Medal size={16} className="mr-0.5 inline align-[-2px]" /> : null}
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <TeamLogo team={r.team} size={28} />
                          <span className="font-display truncate text-base uppercase">{r.team.name}</span>
                        </span>
                      </td>
                      <td className="px-2 text-center">
                        <span className={cn("font-display text-lg", r.titles ? "text-brand" : "text-muted")}>{r.titles}</span>
                      </td>
                      <td className="px-2 text-center font-display text-base whitespace-nowrap">
                        {r.seriesWon}-{r.seriesLost}
                      </td>
                      <td className={cn("hidden px-2 text-center font-display text-base sm:table-cell", diff > 0 ? "text-emerald-300" : diff < 0 ? "text-rose-300" : "text-muted")}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="hidden pr-3 text-center text-muted sm:table-cell">{r.tournaments}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-line px-3 py-2 text-xs text-muted">
              Orden: títulos, finales, partidas ganadas y diferencia de mapas. Los equipos se reconocen por su nombre entre
              torneos.
            </p>
          </div>
        ) : (
          <EmptyState title="Sin partidas jugadas">El ranking se arma con los resultados de los torneos.</EmptyState>
        )}
      </section>
    </Container>
  );
}
