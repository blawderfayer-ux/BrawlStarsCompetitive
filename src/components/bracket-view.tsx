"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { SeriesView, TeamView } from "@/lib/views";
import { SeriesCard } from "./series-card";
import { TeamLogo } from "./ui";
import { useMyTeam } from "./use-my-team";

const CARD_W = 200;
const CARD_H = 68;
const SLOT_H = 84;
const GAP_X = 44;

function MiniTeam({
  team,
  score,
  won,
  lost,
  show,
  empty = "Por definir",
}: {
  team: TeamView | null;
  score: number;
  won: boolean;
  lost: boolean;
  show: boolean;
  empty?: string;
}) {
  return (
    <div className={cn("flex h-[30px] items-center gap-2 px-2", lost && "opacity-45")}>
      <TeamLogo team={team} size={20} className="!rounded-md" />
      <span className={cn("min-w-0 flex-1 truncate text-[13px] font-extrabold", !team && "font-bold text-muted", won && "text-brand")}>
        {team?.name ?? empty}
      </span>
      {show ? <span className={cn("font-display text-base", won ? "text-brand" : "text-muted")}>{score}</span> : null}
    </div>
  );
}

function MiniSeries({ s, slug, highlight }: { s: SeriesView; slug: string; highlight?: string | null }) {
  const started = s.scoreA + s.scoreB > 0 || !!s.winnerSlot;
  const hit = highlight && (s.teamA?.id === highlight || s.teamB?.id === highlight);
  const content = (
    <div
      className={cn(
        "flex h-full flex-col justify-center overflow-hidden rounded-xl border bg-card",
        s.status === "live" ? "border-live shadow-[0_0_16px_#f43f5e55]" : hit ? "border-brand" : "border-line",
        s.isBye && "border-dashed opacity-70",
      )}
    >
      <MiniTeam team={s.teamA} score={s.scoreA} won={s.winnerSlot === "A"} lost={s.winnerSlot === "B"} show={started && !s.isBye} empty={s.isBye ? "BYE" : undefined} />
      <div className="mx-2 h-px bg-line" />
      <MiniTeam
        team={s.teamB}
        score={s.scoreB}
        won={s.winnerSlot === "B"}
        lost={s.winnerSlot === "A"}
        show={started && !s.isBye}
        empty={s.isBye ? "BYE" : undefined}
      />
    </div>
  );
  if (s.isBye) return content;
  return (
    <Link href={`/torneos/${slug}/partidas/${s.number}`} className="block h-full" aria-label={`Partida #${s.number}`}>
      {content}
    </Link>
  );
}

/** Árbol completo con líneas: se desplaza en horizontal en pantallas chicas. */
function FullTree({ series, totalRounds, slug, highlight }: { series: SeriesView[]; totalRounds: number; slug: string; highlight?: string | null }) {
  const firstRound = series.filter((s) => s.round === 1).length;
  const height = firstRound * SLOT_H;
  const width = totalRounds * CARD_W + (totalRounds - 1) * GAP_X;

  const pos = (s: SeriesView) => {
    const block = SLOT_H * 2 ** (s.round - 1);
    return {
      left: (s.round - 1) * (CARD_W + GAP_X),
      top: (s.position - 1) * block + (block - CARD_H) / 2,
    };
  };
  const byKey = new Map(series.map((s) => [s.key, s]));

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-2">
      <div className="mb-2 flex gap-[44px]" style={{ width }}>
        {Array.from({ length: totalRounds }, (_, i) => (
          <div key={i} style={{ width: CARD_W }} className="text-center text-xs font-extrabold uppercase text-muted">
            {series.find((s) => s.round === i + 1)?.roundName}
          </div>
        ))}
      </div>
      <div className="relative" style={{ width, height }}>
        <svg className="absolute inset-0" width={width} height={height} aria-hidden>
          {series.map((s) => {
            const next = s.nextKey ? byKey.get(s.nextKey) : null;
            if (!next) return null;
            const a = pos(s);
            const b = pos(next);
            const x1 = a.left + CARD_W;
            const y1 = a.top + CARD_H / 2;
            const x2 = b.left;
            const y2 = b.top + CARD_H / 2;
            const mid = x1 + GAP_X / 2;
            const done = !!s.winnerSlot;
            return (
              <path
                key={s.key}
                d={`M${x1},${y1} H${mid} V${y2} H${x2}`}
                fill="none"
                stroke={done ? "#ffd23f" : "#2f2a66"}
                strokeWidth={done ? 2.5 : 2}
              />
            );
          })}
        </svg>
        {series.map((s) => {
          const p = pos(s);
          return (
            <div key={s.key} className="absolute" style={{ left: p.left, top: p.top, width: CARD_W, height: CARD_H }}>
              <MiniSeries s={s} slug={slug} highlight={highlight} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BracketView({
  series,
  totalRounds,
  slug,
  championName,
}: {
  series: SeriesView[];
  totalRounds: number;
  slug: string;
  championName?: string | null;
}) {
  const [mode, setMode] = useState<"rounds" | "tree">("rounds");
  const [highlight] = useMyTeam(slug);

  // La ronda que se está jugando: la primera con series sin terminar.
  const activeRound = useMemo(() => {
    const open = series.find((s) => !s.winnerSlot && s.status !== "cancelled");
    return open?.round ?? totalRounds;
  }, [series, totalRounds]);
  const [round, setRound] = useState(activeRound);

  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const inRound = series.filter((s) => s.round === round && !s.isBye);
  const byes = series.filter((s) => s.round === round && s.isBye);

  return (
    <div>
      {championName ? (
        <div className="card pop-in mb-4 flex items-center gap-3 border-brand/60 p-4">
          <span className="text-4xl" aria-hidden>
            🏆
          </span>
          <div>
            <div className="text-xs font-extrabold uppercase text-muted">Campeón</div>
            <div className="font-display text-2xl text-brand">{championName}</div>
          </div>
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-card p-1">
        {(["rounds", "tree"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "min-h-[42px] rounded-xl text-sm font-extrabold uppercase",
              mode === m ? "bg-accent text-white" : "text-muted",
            )}
          >
            {m === "rounds" ? "Por ronda" : "Cuadro completo"}
          </button>
        ))}
      </div>

      {mode === "tree" ? (
        <FullTree series={series} totalRounds={totalRounds} slug={slug} highlight={highlight} />
      ) : (
        <>
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
            {rounds.map((r) => {
              const name = series.find((s) => s.round === r)?.roundName ?? `Ronda ${r}`;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRound(r)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-extrabold uppercase",
                    r === round ? "border-brand bg-brand/15 text-brand" : "border-line bg-card text-muted",
                  )}
                >
                  {r === activeRound && !championName ? <span className="live-dot !h-2 !w-2" aria-hidden /> : null}
                  {name}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {inRound.map((s) => (
              <SeriesCard key={s.key} series={s} href={`/torneos/${slug}/partidas/${s.number}`} highlightTeamId={highlight} />
            ))}
          </div>
          {byes.length ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-extrabold uppercase text-muted">Avanzan directo (BYE)</p>
              <div className="flex flex-wrap gap-2">
                {byes.map((s) => {
                  const team = s.winnerSlot === "A" ? s.teamA : s.teamB;
                  return (
                    <span key={s.key} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-bold">
                      <TeamLogo team={team} size={22} className="!rounded-md" />
                      {team?.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
