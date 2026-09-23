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
    <ol className="space-y-2">
      {series.games.map((g) => {
        const winner = g.winnerSlot === "A" ? series.teamA : g.winnerSlot === "B" ? series.teamB : null;
        const isCurrent = current?.number === g.number;
        return (
          <li
            key={g.number}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3",
              isCurrent && isLive ? "border-live bg-live/10" : isCurrent ? "border-brand/60 bg-brand/5" : "border-line bg-bg-soft",
              g.status === "skipped" && "opacity-45",
            )}
          >
            <div className="w-14 shrink-0 text-center">
              <div className="text-[10px] font-extrabold uppercase text-muted">Mapa</div>
              <div className="font-display text-2xl leading-none">{g.number}</div>
            </div>
            <div className="min-w-0 flex-1">
              <ModeMapChip mode={g.mode} map={g.map} />
            </div>
            <div className="shrink-0 text-right text-xs font-extrabold uppercase">
              {g.status === "finished" && winner ? (
                <span className="flex items-center gap-1.5 text-brand">
                  <TeamLogo team={winner} size={22} className="!rounded-md" />
                  <span className="max-w-[80px] truncate">{winner.name}</span>
                </span>
              ) : g.status === "skipped" ? (
                <span className="text-muted">No se jugó</span>
              ) : isCurrent && isLive ? (
                <span className="flex items-center gap-1.5 text-live">
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
    <Link href={`/torneos/${slug}/partidas/${series.number}`} className="card block overflow-hidden ring-2 ring-live/60">
      <div className="flex items-center justify-between bg-live/15 px-4 py-2 text-xs font-extrabold uppercase">
        <span className="flex items-center gap-2 text-live">
          <span className="live-dot" aria-hidden /> Partida en curso
        </span>
        <span className="text-muted">
          #{series.number} · {series.roundName} · BO{series.bestOf}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamLogo team={series.teamA} size={56} />
          <span className="w-full truncate font-extrabold">{series.teamA?.name}</span>
        </div>
        <div className="text-center">
          <div className="font-display text-4xl leading-none">
            {series.scoreA} <span className="text-muted">-</span> {series.scoreB}
          </div>
          <div className="mt-1 text-xs font-extrabold text-muted">VS</div>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamLogo team={series.teamB} size={56} />
          <span className="w-full truncate font-extrabold">{series.teamB?.name}</span>
        </div>
      </div>
      {game ? (
        <div className="border-t border-line/70 px-4 py-3">
          <div className="mb-2 text-xs font-extrabold uppercase text-muted">Mapa actual · Game {game.number}</div>
          <ModeMapChip mode={game.mode} map={game.map} size="lg" />
        </div>
      ) : null}
    </Link>
  );
}
