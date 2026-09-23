import Link from "next/link";
import { notFound } from "next/navigation";
import { GamesList } from "@/components/series-detail";
import { SectionTitle, StatusBadge, TeamLogo } from "@/components/ui";
import { SERIES_STATUS } from "@/lib/labels";
import { cn, formatDateTime } from "@/lib/utils";
import type { TeamView } from "@/lib/views";
import { loadTournament } from "../../data";

function Side({ team, slug, won, lost }: { team: TeamView | null; slug: string; won: boolean; lost: boolean }) {
  const inner = (
    <div className={cn("flex min-w-0 flex-col items-center gap-2 text-center", lost && "opacity-50")}>
      <TeamLogo team={team} size={64} />
      <span className={cn("w-full truncate font-extrabold", won && "text-brand")}>
        {team?.name ?? "Por definir"} {won ? "👑" : ""}
      </span>
    </div>
  );
  return team ? <Link href={`/torneos/${slug}/equipos/${team.slug}`}>{inner}</Link> : inner;
}

export default async function MatchPage({ params }: { params: Promise<{ slug: string; number: string }> }) {
  const { slug, number } = await params;
  const { series, tournament } = await loadTournament(slug);
  const s = series.find((x) => !x.isBye && x.number === Number(number));
  if (!s) notFound();

  const next = s.nextKey ? series.find((x) => x.key === s.nextKey) : null;
  const winner = s.winnerSlot === "A" ? s.teamA : s.winnerSlot === "B" ? s.teamB : null;

  return (
    <div className="space-y-6">
      <section className={cn("card overflow-hidden", s.status === "live" && "ring-2 ring-live/60")}>
        <div className="flex items-center justify-between gap-2 border-b border-line/70 px-4 py-3 text-xs font-extrabold uppercase text-muted">
          <span>
            Partida #{s.number} · {s.roundName}
          </span>
          <StatusBadge map={SERIES_STATUS} value={s.status} />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-5">
          <Side team={s.teamA} slug={slug} won={s.winnerSlot === "A"} lost={s.winnerSlot === "B"} />
          <div className="text-center">
            <div className="font-display text-5xl leading-none">
              {s.scoreA}
              <span className="mx-1 text-muted">-</span>
              {s.scoreB}
            </div>
            <div className="mt-2 rounded-lg bg-bg-soft px-2 py-1 text-xs font-extrabold">BO{s.bestOf}</div>
          </div>
          <Side team={s.teamB} slug={slug} won={s.winnerSlot === "B"} lost={s.winnerSlot === "A"} />
        </div>
        {s.scheduledAt || s.notes || s.walkover ? (
          <div className="space-y-1 border-t border-line/70 px-4 py-3 text-sm">
            {s.scheduledAt ? <p className="font-bold">🕒 {formatDateTime(s.scheduledAt)}</p> : null}
            {s.walkover ? <p className="font-bold text-muted">Resultado por walkover.</p> : null}
            {s.notes ? <p className="text-muted">{s.notes}</p> : null}
          </div>
        ) : null}
      </section>

      <section>
        <SectionTitle>Mapas de la serie</SectionTitle>
        <p className="mb-3 text-sm text-muted">
          Orden oficial definido por la organización. Primero en ganar {Math.floor(s.bestOf / 2) + 1}{" "}
          {s.bestOf === 1 ? "mapa" : "mapas"} gana la serie.
        </p>
        <GamesList series={s} />
      </section>

      {winner && next ? (
        <p className="card p-4 text-sm font-bold">
          ➡️ {winner.name} avanza a {next.roundName.toLowerCase()} (partida #{next.number}).
        </p>
      ) : winner && !next ? (
        <p className="card border-brand/60 p-4 text-center font-display text-xl text-brand">🏆 {winner.name} es el campeón</p>
      ) : null}

      <div className="flex gap-3">
        <Link href={`/torneos/${slug}/partidas`} className="btn btn-ghost flex-1">
          Todas las partidas
        </Link>
        <Link href={`/torneos/${slug}/bracket`} className="btn btn-ghost flex-1">
          Bracket
        </Link>
      </div>
      {tournament.status === "live" ? (
        <p className="text-center text-xs text-muted">Se actualiza automáticamente.</p>
      ) : null}
    </div>
  );
}
