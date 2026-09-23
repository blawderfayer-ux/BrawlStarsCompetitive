import { Crown, Repeat, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SetMyTeamButton } from "@/components/my-team";
import { SeriesCard } from "@/components/series-card";
import { GamesList } from "@/components/series-detail";
import { SectionTitle, StatusBadge, TeamLogo } from "@/components/ui";
import { COMPETITION_STATUS, MEMBER_ROLE_LABEL } from "@/lib/labels";
import { loadTournament } from "../../data";

export default async function TeamPage({ params }: { params: Promise<{ slug: string; team: string }> }) {
  const { slug, team: teamSlug } = await params;
  const { teams, series } = await loadTournament(slug);
  const team = teams.find((t) => t.slug === teamSlug);
  if (!team) notFound();

  const mine = series.filter((s) => !s.isBye && (s.teamA?.id === team.id || s.teamB?.id === team.id));
  const bye = series.find((s) => s.isBye && (s.teamA?.id === team.id || s.teamB?.id === team.id));
  const next = mine.find((s) => !s.winnerSlot && s.status !== "cancelled");
  const played = mine.filter((s) => s.winnerSlot);
  const live = next?.status === "live";
  const rival = next ? (next.teamA?.id === team.id ? next.teamB : next.teamA) : null;

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="h-16" style={{ background: `linear-gradient(90deg, ${team.color}, transparent)` }} />
        <div className="-mt-10 px-4 pb-4">
          <TeamLogo team={team} size={80} className="border-4 border-card" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-3xl">{team.name}</h2>
            <StatusBadge map={COMPETITION_STATUS} value={live ? "in_match" : team.competitionStatus} />
          </div>
          <p className="text-sm text-muted">
            {team.seed ? `Seed ${team.seed} · ` : ""}
            {team.wins} victorias · {team.losses} derrotas
          </p>
          <div className="mt-3">
            <SetMyTeamButton slug={slug} teamId={team.id} />
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>Jugadores</SectionTitle>
        <ul className="card divide-y divide-line/70">
          {team.members.map((m, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex min-w-0 items-center gap-2">
                {m.role === "captain" ? <Crown size={18} className="text-brand" /> : m.role === "sub" ? <Repeat size={18} className="text-muted" /> : <UserRound size={18} className="text-muted" />}
                <span className="truncate font-extrabold">{m.name}</span>
              </span>
              <span className="shrink-0 text-right">
                {m.tag ? <span className="block font-mono text-xs text-muted">{m.tag}</span> : null}
                <span className="block text-[11px] font-bold uppercase text-muted">{MEMBER_ROLE_LABEL[m.role]}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {next && rival ? (
        <section>
          <SectionTitle>{live ? "Jugando ahora" : "Próxima partida"}</SectionTitle>
          <div className="card p-4">
            <p className="text-xs font-extrabold uppercase text-muted">Próximo rival</p>
            <Link href={`/torneos/${slug}/equipos/${rival.slug}`} className="mt-1 flex items-center gap-3">
              <TeamLogo team={rival} size={44} />
              <span className="font-display text-2xl">{rival.name}</span>
            </Link>
            <div className="mt-4">
              <GamesList series={next} />
            </div>
            <Link href={`/torneos/${slug}/partidas/${next.number}`} className="btn btn-ghost mt-4 w-full">
              Ver partida #{next.number}
            </Link>
          </div>
        </section>
      ) : next ? (
        <section className="card p-4 text-sm font-bold text-muted">Esperando a que se defina el próximo rival.</section>
      ) : null}

      <section>
        <SectionTitle>Historial</SectionTitle>
        {played.length === 0 && !bye ? (
          <p className="text-sm text-muted">Todavía no jugó ninguna partida.</p>
        ) : (
          <ol className="space-y-3">
            {bye ? (
              <li className="card flex items-center justify-between p-4">
                <span className="font-extrabold">{bye.roundName}</span>
                <span className="text-sm font-bold text-muted">Avanzó por BYE</span>
              </li>
            ) : null}
            {played.map((s) => {
              const won = (s.winnerSlot === "A" ? s.teamA : s.teamB)?.id === team.id;
              return (
                <li key={s.id}>
                  <div className="mb-1 flex items-center justify-between px-1 text-sm font-extrabold">
                    <span>{s.roundName}</span>
                    <span className={won ? "text-emerald-300" : "text-red-300"}>{won ? "Victoria" : "Derrota"}</span>
                  </div>
                  <SeriesCard series={s} href={`/torneos/${slug}/partidas/${s.number}`} highlightTeamId={team.id} compact />
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
