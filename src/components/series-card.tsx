import Link from "next/link";
import { SERIES_STATUS } from "@/lib/labels";
import { cn, formatDateTime } from "@/lib/utils";
import type { SeriesView, TeamView } from "@/lib/views";
import { ModeMapChip, StatusBadge, TeamLogo } from "./ui";

export function currentGameOf(series: SeriesView) {
  if (series.winnerSlot) return null;
  return series.games.find((g) => g.status === "pending") ?? null;
}

function TeamRow({
  team,
  score,
  won,
  lost,
  highlight,
  showScore,
}: {
  team: TeamView | null;
  score: number;
  won: boolean;
  lost: boolean;
  highlight: boolean;
  showScore: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", lost && "opacity-50")}>
      <TeamLogo team={team} size={36} />
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-extrabold",
          highlight && "text-brand",
          !team && "font-bold text-muted",
        )}
      >
        {team?.name ?? "Por definir"}
        {won ? <span className="ml-1.5" aria-label="ganador">👑</span> : null}
      </span>
      {showScore ? (
        <span className={cn("font-display w-7 text-center text-2xl", won ? "text-brand" : "text-muted")}>{score}</span>
      ) : null}
    </div>
  );
}

/** Tarjeta de una serie (enfrentamiento). Sirve para listas y para "próxima partida". */
export function SeriesCard({
  series,
  href,
  highlightTeamId,
  compact = false,
}: {
  series: SeriesView;
  href?: string;
  highlightTeamId?: string | null;
  compact?: boolean;
}) {
  const game = currentGameOf(series);
  const started = series.scoreA + series.scoreB > 0 || !!series.winnerSlot;
  const body = (
    <div className={cn("card p-4 transition-colors", href && "active:bg-card-hi", series.status === "live" && "ring-2 ring-live/70")}>
      <div className="mb-3 flex items-center justify-between gap-2 text-xs font-bold text-muted">
        <span className="uppercase">
          {series.isBye ? "BYE" : `Partida #${series.number}`} · {series.roundName} · BO{series.bestOf}
        </span>
        <StatusBadge map={SERIES_STATUS} value={series.status} />
      </div>
      <div className="space-y-2">
        <TeamRow
          team={series.teamA}
          score={series.scoreA}
          won={series.winnerSlot === "A"}
          lost={series.winnerSlot === "B"}
          highlight={!!highlightTeamId && series.teamA?.id === highlightTeamId}
          showScore={started && !series.isBye}
        />
        <TeamRow
          team={series.teamB}
          score={series.scoreB}
          won={series.winnerSlot === "B"}
          lost={series.winnerSlot === "A"}
          highlight={!!highlightTeamId && series.teamB?.id === highlightTeamId}
          showScore={started && !series.isBye}
        />
      </div>
      {!compact && !series.isBye && (game || series.scheduledAt || series.walkover) ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
          {game ? (
            <div className="min-w-0">
              <div className="mb-1 text-[11px] font-bold uppercase text-muted">
                {series.status === "live" ? "Mapa actual" : "Primer mapa"} · Game {game.number}
              </div>
              <ModeMapChip mode={game.mode} map={game.map} size="sm" />
            </div>
          ) : series.walkover ? (
            <span className="text-sm font-bold text-muted">Ganó por walkover</span>
          ) : (
            <span />
          )}
          {series.scheduledAt && !series.winnerSlot ? (
            <span className="rounded-lg bg-bg-soft px-2 py-1 text-xs font-bold">🕒 {formatDateTime(series.scheduledAt)}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
