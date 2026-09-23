import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { RegistrationForm } from "@/components/registration-form";
import { Container, EmptyState, StatusBadge, TeamLogo } from "@/components/ui";
import { REGISTRATION_STATUS } from "@/lib/labels";
import { notFound } from "next/navigation";
import { findTeamByToken } from "@/lib/services/registrations";
import { ensureAccessCodes } from "@/lib/services/room";
import { updateRegistrationAction, withdrawRegistrationAction } from "../../torneos/actions";

export const metadata: Metadata = { title: "Mi inscripción", robots: { index: false } };

export default async function MyRegistrationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let found = await findTeamByToken(token);
  if (!found) {
    return (
      <Container className="py-8">
        <EmptyState title="Enlace inválido">
          Revisa que copiaste el enlace completo que recibiste al inscribirte.
        </EmptyState>
      </Container>
    );
  }
  if (found.team.registrationStatus === "approved" && !found.team.accessCode) {
    await ensureAccessCodes(String(found.team.tournament));
    found = await findTeamByToken(token);
    if (!found) notFound();
  }
  const { team, tournament } = found;
  const editable = team.registrationStatus === "pending" || team.registrationStatus === "needs_changes";
  const logoUrl = team.hasLogo ? `/api/logos/${team._id}?v=${new Date(team.updatedAt).getTime()}` : null;

  return (
    <Container className="max-w-xl space-y-5 py-6">
      <div>
        <p className="text-xs font-extrabold uppercase text-muted">Mi inscripción · {tournament.name}</p>
        <div className="mt-2 flex items-center gap-3">
          <TeamLogo team={{ name: team.name, color: team.color, logoUrl }} size={56} />
          <div className="min-w-0">
            <h1 className="font-display truncate text-2xl">{team.name}</h1>
            <StatusBadge map={REGISTRATION_STATUS} value={team.registrationStatus} />
          </div>
        </div>
      </div>

      {team.registrationStatus === "approved" ? (
        <div className="card p-4">
          <p className="font-extrabold">¡Tu equipo fue aprobado!</p>
          <p className="mt-1 text-sm text-muted">Ya aparece en la lista oficial del torneo.</p>
          {team.accessCode ? (
            <div className="mt-3 rounded-xl border-2 border-ink bg-bg-soft p-3">
              <p className="text-xs font-black uppercase text-muted">Código de tu equipo para la sala de partidas</p>
              <p className="font-mono text-2xl tracking-[0.3em]">{team.accessCode}</p>
              <p className="mt-1 text-xs text-muted">
                Úsalo en la página de tu partida para chatear con el rival y reportar resultados. No lo compartas.
              </p>
            </div>
          ) : null}
          <Link href={`/torneos/${tournament.slug}/equipos/${team.slug}`} className="btn btn-primary mt-3 w-full">
            Ver mi equipo en el torneo
          </Link>
        </div>
      ) : null}

      {team.adminNote && team.registrationStatus !== "approved" ? (
        <div className="card border-orange-400/50 p-4">
          <p className="text-xs font-extrabold uppercase text-orange-300">Mensaje de la organización</p>
          <p className="mt-1 whitespace-pre-line [overflow-wrap:anywhere] text-sm font-bold">{team.adminNote}</p>
        </div>
      ) : null}

      {team.registrationStatus === "rejected" ? (
        <p className="card p-4 text-sm">La inscripción fue rechazada. Si crees que es un error, contacta a la organización.</p>
      ) : null}

      {editable ? (
        <>
          <p className="text-sm text-muted">
            Puedes corregir los datos mientras la inscripción esté pendiente. Al guardar, vuelve a revisión.
          </p>
          <RegistrationForm
            action={updateRegistrationAction}
            hidden={{ token }}
            teamSize={tournament.teamSize ?? 3}
            submitLabel="Guardar cambios"
            defaults={{
              teamName: team.name,
              color: team.color,
              captainContact: team.captainContact,
              members: team.members.map((m) => ({ name: m.name, tag: m.tag, role: m.role, ficct: m.ficct ?? null })),
              logoUrl,
            }}
          />
          <ActionForm action={withdrawRegistrationAction} confirm="¿Seguro que quieres retirar la inscripción?">
            <input type="hidden" name="token" value={token} />
            <SubmitButton className="btn-ghost w-full" pendingText="Retirando…">
              Retirar inscripción
            </SubmitButton>
          </ActionForm>
        </>
      ) : null}

      <Link href={`/torneos/${tournament.slug}`} className="btn btn-ghost w-full">
        Ir al torneo
      </Link>
    </Container>
  );
}
