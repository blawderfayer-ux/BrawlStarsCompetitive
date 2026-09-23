"use client";

import Link from "next/link";
import type { SeriesView, TeamView } from "@/lib/views";
import { SeriesCard } from "./series-card";
import { TeamLogo } from "./ui";
import { useMyTeam } from "./use-my-team";

/** "Mi equipo": el jugador elige su equipo una vez y ve siempre su próxima partida. */
export function MyTeamCard({ slug, teams, series }: { slug: string; teams: TeamView[]; series: SeriesView[] }) {
  const [teamId, setTeamId] = useMyTeam(slug);

  if (teams.length === 0) return null;
  const team = teams.find((t) => t.id === teamId) ?? null;

  if (!team) {
    return (
      <div className="card p-4">
        <p className="title-ink text-xl">¿Cuál es tu equipo?</p>
        <p className="mb-3 text-sm text-muted">Elígelo y te mostraremos siempre tu próxima partida.</p>
        <select
          className="input"
          defaultValue=""
          onChange={(e) => setTeamId(e.target.value || null)}
        >
          <option value="">Seleccionar equipo…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const mine = series.filter((s) => !s.isBye && (s.teamA?.id === team.id || s.teamB?.id === team.id));
  const next = mine.find((s) => !s.winnerSlot && s.status !== "cancelled");
  const last = [...mine].reverse().find((s) => s.winnerSlot);

  let headline = "Esperando rival";
  if (team.competitionStatus === "champion") headline = "¡Son campeones!";
  else if (team.competitionStatus === "eliminated") headline = "Eliminados del torneo";
  else if (team.competitionStatus === "disqualified") headline = "Descalificados";
  else if (next?.status === "live") headline = "¡Están jugando ahora!";
  else if (next && next.teamA && next.teamB) headline = "Tu próxima partida";

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <TeamLogo team={team} size={48} />
        <div className="min-w-0 flex-1">
          <span className="tag-skew text-xs">
            <span>Mi equipo · {headline}</span>
          </span>
          <Link href={`/torneos/${slug}/equipos/${team.slug}`} className="title-ink mt-1 block truncate text-2xl">
            {team.name}
          </Link>
        </div>
        <button type="button" className="text-xs font-bold text-muted underline" onClick={() => setTeamId(null)}>
          Cambiar
        </button>
      </div>
      {next ? (
        <SeriesCard series={next} href={`/torneos/${slug}/partidas/${next.number}`} highlightTeamId={team.id} />
      ) : last ? (
        <SeriesCard series={last} href={`/torneos/${slug}/partidas/${last.number}`} highlightTeamId={team.id} compact />
      ) : (
        <p className="text-sm text-muted">El bracket todavía no se generó.</p>
      )}
    </section>
  );
}

export function SetMyTeamButton({ slug, teamId }: { slug: string; teamId: string }) {
  const [myTeam, setMyTeam] = useMyTeam(slug);
  const mine = myTeam === teamId;
  return (
    <button
      type="button"
      className={mine ? "btn btn-ghost btn-sm" : "btn btn-secondary btn-sm"}
      onClick={() => setMyTeam(mine ? null : teamId)}
    >
      {mine ? "Es mi equipo" : "Es mi equipo"}
    </button>
  );
}
