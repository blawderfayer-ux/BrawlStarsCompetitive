import { ChevronRight, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SeriesCard } from "@/components/series-card";
import { LiveSeriesHero } from "@/components/series-detail";
import { TournamentCard } from "@/components/tournament-card";
import { Container, EmptyState, SectionTitle, TeamLogo } from "@/components/ui";
import { getRanking, getTournamentData, listTournaments } from "@/lib/queries";
import { cn, formatDate } from "@/lib/utils";

const PRIORITY: Record<string, number> = { live: 0, registration_open: 1, registration_closed: 2, finished: 3, cancelled: 4 };

const HOW = [
  ["Inscribe a tu equipo", "Abre el torneo, toca INSCRIBIR MI EQUIPO y pon a tus 3 jugadores. Guarda el enlace privado que te sale al final."],
  ["Recibe tu código", "Cuando aprueben tu equipo, en ese enlace aparece un código de 6 letras. También te lo manda la organización."],
  ["Entra a “Mi equipo”", "El día del torneo toca MI EQUIPO y escribe el código: ahí ves tu partida, hablas con tu rival y reportas el resultado."],
];

export default async function HomePage() {
  const [tournaments, { champions, ranking }] = await Promise.all([listTournaments(), getRanking()]);
  const sorted = [...tournaments].sort((a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9));
  const current = sorted[0];
  const data = current && current.status === "live" ? await getTournamentData(current.slug) : null;
  const live = data?.series.filter((s) => s.status === "live") ?? [];
  const upcoming =
    data?.series
      .filter((s) => !s.isBye && !s.winnerSlot && s.teamA && s.teamB && s.status !== "live" && s.status !== "cancelled")
      .slice(0, 4) ?? [];
  const recent =
    data?.series
      .filter((s) => !s.isBye && s.winnerSlot)
      .sort((a, b) => b.round - a.round || b.number - a.number)
      .slice(0, 4) ?? [];
  const others = sorted.filter((t) => t.id !== current?.id).slice(0, 4);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Image src="/img/banner.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[50%_30%] opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/80 to-bg/30" aria-hidden />
        <Container className="flex min-h-[360px] flex-col justify-end pt-20 pb-10 sm:min-h-[440px]">
          <span className="tag-skew w-fit text-sm">
            <span>Brawl Stars · 3v3 · UAGRM</span>
          </span>
          <h1 className="title-ink mt-4 text-5xl uppercase leading-[0.9] sm:text-7xl">
            La escena competitiva
            <br />
            <span className="text-brand">de la UAGRM</span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-text/85">
            Torneos con bracket, bans y mapas oficiales, resultados en vivo y ranking histórico de equipos. Todo desde tu
            celular.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {current ? (
              <Link
                href={current.status === "registration_open" ? `/torneos/${current.slug}/inscripcion` : `/torneos/${current.slug}`}
                className="btn btn-primary"
              >
                {current.status === "registration_open" ? "Inscribir mi equipo" : current.status === "live" ? "Ver torneo en vivo" : "Ver torneo"}
              </Link>
            ) : null}
            <Link href="/ranking" className="btn btn-ghost">
              Ranking
            </Link>
          </div>
        </Container>
      </section>

      <Container className="space-y-12 py-10">
        {current ? (
          <section>
            <SectionTitle
              action={
                <Link href="/torneos" className="font-display text-sm uppercase tracking-wide text-muted hover:text-text">
                  Todos <ChevronRight size={14} className="inline" />
                </Link>
              }
            >
              {current.status === "live" ? "Torneo en curso" : current.status === "finished" ? "Último torneo" : "Próximo torneo"}
            </SectionTitle>
            <TournamentCard t={current} featured />
          </section>
        ) : (
          <EmptyState title="Todavía no hay torneos publicados">Vuelve pronto: aquí aparecerá el próximo torneo.</EmptyState>
        )}

        {data && (live.length || upcoming.length || recent.length) ? (
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="min-w-0 space-y-4">
              <SectionTitle>{live.length ? "En vivo ahora" : "Próximas partidas"}</SectionTitle>
              {live.map((s) => (
                <LiveSeriesHero key={s.id} series={s} slug={data.tournament.slug} />
              ))}
              {(live.length ? upcoming.slice(0, 2) : upcoming).map((s) => (
                <SeriesCard key={s.id} series={s} href={`/torneos/${data.tournament.slug}/partidas/${s.number}`} compact />
              ))}
            </div>
            {recent.length ? (
              <div className="min-w-0 space-y-4">
                <SectionTitle>Resultados recientes</SectionTitle>
                {recent.map((s) => (
                  <SeriesCard key={s.id} series={s} href={`/torneos/${data.tournament.slug}/partidas/${s.number}`} compact />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {champions.length || ranking.length ? (
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {champions.length ? (
              <div className="min-w-0">
                <SectionTitle>Campeones</SectionTitle>
                <ul className="card divide-y divide-line overflow-hidden">
                  {champions.slice(0, 4).map((c) => (
                    <li key={c.tournament.id}>
                      <Link href={`/torneos/${c.tournament.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-card-hi">
                        <TeamLogo team={c.champion} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="font-display truncate text-lg uppercase leading-tight">{c.champion?.name ?? "—"}</p>
                          <p className="truncate text-xs text-muted">
                            {c.tournament.name} · {formatDate(c.tournament.startsAt)}
                          </p>
                        </div>
                        <Trophy size={18} className="shrink-0 text-brand" fill="currentColor" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {ranking.length ? (
              <div className="min-w-0">
                <SectionTitle
                  action={
                    <Link href="/ranking" className="font-display text-sm uppercase tracking-wide text-muted hover:text-text">
                      Ver ranking <ChevronRight size={14} className="inline" />
                    </Link>
                  }
                >
                  Top equipos
                </SectionTitle>
                <ol className="card divide-y divide-line overflow-hidden">
                  {ranking.slice(0, 5).map((r, i) => (
                    <li key={r.key} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={cn("font-display w-5 text-center text-lg", i === 0 ? "text-brand" : "text-muted")}>{i + 1}</span>
                      <TeamLogo team={r.team} size={30} />
                      <span className="font-display min-w-0 flex-1 truncate text-base uppercase">{r.team.name}</span>
                      <span className="font-display text-sm text-muted">
                        {r.titles ? (
                          <span className="mr-2 inline-flex items-center gap-0.5 text-brand">
                            <Trophy size={13} fill="currentColor" /> {r.titles}
                          </span>
                        ) : null}
                        {r.seriesWon}-{r.seriesLost}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        ) : null}

        {others.length ? (
          <section>
            <SectionTitle>Más torneos</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {others.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionTitle>¿Cómo funciona?</SectionTitle>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {HOW.map(([title, text], i) => (
              <li key={title} className="card flex gap-3 p-4">
                <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand text-xl text-brand-ink">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-lg uppercase leading-tight">{title}</p>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/como-jugar" className="btn btn-ghost mt-4 w-full sm:w-auto">
            Guía completa con video
          </Link>
        </section>
      </Container>
    </>
  );
}
