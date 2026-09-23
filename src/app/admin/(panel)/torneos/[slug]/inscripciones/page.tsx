import { ActionForm, SubmitButton } from "@/components/action-form";
import { Collapsible } from "@/components/admin/collapsible";
import { CopyButton } from "@/components/copy-button";
import { RegistrationForm } from "@/components/registration-form";
import { EmptyState, StatusBadge, TeamLogo } from "@/components/ui";
import { requireStaffPage } from "@/lib/auth";
import { COMPETITION_STATUS, MEMBER_ROLE_LABEL, REGISTRATION_STATUS } from "@/lib/labels";
import { getTeamsForAdmin } from "@/lib/queries";
import { ensureAccessCodes } from "@/lib/services/room";
import { ENTRY_FEE_BS, feeStatus } from "@/lib/entry-fee";
import { timeAgo } from "@/lib/utils";
import type { TeamAdminView } from "@/lib/views";
import {
  adminUpdateTeamAction,
  importTeamsAction,
  regenerateCodeAction,
  setTeamCheckAction,
  disqualifyTeamAction,
  reviewRegistrationAction,
  setTeamSeedAction,
} from "@/app/admin/actions";
import { loadAdminTournament } from "../data";

const GROUPS = [
  { status: "pending", title: "Pendientes de revisión" },
  { status: "needs_changes", title: "Esperando corrección del capitán" },
  { status: "approved", title: "Aprobados" },
  { status: "rejected", title: "Rechazados" },
  { status: "withdrawn", title: "Retirados" },
];

function EntryControl({ team }: { team: TeamAdminView }) {
  const fee = feeStatus(team.members);
  const toggle = (field: "paid" | "idsChecked", current: boolean, label: string) => (
    <ActionForm action={setTeamCheckAction} showSuccess={false}>
      <input type="hidden" name="teamId" value={team.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(!current)} />
      <SubmitButton className={current ? "btn-ok btn-sm" : "btn-ghost btn-sm"} pendingText="…">
        {current ? `✓ ${label}` : label}
      </SubmitButton>
    </ActionForm>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink bg-bg-soft p-2">
      <span
        className={`rounded-lg border-2 border-ink px-2 py-0.5 text-xs font-black uppercase ${
          fee === "free" ? "bg-ok text-ink" : fee === "pays" ? (team.paid ? "bg-ok text-ink" : "bg-red text-white") : "bg-amber-400 text-ink"
        }`}
      >
        {fee === "free" ? "FICCT · no paga" : fee === "pays" ? (team.paid ? `Pagó ${ENTRY_FEE_BS} Bs` : `Debe ${ENTRY_FEE_BS} Bs`) : "¿FICCT? sin dato"}
      </span>
      {fee !== "free" ? toggle("paid", team.paid, "Pagó") : null}
      {toggle("idsChecked", team.idsChecked, "Carnets OK")}
    </div>
  );
}

function ReviewButtons({ team, locked }: { team: TeamAdminView; locked: boolean }) {
  const options = [
    { action: "approve", label: "Aprobar", className: "btn-ok", show: team.registrationStatus !== "approved" && !locked },
    { action: "needs_changes", label: "Pedir corrección", className: "btn-secondary", show: team.registrationStatus !== "needs_changes" && !(locked && team.registrationStatus === "approved") },
    { action: "reject", label: "Rechazar", className: "btn-danger", show: team.registrationStatus !== "rejected" && !(locked && team.registrationStatus === "approved") },
    { action: "pending", label: "Volver a pendiente", className: "btn-ghost", show: ["approved", "rejected"].includes(team.registrationStatus) && !locked },
  ].filter((o) => o.show);
  if (options.length === 0) return null;
  return (
    <ActionForm action={reviewRegistrationAction} className="space-y-2">
      <input type="hidden" name="teamId" value={team.id} />
      <input
        name="note"
        className="input"
        placeholder="Mensaje para el capitán (se ve en su enlace)"
        defaultValue={team.adminNote}
        maxLength={500}
      />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <SubmitButton key={o.action} name="action" value={o.action} className={`${o.className} btn-sm`} pendingText="…">
            {o.label}
          </SubmitButton>
        ))}
      </div>
    </ActionForm>
  );
}

