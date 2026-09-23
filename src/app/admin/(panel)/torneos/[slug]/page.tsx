import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { roundName } from "@/lib/bracket";
import { requireStaffPage } from "@/lib/auth";
import { getTeamsForAdmin } from "@/lib/queries";
import {
  generateBracketAction,
  resetBracketAction,
  setTournamentStatusAction,
  deleteTournamentAction,
} from "@/app/admin/actions";
import { loadAdminTournament } from "./data";

const NEXT_STATUS: Record<string, { status: string; label: string; className: string }[]> = {
  draft: [{ status: "registration_open", label: "📝 Abrir inscripciones (publicar)", className: "btn-primary" }],
  registration_open: [
    { status: "registration_closed", label: "🔒 Cerrar inscripciones", className: "btn-secondary" },
    { status: "draft", label: "Volver a borrador (ocultar)", className: "btn-ghost" },
  ],
  registration_closed: [{ status: "registration_open", label: "Reabrir inscripciones", className: "btn-ghost" }],
  cancelled: [{ status: "draft", label: "Recuperar como borrador", className: "btn-ghost" }],
};

export default async function AdminTournamentSummary({ params }: { params: Promise<{ slug: string }> }) {
  await requireStaffPage(["admin"]);
  const { slug } = await params;
  const { tournament, series } = await loadAdminTournament(slug);
  const teams = await getTeamsForAdmin(tournament.id);

  const approved = teams.filter((t) => t.registrationStatus === "approved");
  const pending = teams.filter((t) => t.registrationStatus === "pending").length;
  const active = approved.filter((t) => t.competitionStatus === "active").length;
  const eliminated = approved.filter((t) => ["eliminated", "disqualified"].includes(t.competitionStatus)).length;
  const openSeries = series.find((s) => !s.winnerSlot && !s.isBye);
  const currentRound = tournament.bracketGeneratedAt
    ? openSeries
      ? roundName(openSeries.round, tournament.totalRounds)
      : "Finalizado"
    : "—";

  let size = 1;
  while (size < approved.length) size *= 2;
  const byes = approved.length >= 2 ? size - approved.length : 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Equipos", value: approved.length },
          { label: "Por revisar", value: pending },
          { label: "Activos", value: active },
          { label: "Eliminados", value: eliminated },
          { label: "Ronda", value: currentRound },
        ].map((x) => (
          <div key={x.label} className="card p-3">
            <div className="text-[11px] font-extrabold uppercase text-muted">{x.label}</div>
            <div className="font-display text-2xl leading-tight">{x.value}</div>
          </div>
        ))}
      </section>

      {pending ? (
        <Link href={`/admin/torneos/${slug}/inscripciones`} className="card block border-amber-400/50 p-4 font-extrabold">
          ⏳ Hay {pending} inscripciones pendientes de revisión →
        </Link>
      ) : null}

      {NEXT_STATUS[tournament.status] ? (
        <section className="card space-y-3 p-4">
          <p className="font-extrabold">Estado del torneo</p>
          <div className="flex flex-wrap gap-2">
            {NEXT_STATUS[tournament.status].map((opt) => (
              <ActionForm key={opt.status} action={setTournamentStatusAction}>
                <input type="hidden" name="id" value={tournament.id} />
                <input type="hidden" name="status" value={opt.status} />
                <SubmitButton className={`${opt.className} btn-sm`}>{opt.label}</SubmitButton>
              </ActionForm>
            ))}
          </div>
        </section>
      ) : null}

      {!tournament.bracketGeneratedAt && ["registration_open", "registration_closed"].includes(tournament.status) ? (
        <section className="card space-y-3 border-brand/50 p-4">
          <p className="font-display text-xl">🏁 Generar bracket</p>
          <p className="text-sm text-muted">
            {approved.length} equipos aprobados → cuadro de {approved.length >= 2 ? size : "—"}
            {byes ? ` con ${byes} BYE (los mejores seeds avanzan directo a la ronda 2)` : ""}. Se crean todas las
            partidas y se asignan modos y mapas del pool (luego puedes cambiarlos en “Mapas”). El torneo pasa a EN CURSO.
          </p>
          <ActionForm action={generateBracketAction} confirm="¿Generar el bracket? Ya no se podrán aprobar más equipos.">
            <input type="hidden" name="id" value={tournament.id} />
            <label className="label" htmlFor="seeding">
              Siembra
            </label>
            <select id="seeding" name="seeding" className="input mb-3" defaultValue="random">
              <option value="random">Sorteo aleatorio</option>
              <option value="registration">Orden de inscripción (el primero es seed 1)</option>
              <option value="manual">Manual (seeds asignados en Inscripciones)</option>
            </select>
            <SubmitButton className="btn-primary w-full" pendingText="Generando…">
              Generar bracket
            </SubmitButton>
          </ActionForm>
        </section>
      ) : null}

      {tournament.bracketGeneratedAt ? (
        <section className="card space-y-3 p-4">
          <p className="font-extrabold">Bracket</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/torneos/${slug}/partidas`} className="btn btn-primary btn-sm">
              Controlar partidas
            </Link>
            <Link href={`/torneos/${slug}/bracket`} className="btn btn-ghost btn-sm" target="_blank">
              Ver bracket público ↗
            </Link>
          </div>
          <details className="rounded-xl bg-bg-soft p-3">
            <summary className="cursor-pointer text-sm font-bold text-red-300">Reiniciar bracket (zona de peligro)</summary>
            <p className="my-2 text-sm text-muted">
              Borra todas las partidas y resultados. Los equipos aprobados se mantienen. Escribe REINICIAR para confirmar.
            </p>
            <ActionForm action={resetBracketAction} className="space-y-2">
              <input type="hidden" name="id" value={tournament.id} />
              <input name="confirm" className="input" placeholder="REINICIAR" autoComplete="off" />
              <SubmitButton className="btn-danger btn-sm">Reiniciar bracket</SubmitButton>
            </ActionForm>
          </details>
        </section>
      ) : null}

      {tournament.status !== "live" && tournament.status !== "finished" ? (
        <section className="card space-y-2 p-4">
          <p className="font-extrabold">Otras acciones</p>
          <div className="flex flex-wrap gap-2">
            {tournament.status !== "cancelled" ? (
              <ActionForm action={setTournamentStatusAction} confirm="¿Cancelar el torneo?">
                <input type="hidden" name="id" value={tournament.id} />
                <input type="hidden" name="status" value="cancelled" />
                <SubmitButton className="btn-ghost btn-sm">Cancelar torneo</SubmitButton>
              </ActionForm>
            ) : null}
            {tournament.status === "draft" || tournament.status === "cancelled" ? (
              <ActionForm action={deleteTournamentAction} confirm="¿Eliminar el torneo y todas sus inscripciones? No se puede deshacer.">
                <input type="hidden" name="id" value={tournament.id} />
                <SubmitButton className="btn-danger btn-sm">Eliminar torneo</SubmitButton>
              </ActionForm>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
