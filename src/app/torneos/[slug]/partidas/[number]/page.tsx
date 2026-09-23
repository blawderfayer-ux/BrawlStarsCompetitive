import { Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GamesList } from "@/components/series-detail";
import { SeriesCard } from "@/components/series-card";
import { SectionTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { loadTournament } from "../../data";

export default async function MatchPage({ params }: { params: Promise<{ slug: string; number: string }> }) {
  const { slug, number } = await params;
  const { series, tournament } = await loadTournament(slug);
  const s = series.find((x) => !x.isBye && x.number === Number(number));
  if (!s) notFound();

  const next = s.nextKey ? series.find((x) => x.key === s.nextKey) : null;
  const winner = s.winnerSlot === "A" ? s.teamA : s.winnerSlot === "B" ? s.teamB : null;

  return (
    <div className="space-y-6">
      <SeriesCard series={s} />
      {s.scheduledAt || s.notes || s.walkover ? (
        <div className="card space-y-1 p-4 text-sm">
          {s.scheduledAt ? (
            <p className="flex items-center gap-1.5 font-bold">
              <Clock size={16} /> {formatDateTime(s.scheduledAt)}
            </p>
          ) : null}
          {s.walkover ? <p className="font-bold text-muted">Resultado por walkover.</p> : null}
          {s.notes ? <p className="text-muted">{s.notes}</p> : null}
        </div>
      ) : null}

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
          {winner.name} avanza a {next.roundName.toLowerCase()} (partida #{next.number}).
        </p>
      ) : winner && !next ? (
        <p className="card bg-brand p-4 text-center font-display text-xl text-brand-ink">{winner.name} es el campeón</p>
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
