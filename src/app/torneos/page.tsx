import type { Metadata } from "next";
import Link from "next/link";
import { Container, EmptyState, StatusBadge } from "@/components/ui";
import { TOURNAMENT_STATUS } from "@/lib/labels";
import { listTournaments } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Torneos" };

export default async function TournamentsPage() {
  const tournaments = await listTournaments();
  return (
    <Container className="py-6">
      <h1 className="font-display mb-4 text-3xl">Torneos</h1>
      {tournaments.length === 0 ? (
        <EmptyState title="No hay torneos publicados" />
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/torneos/${t.slug}`} className="card block p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl leading-tight">{t.name}</p>
                <StatusBadge map={TOURNAMENT_STATUS} value={t.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {t.approvedTeams}/{t.maxTeams} equipos · BO{t.defaultBestOf}
                {t.startsAt ? ` · ${formatDateTime(t.startsAt)}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
