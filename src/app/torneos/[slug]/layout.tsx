import { CalendarDays, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AutoRefresh, EventToasts } from "@/components/live";
import { TournamentNav } from "@/components/tournament-nav";
import { Container, StatusBadge } from "@/components/ui";
import { TOURNAMENT_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";
import { loadTournament } from "./data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { tournament } = await loadTournament(slug);
  return { title: tournament.name, description: tournament.description || undefined };
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

  return (
    <>
      <section className="relative isolate overflow-hidden border-b-[3px] border-ink">
        {tournament.posterUrl ? (
          // Con afiche: se muestra recortado en la parte de arriba (logo y título del torneo).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tournament.posterUrl}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_8%] sm:object-[50%_18%]"
          />
        ) : (
          <Image src="/img/hero.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[85%_30%]" />
        )}
        <div className="halftone absolute inset-0 -z-10 opacity-40" aria-hidden />
        <div
          className={
            tournament.posterUrl
              ? "absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/70 via-40% to-transparent"
              : "absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/75 to-bg/20"
          }
          aria-hidden
        />
        <Container className={tournament.posterUrl ? "pt-56 pb-5 sm:pt-72" : "pt-10 pb-5"}>
          <div className="flex items-center gap-2">
            <StatusBadge map={TOURNAMENT_STATUS} value={tournament.status} />
            <span className="text-xs font-black uppercase tracking-wider text-white/80 drop-shadow-[0_1px_0_var(--ink)]">
              Brawl Stars · 3v3
            </span>
          </div>
          <h1 className="title-ink mt-2 text-4xl leading-none text-white sm:text-5xl">{tournament.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-extrabold text-white/90 drop-shadow-[0_1px_0_var(--ink)]">
            <span className="inline-flex items-center gap-1.5">
              <Users size={16} /> {tournament.approvedTeams} equipos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield size={16} /> BO{tournament.defaultBestOf}
            </span>
            {tournament.startsAt ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={16} /> {formatDateTime(tournament.startsAt)}
              </span>
            ) : null}
          </div>
          {tournament.status === "registration_open" ? (
            <Link href={`/torneos/${slug}/inscripcion`} className="btn btn-primary mt-4 w-full sm:w-auto">
              Inscribir mi equipo
            </Link>
          ) : null}
        </Container>
      </section>

      <div className="sticky top-14 z-20 border-b-[3px] border-ink bg-[#0b1340]/95 backdrop-blur">
        <Container className="pt-2">
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
