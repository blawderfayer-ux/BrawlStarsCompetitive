import Link from "next/link";
import { MyTeamCard } from "@/components/my-team";
import { SeriesCard } from "@/components/series-card";
import { LiveSeriesHero } from "@/components/series-detail";
import { EmptyState, SectionTitle, TeamLogo } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import { loadTournament } from "./data";

export default async function TournamentHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament, teams, series, events } = await loadTournament(slug);

  const champion = teams.find((t) => t.id === tournament.championTeamId);
  const live = series.filter((s) => s.status === "live");
  const upcoming = series
    .filter((s) => !s.isBye && !s.winnerSlot && s.teamA && s.teamB && s.status !== "live" && s.status !== "cancelled")
    .sort((a, b) => (a.scheduledAt ?? "9").localeCompare(b.scheduledAt ?? "9") || a.number - b.number)
    .slice(0, 4);
  const active = teams.filter((t) => t.competitionStatus === "active").length;

  return (
    <div className="space-y-8">
      {champion ? (
        <section className="card pop-in overflow-hidden border-brand/60 p-6 text-center">
          <div className="text-6xl" aria-hidden>
            🏆
          </div>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-widest text-muted">Campeón</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <TeamLogo team={champion} size={48} />
            <p className="font-display text-3xl text-brand">{champion.name}</p>
          </div>
          <Link href={`/torneos/${slug}/resultados`} className="btn btn-ghost mt-4">
            Ver historial del torneo
          </Link>
        </section>
      ) : null}

      {live.length ? (
        <section className="space-y-3">
          {live.map((s) => (
            <LiveSeriesHero key={s.id} series={s} slug={slug} />
          ))}
        </section>
      ) : null}

      {tournament.bracketGeneratedAt ? <MyTeamCard slug={slug} teams={teams} series={series} /> : null}

      {tournament.bracketGeneratedAt && !champion ? (
        <section>
          <SectionTitle
            action={
              <Link href={`/torneos/${slug}/partidas`} className="text-sm font-bold text-muted underline">
                Todas
              </Link>
            }
          >
            Próximas partidas
          </SectionTitle>
          {upcoming.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((s) => (
                <SeriesCard key={s.id} series={s} href={`/torneos/${slug}/partidas/${s.number}`} />
              ))}
            </div>
          ) : (
            <EmptyState icon="⏳" title="Esperando resultados">
              Las próximas partidas aparecen cuando terminan las de la ronda actual.
            </EmptyState>
          )}
        </section>
      ) : null}

      {!tournament.bracketGeneratedAt ? (
        <section className="card p-5">
          <p className="font-display text-xl">
            {tournament.status === "registration_open" ? "📝 Inscripciones abiertas" : "⏳ El bracket se publicará pronto"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {tournament.approvedTeams} de {tournament.maxTeams} equipos aprobados. Cuando cierren las inscripciones, la
            organización generará el bracket automáticamente.
          </p>
          <Link href={`/torneos/${slug}/equipos`} className="btn btn-ghost mt-4 w-full sm:w-auto">
            Ver equipos inscritos
          </Link>
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Equipos", value: teams.length },
            { label: "Activos", value: active },
            { label: "Partidas jugadas", value: series.filter((s) => s.winnerSlot && !s.isBye).length },
          ].map((stat) => (
            <div key={stat.label} className="card p-3">
              <div className="font-display text-3xl">{stat.value}</div>
              <div className="text-[11px] font-extrabold uppercase text-muted">{stat.label}</div>
            </div>
          ))}
        </section>
      )}

      {tournament.description ? (
        <section>
          <SectionTitle>Sobre el torneo</SectionTitle>
          <p className="card whitespace-pre-line p-4 text-sm leading-relaxed">{tournament.description}</p>
        </section>
      ) : null}

      <section>
        <SectionTitle>Novedades</SectionTitle>
        {events.length ? (
          <ul className="card divide-y divide-line/70">
            {events.slice(0, 12).map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <span className="text-sm font-bold">{e.message}</span>
                <span className="shrink-0 text-xs text-muted">{timeAgo(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="📣" title="Sin novedades todavía" />
        )}
      </section>
    </div>
  );
}
