import { CalendarDays, ChevronRight, Shield } from "lucide-react";
import Image from "next/image";
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
    <>
      {/* Portada con arte del juego, trama de puntos y titular con contorno */}
      <section className="relative isolate overflow-hidden border-b-[3px] border-ink">
        <Image src="/img/hero.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[60%_30%]" />
        <div className="halftone absolute inset-0 -z-10 opacity-60" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/60 to-bg/10" aria-hidden />
        <Container className="flex min-h-[340px] flex-col justify-end pt-16 pb-8 sm:min-h-[420px]">
          <span className="tag-skew w-fit text-sm">
            <span>Torneos 3v3</span>
          </span>
          <h1 className="title-ink mt-3 text-5xl leading-[0.95] text-white sm:text-7xl">
            COMPITE.
            <br />
            AVANZA. <span className="text-brand">GANA.</span>
          </h1>
          <p className="mt-3 max-w-md text-base font-bold text-white/90 drop-shadow-[0_2px_0_var(--ink)]">
            El bracket, tu rival, el modo y el mapa oficial de cada partida. Todo en vivo desde tu celular.
          </p>
        </Container>
      </section>

      <Container className="-mt-2 py-6">
        {current ? (
          <section className="card pop-in overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b-[2.5px] border-ink bg-brand px-4 py-2 text-brand-ink">
              <span className="font-display text-sm uppercase">Torneo actual</span>
              <StatusBadge map={TOURNAMENT_STATUS} value={current.status} />
            </div>
            <div className="p-5">
              <h2 className="title-ink text-3xl leading-tight">{current.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Shield size={16} /> {current.approvedTeams} equipos
                </span>
                {current.startsAt ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={16} /> {formatDateTime(current.startsAt)}
                  </span>
                ) : null}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
            </div>
          </section>
        ) : (
          <EmptyState title="Todavía no hay torneos publicados">Vuelve pronto: aquí aparecerá el próximo torneo.</EmptyState>
        )}

        {others.length ? (
          <section className="mt-8">
            <h2 className="title-ink mb-3 text-2xl uppercase">Otros torneos</h2>
            <div className="space-y-3">
              {others.map((t) => (
                <Link key={t.id} href={`/torneos/${t.slug}`} className="card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-display truncate text-lg">{t.name}</p>
                    <p className="text-xs text-muted">{t.approvedTeams} equipos</p>
                  </div>
                  <span className="flex items-center gap-2">
                    <StatusBadge map={TOURNAMENT_STATUS} value={t.status} />
                    <ChevronRight size={18} className="text-muted" />
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/torneos" className="mt-4 block text-center text-sm font-bold text-muted underline">
              Ver todos los torneos
            </Link>
          </section>
        ) : null}
      </Container>
    </>
  );
}
