import { DoorOpen, Hourglass } from "lucide-react";
import Link from "next/link";
import type { SeriesView, TeamView, TournamentView } from "@/lib/views";
import { teamLogoutAction } from "@/app/torneos/actions";
import { SeriesCard } from "./series-card";
import { RememberTeam, TeamLogoutButton } from "./team-code-login";
import { ModeMapChip, TeamLogo } from "./ui";

/** Qué le toca al equipo ahora mismo, en palabras simples. */
export function myTeamStatus(team: TeamView, tournament: TournamentView, series: SeriesView[]) {
  const mine = series.filter((s) => !s.isBye && (s.teamA?.id === team.id || s.teamB?.id === team.id));
  const next = mine.find((s) => !s.winnerSlot && s.status !== "cancelled") ?? null;
  const last = [...mine].reverse().find((s) => s.winnerSlot) ?? null;
  // Si todavía no hay rival, la partida que lo define.
  const feeder =
    next && !(next.teamA && next.teamB)
      ? series.find((s) => s.nextKey === next.key && !s.winnerSlot && !s.isBye && s.teamA?.id !== team.id && s.teamB?.id !== team.id) ?? null
      : null;

  let headline = "Tu equipo está inscrito";
  let detail = "Cuando la organización publique el bracket, aquí aparecerá tu partida.";
  if (team.competitionStatus === "champion") {
    headline = "¡Son campeones!";
    detail = "Ganaron el torneo. ¡Felicidades!";
  } else if (team.competitionStatus === "eliminated") {
    headline = "Quedaron eliminados";
    detail = "Gracias por jugar. Puedes seguir el resto del torneo en el bracket.";
  } else if (team.competitionStatus === "disqualified") {
    headline = "Descalificados";
    detail = "Habla con la organización si crees que es un error.";
  } else if (tournament.bracketGeneratedAt && next?.teamA && next.teamB) {
    headline = next.status === "live" ? "¡Están jugando ahora!" : "¡Ya tienen partida!";
    detail = "Abre la sala de la partida: ahí hablan con el rival y reportan el resultado.";
  } else if (tournament.bracketGeneratedAt && next) {
    headline = "Esperando a su rival";
    detail = feeder
      ? `Su rival sale de la partida #${feeder.number} (${feeder.teamA?.name ?? "?"} vs ${feeder.teamB?.name ?? "?"}). Esta página se actualiza sola.`
      : "Su rival se define cuando termine la partida anterior. Esta página se actualiza sola.";
  }
  return { next, last, headline, detail, ready: !!(next?.teamA && next.teamB) };
}

/**
 * Panel "Mi equipo" (con el código ya puesto): la próxima partida y el botón para entrar a la sala.
 * `compact` es la versión que va en el inicio del torneo.
 */
export function MyTeamPanel({
  slug,
  tournament,
  team,
  series,
  compact = false,
}: {
  slug: string;
  tournament: TournamentView;
  team: TeamView;
  series: SeriesView[];
  compact?: boolean;
}) {
  const { next, last, headline, detail, ready } = myTeamStatus(team, tournament, series);
  const current = next?.games.find((g) => g.status === "pending") ?? null;
  const roomHref = next ? `/torneos/${slug}/partidas/${next.number}#sala` : null;

  return (
    <section className="space-y-3">
      <RememberTeam slug={slug} teamId={team.id} />
      <div className="flex items-center gap-3">
        <TeamLogo team={team} size={compact ? 44 : 56} />
        <div className="min-w-0 flex-1">
          <span className="tag-skew text-xs">
            <span>Mi equipo</span>
          </span>
          <p className="title-ink mt-1 truncate text-2xl leading-tight">{team.name}</p>
        </div>
        <TeamLogoutButton action={teamLogoutAction} slug={slug} />
      </div>

      <div className={ready ? "card overflow-hidden outline-2 outline-brand outline" : "card overflow-hidden"}>
        <div className="flex items-start gap-3 p-4">
          {ready ? (
            <DoorOpen className="mt-0.5 shrink-0 text-brand" size={26} />
          ) : (
            <Hourglass className="mt-0.5 shrink-0 text-muted" size={24} />
          )}
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight">{headline}</p>
            <p className="mt-1 text-sm text-muted">{detail}</p>
          </div>
        </div>
        {ready && roomHref ? (
          <div className="space-y-3 border-t border-line bg-bg-soft p-4">
            {current ? (
              <div>
                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-muted">
                  Ahora juegan · Game {current.number}
                </p>
                <ModeMapChip mode={current.mode} map={current.map} />
              </div>
            ) : null}
            <Link href={roomHref} className="btn btn-primary w-full text-lg">
              Abrir la sala de mi partida
            </Link>
          </div>
        ) : null}
      </div>

      {next ? (
        <SeriesCard series={next} href={`/torneos/${slug}/partidas/${next.number}`} highlightTeamId={team.id} compact={compact} />
      ) : last ? (
        <SeriesCard series={last} href={`/torneos/${slug}/partidas/${last.number}`} highlightTeamId={team.id} compact />
      ) : null}

      {ready && !compact ? (
        <ol className="card space-y-3 p-4 text-sm">
          <p className="font-display text-lg">Qué hacer en la partida</p>
          {[
            "Abre la sala con el botón amarillo. Ahí solo están tu equipo, tu rival y el árbitro.",
            "Pónganse de acuerdo en el chat: uno crea la sala en Brawl Stars (Jugar → Amistoso), elige el modo y el mapa de arriba y pasa el código o link de invitación.",
            "Cuando termine el game, toquen GANAMOS o PERDIMOS. El árbitro confirma y el marcador cambia solo.",
            next && next.bestOf > 1
              ? `Es al mejor de ${next.bestOf}: repitan con el siguiente mapa hasta que alguien gane ${Math.floor(next.bestOf / 2) + 1}.`
              : "Si ganan, pasan solos a la siguiente ronda: vuelvan a esta página para ver su nueva partida.",
          ].map((text, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-brand text-base text-brand-ink">
                {i + 1}
              </span>
              <span className="pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
