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
              "flex items-center gap-3 rounded-xl border border-line p-2.5",
              isCurrent && isLive ? "bg-red/10 ring-1 ring-live/50" : isCurrent ? "bg-brand/[0.07]" : "bg-card",
              g.status === "skipped" && "opacity-45",
            )}
          >
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-bg-soft">
              <span className="font-display text-[9px] uppercase leading-none tracking-wider text-muted">Game</span>
              <span className="font-display text-2xl leading-none">{g.number}</span>
            </div>
            <div className="min-w-0 flex-1">
              <ModeMapChip mode={g.mode} map={g.map} size="sm" />
            </div>
            <div className="font-display shrink-0 text-right text-xs uppercase tracking-wide">
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

/** Marcador grande de "EN VIVO", como la gráfica de una transmisión. */
export function LiveSeriesHero({ series, slug }: { series: SeriesView; slug: string }) {
  const game = currentGameOf(series);
  return (
    <Link href={`/torneos/${slug}/partidas/${series.number}`} className="card relative isolate block overflow-hidden ring-1 ring-live">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#3b82f622,transparent_35%,transparent_65%,#f43f5e22)]" aria-hidden />
      <div className="flex items-center justify-between gap-2 border-b border-line bg-bg-soft px-4 py-2">
        <span className="font-display flex items-center gap-2 text-sm uppercase tracking-wider text-rose-300">
          <span className="live-dot" aria-hidden /> En vivo
        </span>
        <span className="font-display truncate text-sm uppercase tracking-wider text-muted">
          Partida {series.number} · {series.roundName} · BO{series.bestOf}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-5">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamLogo team={series.teamA} size={56} className="ring-2 ring-blue" />
          <span className="font-display w-full truncate text-lg uppercase">{series.teamA?.name}</span>
        </div>
        <div className="font-display flex items-center gap-2 text-5xl leading-none tabular-nums">
          <span className={series.scoreA > series.scoreB ? "text-brand" : "text-text"}>{series.scoreA}</span>
          <span className="text-2xl text-muted">:</span>
          <span className={series.scoreB > series.scoreA ? "text-brand" : "text-text"}>{series.scoreB}</span>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamLogo team={series.teamB} size={56} className="ring-2 ring-red" />
          <span className="font-display w-full truncate text-lg uppercase">{series.teamB?.name}</span>
        </div>
      </div>
      {game ? (
        <div className="border-t border-line bg-bg-soft/80 px-4 py-3">
          <div className="eyebrow mb-2">Mapa actual · Game {game.number}</div>
          <ModeMapChip mode={game.mode} map={game.map} size="lg" />
        </div>
      ) : null}
    </Link>
  );
}
