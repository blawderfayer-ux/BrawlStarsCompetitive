import Link from "next/link";
import { Container, EmptyState, StatusBadge } from "@/components/ui";
import { TOURNAMENT_STATUS } from "@/lib/labels";
import { listTournaments } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import type { TournamentView } from "@/lib/views";

const PRIORITY: Record<string, number> = { live: 0, registration_open: 1, registration_closed: 2, finished: 3, cancelled: 4 };

export default async function HomePage() {
  const tournaments = await listTournaments();
  const sorted = [...tournaments].sort((a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9));
  const current = sorted[0] as TournamentView | undefined;
  const others = sorted.slice(1, 6);

  return (
    <Container className="py-6">
      <section className="pt-4 pb-8 text-center">
        <div className="text-6xl" aria-hidden>
          🏆
        </div>
        <h1 className="font-display mt-2 text-4xl leading-none text-brand drop-shadow-[0_3px_0_#b88a00] sm:text-5xl">
          BRAWL TOURNAMENT
        </h1>
        <p className="mt-3 text-lg font-extrabold">Compite. Avanza. Gana.</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Torneos 3v3 organizados: bracket, rival, modo y mapa oficiales de cada partida, en vivo desde tu celular.
        </p>
      </section>

      {current ? (
        <section className="card pop-in overflow-hidden">
          <div className="bg-gradient-to-r from-accent/40 to-transparent px-5 pt-5 pb-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Torneo actual</p>
            <h2 className="font-display mt-1 text-3xl leading-tight">{current.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
              <StatusBadge map={TOURNAMENT_STATUS} value={current.status} />
              <span>🛡️ {current.approvedTeams} equipos</span>
              {current.startsAt ? <span>📅 {formatDateTime(current.startsAt)}</span> : null}
            </div>
          </div>
          <div className="grid gap-3 p-5 pt-3 sm:grid-cols-2">
            <Link href={`/torneos/${current.slug}`} className="btn btn-primary w-full text-lg">
              Ver torneo
            </Link>
            {current.status === "registration_open" ? (
              <Link href={`/torneos/${current.slug}/inscripcion`} className="btn btn-secondary w-full text-lg">
                Inscribir mi equipo
              </Link>
            ) : (
              <Link href={`/torneos/${current.slug}/bracket`} className="btn btn-secondary w-full text-lg">
                Ver bracket
              </Link>
            )}
          </div>
        </section>
      ) : (
        <EmptyState icon="🕹️" title="Todavía no hay torneos publicados">
          Vuelve pronto: aquí aparecerá el próximo torneo.
        </EmptyState>
      )}

      {others.length ? (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-xl uppercase">Otros torneos</h2>
          <div className="space-y-3">
            {others.map((t) => (
              <Link key={t.id} href={`/torneos/${t.slug}`} className="card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-extrabold">{t.name}</p>
                  <p className="text-xs text-muted">{t.approvedTeams} equipos</p>
                </div>
                <StatusBadge map={TOURNAMENT_STATUS} value={t.status} />
              </Link>
            ))}
          </div>
          <Link href="/torneos" className="mt-3 block text-center text-sm font-bold text-muted underline">
            Ver todos los torneos
          </Link>
        </section>
      ) : null}
    </Container>
  );
}
