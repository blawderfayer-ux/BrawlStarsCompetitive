import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SeriesView } from "@/lib/views";
import { currentGameOf } from "./series-card";
import { ModeMapChip, TeamLogo } from "./ui";

/** Lista de mapas de la serie: MAPA 1, MAPA 2, MAPA 3… con modo, mapa y ganador. */
export function GamesList({ series }: { series: SeriesView }) {
  const current = currentGameOf(series);
  const isLive = series.status === "live";
  return (
    <ol className="space-y-2.5">
      {series.games.map((g) => {
        const winner = g.winnerSlot === "A" ? series.teamA : g.winnerSlot === "B" ? series.teamB : null;
        const isCurrent = current?.number === g.number;
        return (
          <li
            key={g.number}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-[2.5px] border-ink p-2.5 shadow-[0_3px_0_var(--ink)]",
              isCurrent && isLive ? "bg-red/25" : isCurrent ? "bg-brand/15" : "bg-card",
              g.status === "skipped" && "opacity-45",
            )}
          >
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-ink bg-bg-soft">
              <span className="text-[9px] font-black uppercase leading-none text-muted">Game</span>
              <span className="title-ink text-2xl leading-none">{g.number}</span>
            </div>
            <div className="min-w-0 flex-1">
              <ModeMapChip mode={g.mode} map={g.map} size="sm" />
            </div>
            <div className="shrink-0 text-right text-[11px] font-black uppercase">
              {g.status === "finished" && winner ? (
                <span className="flex items-center gap-1.5 text-brand">
                  <TeamLogo team={winner} size={24} className="!rounded-md" />
                  <span className="max-w-[80px] truncate">{winner.name}</span>
                </span>
              ) : g.status === "skipped" ? (
                <span className="text-muted">No se jugó</span>
              ) : isCurrent && isLive ? (
                <span className="flex items-center gap-1.5 text-white">
                  <span className="live-dot !h-2 !w-2" aria-hidden /> En juego
                </span>
              ) : isCurrent ? (
                <span className="text-brand">Siguiente</span>
              ) : (
                <span className="text-muted">Pendiente</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Bloque grande de "PARTIDA EN CURSO": equipos, marcador y mapa actual bien visibles. */
export function LiveSeriesHero({ series, slug }: { series: SeriesView; slug: string }) {
  const game = currentGameOf(series);
  return (
    <Link href={`/torneos/${slug}/partidas/${series.number}`} className="card relative isolate block overflow-hidden">
      <Image src="/img/vs.webp" alt="" fill sizes="(max-width: 640px) 100vw, 640px" className="-z-20 object-cover opacity-30" />
      <div className="halftone absolute inset-0 -z-10" aria-hidden />
      <div className="flex items-center justify-between border-b-[2.5px] border-ink bg-red px-4 py-2">
        <span className="font-display flex items-center gap-2 text-sm uppercase text-white">
          <span className="live-dot !bg-white" aria-hidden /> Partida en curso
        </span>
        <span className="font-display text-sm uppercase text-white/85">
          #{series.number} · {series.roundName} · BO{series.bestOf}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-5">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamLogo team={series.teamA} size={60} className="ring-4 ring-blue" />
          <span className="font-display w-full truncate text-lg">{series.teamA?.name}</span>
        </div>
        <div className="title-ink text-center text-5xl leading-none">
          <span className="text-blue">{series.scoreA}</span>
          <span className="mx-1 text-white">-</span>
          <span className="text-red">{series.scoreB}</span>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamLogo team={series.teamB} size={60} className="ring-4 ring-red" />
          <span className="font-display w-full truncate text-lg">{series.teamB?.name}</span>
        </div>
      </div>
      {game ? (
        <div className="border-t-[2.5px] border-ink bg-bg-soft/90 px-4 py-3">
          <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-muted">Mapa actual · Game {game.number}</div>
          <ModeMapChip mode={game.mode} map={game.map} size="lg" />
        </div>
      ) : null}
    </Link>
  );
}
