import type { Metadata } from "next";
import { TournamentCard } from "@/components/tournament-card";
import { Container, EmptyState, SectionTitle } from "@/components/ui";
import { listTournaments } from "@/lib/queries";

export const metadata: Metadata = { title: "Torneos" };

const GROUPS = [
  { title: "En curso", statuses: ["live"] },
  { title: "Inscripciones y próximos", statuses: ["registration_open", "registration_closed"] },
  { title: "Finalizados", statuses: ["finished"] },
  { title: "Cancelados", statuses: ["cancelled"] },
];

export default async function TournamentsPage() {
  const tournaments = await listTournaments();
  return (
    <Container className="space-y-10 py-8">
      <header>
        <p className="eyebrow">Torneos UAGRM · Brawl Stars 3v3</p>
        <h1 className="title-ink mt-1 text-5xl uppercase leading-none">Torneos</h1>
      </header>
      {tournaments.length === 0 ? <EmptyState title="No hay torneos publicados" /> : null}
      {GROUPS.map((g) => {
        const list = tournaments.filter((t) => g.statuses.includes(t.status));
        if (!list.length) return null;
        return (
          <section key={g.title}>
            <SectionTitle>{g.title}</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {list.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        );
      })}
    </Container>
  );
}