export default async function RegistrationsPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireStaffPage(["admin"]);
  const { slug } = await params;
  const { tournament } = await loadAdminTournament(slug);
  await ensureAccessCodes(tournament.id);
  const teams = await getTeamsForAdmin(tournament.id);
  const approvedTeams = teams.filter((t) => t.registrationStatus === "approved");
  const roomUrl = `{origin}/torneos/${slug}/partidas`;
  const codeMessage = (t: { name: string; accessCode: string }) =>
    `Hola ${t.name}! Este es el código de su equipo para la sala de partidas del ${tournament.name}: ${t.accessCode}\n` +
    `Entren a su partida en ${roomUrl}, toquen su equipo y pongan el código. Ahí chatean con el rival, pasan el link del equipo y reportan el resultado. No lo compartan.`;
  const allCodes = approvedTeams.map((t) => `${t.name}: ${t.accessCode}`).join("\n");
  const owing = approvedTeams.filter((t) => feeStatus(t.members) === "pays" && !t.paid);
  const unknownFee = approvedTeams.filter((t) => feeStatus(t.members) === "unknown");
  const unchecked = approvedTeams.filter((t) => !t.idsChecked);
  const locked = !!tournament.bracketGeneratedAt;
  const approvedCount = teams.filter((t) => t.registrationStatus === "approved").length;

  const importCard = locked ? null : (
    <Collapsible
      className="card p-4"
      defaultOpen={teams.length === 0}
      summary={<summary className="cursor-pointer font-extrabold">Importar equipos desde una lista</summary>}
    >
      <p className="mt-2 text-sm text-muted">
        Pega la lista tal como la tienes (por ejemplo, del grupo de WhatsApp): una línea con el nombre del equipo y
        debajo sus jugadores empezando con “-” o “•”. El tag es opcional (“-Juan #2PP0Y8Q”).
      </p>
      <ActionForm action={importTeamsAction} className="mt-3 space-y-3" resetOnSuccess>
        <input type="hidden" name="id" value={tournament.id} />
        <textarea
          name="list"
          required
          className="input min-h-[220px] font-mono text-sm"
          placeholder={"1.- Team Alpha\n-Jugador 1\n-Jugador 2\n-Jugador 3\n2.- Dragons\n-…"}
        />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="approve" defaultChecked className="h-5 w-5" /> Aprobarlos directamente
        </label>
        <SubmitButton className="btn-secondary w-full" pendingText="Importando…">
          Importar equipos
        </SubmitButton>
      </ActionForm>
    </Collapsible>
  );

  return (
    <div className="space-y-8">
      {importCard}
      {approvedTeams.length ? (
        <section className="card p-4">
          <p className="title-ink text-lg">Control de entrada ({ENTRY_FEE_BS} Bs si menos de 2 titulares son FICCT)</p>
          <ul className="mt-2 space-y-1 text-sm font-bold">
            <li className={owing.length ? "text-red-300" : "text-emerald-300"}>
              {owing.length ? `Deben pagar y no pagaron: ${owing.map((t) => t.name).join(", ")}` : "Nadie debe la entrada."}
            </li>
            {unknownFee.length ? (
              <li className="text-amber-300">
                Falta saber si son FICCT: {unknownFee.map((t) => t.name).join(", ")} (edita el equipo y marca a cada jugador)
              </li>
            ) : null}
            <li className="text-muted">
              Carnets sin verificar: {unchecked.length ? unchecked.map((t) => t.name).join(", ") : "ninguno"}
            </li>
          </ul>
        </section>
      ) : null}
      {approvedTeams.length ? (
        <Collapsible
          className="card p-4"
          summary={<summary className="cursor-pointer font-extrabold">Códigos de acceso a la sala de partidas ({approvedTeams.length})</summary>}
        >
          <p className="mt-2 text-sm text-muted">
            Cada capitán entra a la página de su partida con este código para chatear con el rival y reportar resultados.
            Envíaselo por privado (botón “Mensaje”).
          </p>
          <ul className="mt-3 divide-y-2 divide-ink/50">
            {approvedTeams.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate font-extrabold">{t.name}</span>
                <span className="flex items-center gap-2">
                  <span className="rounded-lg border-2 border-ink bg-bg-soft px-2 py-1 font-mono text-lg tracking-widest">{t.accessCode}</span>
                  <CopyButton text={codeMessage(t)} label="Mensaje" />
                  <ActionForm action={regenerateCodeAction} confirm={`¿Generar un código nuevo para ${t.name}? El anterior deja de funcionar.`} showSuccess={false}>
                    <input type="hidden" name="teamId" value={t.id} />
                    <SubmitButton className="btn-ghost btn-sm" pendingText="…">Nuevo</SubmitButton>
                  </ActionForm>
                </span>
              </li>
            ))}
          </ul>
          <CopyButton text={allCodes} label="Copiar todos los códigos" className="mt-3 w-full" />
        </Collapsible>
      ) : null}
      {teams.length === 0 ? (
        <EmptyState title="Todavía no hay inscripciones">
          {tournament.status === "registration_open"
            ? `Comparte el enlace: /torneos/${slug}/inscripcion`
            : "Abre las inscripciones desde el Resumen."}
        </EmptyState>
      ) : null}
      <p className="text-sm font-bold text-muted">
        {approvedCount}/{tournament.maxTeams} equipos aprobados
        {locked ? " · Bracket generado: ya no se aprueban más equipos." : ""}
      </p>
      {GROUPS.map((g) => {
        const list = teams.filter((t) => t.registrationStatus === g.status);
        if (list.length === 0) return null;
        return (
          <section key={g.status}>
            <h2 className="font-display mb-3 text-lg">
              {g.title} ({list.length})
            </h2>
            <div className="space-y-3">
              {list.map((team) => (
                <article key={team.id} className="card space-y-3 p-4" style={{ borderLeft: `5px solid ${team.color}` }}>
                  <header className="flex items-start gap-3">
                    <TeamLogo team={team} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-extrabold">{team.name}</p>
                      <p className="text-xs text-muted">
                        Inscrito {timeAgo(team.createdAt)}{team.captainContact ? ` · Contacto: ${team.captainContact}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <StatusBadge map={REGISTRATION_STATUS} value={team.registrationStatus} />
                        {team.registrationStatus === "approved" && locked ? (
                          <StatusBadge map={COMPETITION_STATUS} value={team.competitionStatus} />
                        ) : null}
                      </div>
                    </div>
                  </header>

                  <ul className="grid gap-1 rounded-xl bg-bg-soft p-3 text-sm sm:grid-cols-2">
                    {team.members.map((m, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="truncate font-bold">
                          {m.name} <span className="text-xs text-muted">({MEMBER_ROLE_LABEL[m.role]}{m.ficct === true ? " · FICCT" : m.ficct === false ? " · otra fac." : ""})</span>
                        </span>
                        <span className="font-mono text-xs text-muted">{m.tag || "sin tag"}</span>
                      </li>
                    ))}
                  </ul>

                  {team.registrationStatus === "approved" ? <EntryControl team={team} /> : null}

                  <ReviewButtons team={team} locked={locked} />

                  {team.registrationStatus === "approved" && !locked ? (
                    <ActionForm action={setTeamSeedAction} className="flex items-end gap-2" showSuccess={false}>
                      <input type="hidden" name="teamId" value={team.id} />
                      <div className="w-28">
                        <label className="label" htmlFor={`seed-${team.id}`}>
                          Seed
                        </label>
                        <input id={`seed-${team.id}`} name="seed" type="number" min={1} className="input" defaultValue={team.seed ?? ""} />
                      </div>
                      <SubmitButton className="btn-ghost btn-sm">Guardar seed</SubmitButton>
                    </ActionForm>
                  ) : null}

                  {team.registrationStatus === "approved" && locked && !["eliminated", "disqualified", "champion"].includes(team.competitionStatus) ? (
                    <ActionForm
                      action={disqualifyTeamAction}
                      confirm={`¿Descalificar a ${team.name}? Su rival actual gana por walkover.`}
                    >
                      <input type="hidden" name="teamId" value={team.id} />
                      <SubmitButton className="btn-danger btn-sm">Descalificar</SubmitButton>
                    </ActionForm>
                  ) : null}

                  <details className="rounded-xl bg-bg-soft p-3">
                    <summary className="cursor-pointer text-sm font-bold">Editar datos del equipo</summary>
                    <div className="mt-3">
                      <RegistrationForm
                        action={adminUpdateTeamAction}
                        hidden={{ teamId: team.id }}
                        admin
                        teamSize={tournament.teamSize}
                        submitLabel="Guardar equipo"
                        defaults={{
                          teamName: team.name,
                          color: team.color,
                          captainContact: team.captainContact,
                          members: team.members,
                          logoUrl: team.logoUrl,
                        }}
                      />
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
