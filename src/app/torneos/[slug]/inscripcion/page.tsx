import { EmptyState } from "@/components/ui";
import { loadTournament } from "../data";
import { RegisterClient } from "./register-client";

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament } = await loadTournament(slug);

  if (tournament.status !== "registration_open") {
    return (
      <EmptyState title="Las inscripciones están cerradas">
        Revisa la sección de equipos o el bracket del torneo.
      </EmptyState>
    );
  }
  if (tournament.approvedTeams >= tournament.maxTeams) {
    return <EmptyState title="El torneo ya está completo" />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="font-display text-2xl">Inscribir mi equipo</h2>
      <p className="mb-4 text-sm text-muted">
        Completa los datos de tu equipo de {tournament.teamSize}. La organización revisará la inscripción y, cuando la
        apruebe, tu equipo aparecerá en la lista oficial.
      </p>
      <RegisterClient slug={slug} teamSize={tournament.teamSize} />
    </div>
  );
}
