import type { Metadata } from "next";
import Link from "next/link";
import { MyTeamPanel } from "@/components/my-team";
import { TeamCodeLogin } from "@/components/team-code-login";
import { getTeamSession } from "@/lib/team-session";
import { teamLoginAction } from "../../actions";
import { loadTournament } from "../data";

export const metadata: Metadata = { title: "Mi equipo" };

/** La página de cada jugador: entra con su código y ve su partida, su rival y la sala. */
export default async function MyTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament, teams, series } = await loadTournament(slug);
  const session = await getTeamSession();
  const team = session?.tournamentId === tournament.id ? teams.find((t) => t.id === session.teamId) : undefined;

  if (team) {
    return (
      <div className="mx-auto max-w-xl">
        <MyTeamPanel slug={slug} tournament={tournament} team={team} series={series} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <TeamCodeLogin
        action={teamLoginAction}
        slug={slug}
        tournamentId={tournament.id}
        intro={<p>Escribe el código de 6 letras de tu equipo. Con eso verás tu partida, tu rival y la sala para reportar.</p>}
      />
      {tournament.status === "registration_open" ? (
        <p className="text-center text-sm text-muted">
          ¿Todavía no tienes equipo?{" "}
          <Link href={`/torneos/${slug}/inscripcion`} className="font-bold text-text underline">
            Inscríbelo aquí
          </Link>
        </p>
      ) : null}
      <Link href="/como-jugar" className="block text-center text-sm font-bold text-muted underline">
        ¿Primera vez? Mira cómo funciona
      </Link>
    </div>
  );
}
