import type { Metadata } from "next";
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
    <Container className="py-4">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Torneo Brawl Stars</p>
            <h1 className="font-display text-2xl leading-tight sm:text-3xl">{tournament.name}</h1>
          </div>
          <StatusBadge map={TOURNAMENT_STATUS} value={tournament.status} className="mt-1" />
        </div>
        <p className="mt-1 text-sm text-muted">
          🛡️ {tournament.approvedTeams} equipos · 3v3 · BO{tournament.defaultBestOf}
          {tournament.startsAt ? ` · 📅 ${formatDateTime(tournament.startsAt)}` : ""}
        </p>
        {tournament.status === "registration_open" ? (
          <Link href={`/torneos/${slug}/inscripcion`} className="btn btn-primary mt-3 w-full sm:w-auto">
            📝 Inscribir mi equipo
          </Link>
        ) : null}
      </div>
      <div className="sticky top-14 z-20 -mx-4 mb-4 bg-bg/90 px-4 py-2 backdrop-blur">
        <TournamentNav slug={slug} />
      </div>
      {children}
      {live ? (
        <>
          <AutoRefresh seconds={20} />
          <EventToasts slug={slug} />
        </>
      ) : null}
    </Container>
  );
}
