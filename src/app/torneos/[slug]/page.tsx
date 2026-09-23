import { Crown } from "lucide-react";
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

  const stats = tournament.bracketGeneratedAt
    ? [
        { label: "Equipos", value: teams.length, color: "bg-blue" },
        { label: "Siguen en pie", value: active, color: "bg-ok" },
        { label: "Partidas jugadas", value: series.filter((s) => s.winnerSlot && !s.isBye).length, color: "bg-red" },
      ]
    : null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-8">
        {champion ? (
          <section className="card pop-in relative overflow-hidden bg-brand p-6 text-center text-brand-ink">
            <div className="halftone absolute inset-0 opacity-40" aria-hidden />
            <div className="relative">
              <Crown size={48} className="mx-auto" fill="currentColor" strokeWidth={2} />
              <p className="font-display mt-1 text-lg uppercase">Campeón del torneo</p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <TeamLogo team={champion} size={56} />
                <p className="title-ink text-4xl text-white">{champion.name}</p>
              </div>
              <Link href={`/torneos/${slug}/resultados`} className="btn btn-ghost mt-5">
                Ver historial
              </Link>
            </div>
          </section>
        ) : null}

        {live.length ? (
          <section className="space-y-4">
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
                <Link href={`/torneos/${slug}/partidas`} className="font-display text-sm uppercase text-muted underline">
                  Todas
                </Link>
              }
            >
              Próximas partidas
            </SectionTitle>
            {upcoming.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {upcoming.map((s) => (
                  <SeriesCard key={s.id} series={s} href={`/torneos/${slug}/partidas/${s.number}`} />
                ))}
              </div>
            ) : (
              <EmptyState title="Esperando resultados">
                Las próximas partidas aparecen cuando terminan las de la ronda actual.
              </EmptyState>
            )}
          </section>
        ) : null}

        {!tournament.bracketGeneratedAt ? (
          <section className="card overflow-hidden">
            <div className="border-b-[2.5px] border-ink bg-blue px-4 py-2">
              <p className="font-display text-lg uppercase text-white">
                {tournament.status === "registration_open" ? "Inscripciones abiertas" : "El bracket se publicará pronto"}
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-end gap-2">
                <span className="title-ink text-5xl leading-none">{tournament.approvedTeams}</span>
                <span className="font-display pb-1 text-lg text-muted">/ {tournament.maxTeams} equipos aprobados</span>
              </div>
              <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-ink bg-bg-soft">
                <div
                  className="h-full bg-brand"
                  style={{ width: `${Math.min(100, (tournament.approvedTeams / tournament.maxTeams) * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-muted">
                Cuando cierren las inscripciones, la organización genera el bracket automáticamente.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {tournament.status === "registration_open" ? (
                  <Link href={`/torneos/${slug}/inscripcion`} className="btn btn-primary">
                    Inscribir mi equipo
                  </Link>
                ) : null}
                <Link href={`/torneos/${slug}/equipos`} className="btn btn-ghost">
                  Ver equipos
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {stats ? (
          <section className="grid grid-cols-3 gap-3 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="card overflow-hidden">
                <div className={`h-2 border-b-2 border-ink ${stat.color}`} />
                <div className="p-3">
                  <div className="title-ink text-4xl leading-none">{stat.value}</div>
                  <div className="mt-1 text-[11px] font-black uppercase leading-tight text-muted">{stat.label}</div>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <section>
          <SectionTitle>Novedades</SectionTitle>
          {events.length ? (
            <ul className="card divide-y-2 divide-ink/60 overflow-hidden">
              {events.slice(0, 12).map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 text-sm font-bold [overflow-wrap:anywhere]">{e.message}</span>
                  <span className="shrink-0 text-xs font-bold text-muted">{timeAgo(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin novedades todavía" />
          )}
        </section>
      </div>

      <aside className="min-w-0 space-y-6">
        {tournament.posterUrl ? (
          <a href={tournament.posterUrl} target="_blank" rel="noreferrer" className="card block overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tournament.posterUrl} alt={`Afiche de ${tournament.name}`} width={1024} height={1536} className="h-auto w-full" />
          </a>
        ) : null}
        {tournament.description ? (
          <section>
            <SectionTitle>Sobre el torneo</SectionTitle>
            <p className="card whitespace-pre-line [overflow-wrap:anywhere] p-4 text-sm leading-relaxed">{tournament.description}</p>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
