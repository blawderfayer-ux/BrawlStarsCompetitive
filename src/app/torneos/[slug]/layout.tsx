import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AutoRefresh, EventToasts } from "@/components/live";
import { TournamentNav } from "@/components/tournament-nav";
import { Container, StatusBadge } from "@/components/ui";
import { TOURNAMENT_STATUS } from "@/lib/labels";
import { ogImageFor } from "@/lib/site";
import { bestOfLabel, formatDateTime } from "@/lib/utils";
import { loadTournament } from "./data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { tournament } = await loadTournament(slug);
  const description =
    tournament.description.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3).join(" · ").slice(0, 180) ||
    "Equipos, bracket, partidas y resultados en vivo.";
  const image = ogImageFor(tournament.posterUrl);
  return {
    title: tournament.name,
    description,
    openGraph: {
      title: tournament.name,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: tournament.name }],
    },
    twitter: { card: "summary_large_image", title: tournament.name, description, images: [image] },
  };
}

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tournament } = await loadTournament(slug);
  const live = tournament.status === "live";
  const facts = [
    tournament.startsAt ? { label: "Fecha", value: formatDateTime(tournament.startsAt) } : null,
    { label: "Formato", value: `${bestOfLabel(tournament.defaultBestOf, tournament.bestOfByRound)}${tournament.bansPerTeam ? ` · ${tournament.bansPerTeam} ban${tournament.bansPerTeam > 1 ? "s" : ""}` : ""}` },
    { label: "Equipos", value: `${tournament.approvedTeams}/${tournament.maxTeams}` },
    tournament.prize ? { label: "Premio", value: tournament.prize, accent: true } : null,
    tournament.location ? { label: "Lugar", value: tournament.location } : null,
  ].filter(Boolean) as { label: string; value: string; accent?: boolean }[];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        {tournament.posterUrl ? (
          // Con afiche: se muestra recortado en la parte de arriba (logo y título del torneo).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tournament.posterUrl}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_8%] sm:object-[50%_18%]"
          />
        ) : (
          <Image src="/img/banner.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[50%_35%] opacity-60" />
        )}
        <div
          className={
            tournament.posterUrl
              ? "absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/70 via-40% to-transparent"
              : "absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/80 to-bg/40"
          }
          aria-hidden
        />
        <Container className={tournament.posterUrl ? "pt-48 pb-5 sm:pt-64" : "pt-12 pb-5 sm:pt-16"}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={TOURNAMENT_STATUS} value={tournament.status} />
            <span className="eyebrow !text-white/80">Brawl Stars · 3v3 · Eliminación directa</span>
          </div>
          <h1 className="title-ink mt-2 text-4xl uppercase leading-[0.95] text-white sm:text-6xl">{tournament.name}</h1>
          {tournament.status === "registration_open" ? (
            <Link href={`/torneos/${slug}/inscripcion`} className="btn btn-primary mt-4 w-full sm:w-auto">
              Inscribir mi equipo
            </Link>
          ) : null}
        </Container>
      </section>

      <div className="border-b border-line bg-bg-soft">
        <Container>
          <dl className="no-scrollbar -mx-4 flex overflow-x-auto px-4">
            {facts.map((f) => (
              <div key={f.label} className="shrink-0 border-r border-line py-2.5 pr-4 pl-4 first:pl-0 last:border-r-0">
                <dt className="eyebrow !text-[10px]">{f.label}</dt>
                <dd className={`font-display text-base leading-tight whitespace-nowrap ${f.accent ? "text-brand" : ""}`}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      <div className="sticky top-14 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <Container>
          <TournamentNav slug={slug} />
        </Container>
      </div>

      <Container className="py-6">{children}</Container>

      {live ? (
        <>
          <AutoRefresh seconds={20} />
          <EventToasts slug={slug} />
        </>
      ) : null}
    </>
  );
}
