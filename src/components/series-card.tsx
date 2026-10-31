import { Clock } from "lucide-react";
import Link from "next/link";
import { SERIES_STATUS } from "@/lib/labels";
import { cn, formatDateTime } from "@/lib/utils";
import type { SeriesView, TeamView } from "@/lib/views";
import { ModeMapChip, StatusBadge, TeamLogo } from "./ui";

export function currentGameOf(series: SeriesView) {
  if (series.winnerSlot) return null;
  return series.games.find((g) => g.status === "pending") ?? null;
}

/** Una fila del marcador: franja azul (A) o roja (B), escudo, nombre y resultado. */
function TeamRow({
  team,
  score,
  side,
  won,
  lost,
  highlight,
  showScore,
  compact,
}: {
  team: TeamView | null;
  score: number;
  side: "A" | "B";
  won: boolean;
  lost: boolean;
  highlight: boolean;
  showScore: boolean;
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-l-[3px] pr-3 pl-2.5",
        compact ? "py-2" : "py-2.5",
        side === "A" ? "border-blue" : "border-red",
        won && "bg-brand/[0.06]",
      )}
    >
      <TeamLogo team={team} size={compact ? 28 : 34} className={lost ? "opacity-50" : undefined} />
      <span
        className={cn(
          "font-display min-w-0 flex-1 truncate leading-tight",
          compact ? "text-[17px]" : "text-lg",
          highlight ? "text-brand" : !team ? "text-muted" : lost ? "text-muted" : "text-text",
        )}
      >
        {team?.name ?? "Por definir"}
      </span>
      {showScore ? (
        <span
          className={cn(
            "font-display w-7 text-center leading-none",
            compact ? "text-xl" : "text-2xl",
            won ? "text-brand" : lost ? "text-muted" : "text-text",
          )}
        >
          {score}
        </span>
      ) : null}
    </div>
  );
}

/** Tarjeta de un enfrentamiento, estilo marcador de esports. Sirve para listas, "mi partida" y el panel. */
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
  const showScore = started && !series.isBye;
  const live = series.status === "live";
  const body = (
    <div className={cn("card overflow-hidden transition-colors", live && "ring-1 ring-live", href && "hover:border-muted/40")}>
      <div className="flex items-center justify-between gap-2 border-b border-line bg-bg-soft px-3 py-1.5">
        <span className="font-display min-w-0 truncate text-xs uppercase tracking-wider text-muted">
          {series.isBye ? "BYE" : `Partida ${series.number}`} · {series.roundName} · <span className="text-text">BO{series.bestOf}</span>
        </span>
        <StatusBadge map={SERIES_STATUS} value={series.status} />
      </div>

      <TeamRow
        team={series.teamA}
        score={series.scoreA}
        side="A"
        won={series.winnerSlot === "A"}
        lost={series.winnerSlot === "B"}
        highlight={!!highlightTeamId && series.teamA?.id === highlightTeamId}
        showScore={showScore}
        compact={compact}
      />
      <div className="h-px bg-line" />
      <TeamRow
        team={series.teamB}
        score={series.scoreB}
        side="B"
        won={series.winnerSlot === "B"}
        lost={series.winnerSlot === "A"}
        highlight={!!highlightTeamId && series.teamB?.id === highlightTeamId}
        showScore={showScore}
        compact={compact}
      />

      {!compact && !series.isBye && (game || series.scheduledAt || series.walkover) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-bg-soft/60 px-3 py-2">
          {game ? (
            <div className="min-w-0">
              <div className="eyebrow mb-1 !text-[10px]">
                {live ? "Jugando ahora" : "Primer mapa"} · Game {game.number}
              </div>
              <ModeMapChip mode={game.mode} map={game.map} size="sm" />
            </div>
          ) : series.walkover ? (
            <span className="text-sm font-semibold text-muted">Ganó por walkover</span>
          ) : (
            <span />
          )}
          {series.scheduledAt && !series.winnerSlot ? (
            <span className="font-display inline-flex items-center gap-1 rounded-md bg-card-hi px-2 py-1 text-sm">
              <Clock size={13} /> {formatDateTime(series.scheduledAt)}
            </span>
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
