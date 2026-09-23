import { Clock, Crown } from "lucide-react";
import Link from "next/link";
import { SERIES_STATUS } from "@/lib/labels";
import { cn, formatDateTime } from "@/lib/utils";
import type { SeriesView, TeamView } from "@/lib/views";
import { ModeMapChip, StatusBadge, TeamLogo } from "./ui";

export function currentGameOf(series: SeriesView) {
  if (series.winnerSlot) return null;
  return series.games.find((g) => g.status === "pending") ?? null;
}

/** Un lado del enfrentamiento: azul (A) a la izquierda, rojo (B) a la derecha, como en el juego. */
function Side({
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
  const blue = side === "A";
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col items-center gap-1.5 px-2 text-center",
        compact ? "py-3" : "py-4",
        blue ? "bg-blue/25" : "bg-red/25",
        lost && "opacity-50 grayscale-[40%]",
      )}
    >
      {won ? <Crown size={18} className="absolute top-1.5 text-brand drop-shadow-[0_2px_0_var(--ink)]" fill="currentColor" /> : null}
      <TeamLogo team={team} size={compact ? 40 : 48} className={won ? "mt-3" : undefined} />
      <span
        className={cn(
          "font-display w-full truncate leading-tight",
          compact ? "text-sm" : "text-base",
          highlight ? "text-brand" : team ? "text-text" : "text-muted",
        )}
      >
        {team?.name ?? "Por definir"}
      </span>
      {showScore ? <span className={cn("title-ink text-3xl leading-none", won ? "text-brand" : "text-white")}>{score}</span> : null}
    </div>
  );
}

/** Tarjeta de un enfrentamiento. Sirve para listas, "próxima partida" y el panel. */
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
  const body = (
    <div className={cn("card overflow-hidden", series.status === "live" && "outline-[3px] outline-offset-0 outline-live outline")}>
      <div className="flex items-center justify-between gap-2 border-b-[2.5px] border-ink bg-card-hi px-3 py-2">
        <span className="font-display truncate text-sm uppercase text-muted">
          {series.isBye ? "BYE" : `#${series.number}`} · {series.roundName} · <span className="text-text">BO{series.bestOf}</span>
        </span>
        <StatusBadge map={SERIES_STATUS} value={series.status} />
      </div>

      <div className="relative grid grid-cols-2">
        <Side
          team={series.teamA}
          score={series.scoreA}
          side="A"
          won={series.winnerSlot === "A"}
          lost={series.winnerSlot === "B"}
          highlight={!!highlightTeamId && series.teamA?.id === highlightTeamId}
          showScore={showScore}
          compact={compact}
        />
        <Side
          team={series.teamB}
          score={series.scoreB}
          side="B"
          won={series.winnerSlot === "B"}
          lost={series.winnerSlot === "A"}
          highlight={!!highlightTeamId && series.teamB?.id === highlightTeamId}
          showScore={showScore}
          compact={compact}
        />
        {/* Insignia "VS" inclinada sobre la línea central */}
        <span className="title-ink pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -skew-x-12 rounded-lg border-2 border-ink bg-brand px-1.5 text-lg leading-tight text-white shadow-[0_3px_0_var(--ink)]">
          VS
        </span>
      </div>

      {!compact && !series.isBye && (game || series.scheduledAt || series.walkover) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t-[2.5px] border-ink bg-bg-soft px-3 py-2.5">
          {game ? (
            <div className="min-w-0">
              <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-muted">
                {series.status === "live" ? "Jugando ahora" : "Primer mapa"} · Game {game.number}
              </div>
              <ModeMapChip mode={game.mode} map={game.map} size="sm" />
            </div>
          ) : series.walkover ? (
            <span className="text-sm font-bold text-muted">Ganó por walkover</span>
          ) : (
            <span />
          )}
          {series.scheduledAt && !series.winnerSlot ? (
            <span className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-card px-2 py-1 text-xs font-black">
              <Clock size={13} /> {formatDateTime(series.scheduledAt)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-transform active:translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}
