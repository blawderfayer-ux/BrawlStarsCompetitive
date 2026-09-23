import { Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GamesList } from "@/components/series-detail";
import { SeriesCard } from "@/components/series-card";
import { MatchRoom, TeamLogin } from "@/components/match-room";
import { SectionTitle } from "@/components/ui";
import { getRoomAccess } from "@/lib/team-session";
import { formatDateTime } from "@/lib/utils";
import { reportGameAction } from "@/app/admin/actions";
import { reportResultAction, teamLoginAction, teamLogoutAction } from "../../../actions";
import { loadTournament } from "../../data";

export default async function MatchPage({ params }: { params: Promise<{ slug: string; number: string }> }) {
  const { slug, number } = await params;
  const { series, tournament } = await loadTournament(slug);
  const s = series.find((x) => !x.isBye && x.number === Number(number));
  if (!s) notFound();

  const next = s.nextKey ? series.find((x) => x.key === s.nextKey) : null;
  const winner = s.winnerSlot === "A" ? s.teamA : s.winnerSlot === "B" ? s.teamB : null;

  // Sala privada: solo cuando los dos equipos están definidos.
  const hasRoom = !!(s.teamA && s.teamB) && s.status !== "cancelled";
  const access = hasRoom ? await getRoomAccess({ teamA: s.teamA?.id, teamB: s.teamB?.id }) : { kind: "none" as const };
  const current = s.games.find((g) => g.status === "pending");
  const gameLabel = current ? `${current.mode?.name ?? "Modo"} · ${current.map?.name ?? "Mapa por definir"}` : "";

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

      {hasRoom && s.teamA && s.teamB ? (
        access.kind === "none" ? (
          <TeamLogin
            action={teamLoginAction}
            slug={slug}
            tournamentId={tournament.id}
            teams={[
              { id: s.teamA.id, name: s.teamA.name },
              { id: s.teamB.id, name: s.teamB.name },
            ]}
          />
        ) : (
          <MatchRoom
            seriesId={s.id}
            me={access.kind === "staff" ? { kind: "staff", name: access.name } : access}
            teamA={{ id: s.teamA.id, name: s.teamA.name }}
            teamB={{ id: s.teamB.id, name: s.teamB.name }}
            reportAction={reportResultAction}
            confirmAction={reportGameAction}
            logoutAction={teamLogoutAction}
            initialGame={current?.number ?? null}
            gameLabel={gameLabel}
          />
        )
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
