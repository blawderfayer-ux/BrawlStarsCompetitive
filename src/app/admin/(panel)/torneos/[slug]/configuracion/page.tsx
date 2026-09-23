import { ActionForm, SubmitButton } from "@/components/action-form";
import { TournamentForm } from "@/components/admin/tournament-form";
import { requireStaffPage } from "@/lib/auth";
import { setMapPoolAction, updateTournamentAction } from "@/app/admin/actions";
import { loadAdminTournament } from "../data";

export default async function TournamentConfigPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireStaffPage(["admin"]);
  const { slug } = await params;
  const { tournament, modes, maps } = await loadAdminTournament(slug);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="font-display mb-3 text-xl">Datos del torneo</h2>
        <TournamentForm action={updateTournamentAction} tournament={tournament} submitLabel="Guardar configuración" />
      </div>
      <div>
        <h2 className="font-display mb-1 text-xl">Pool de mapas</h2>
        <p className="mb-3 text-sm text-muted">
          Mapas disponibles para este torneo. El plan automático de cada ronda sale de aquí.
        </p>
        <ActionForm action={setMapPoolAction} className="space-y-3">
          <input type="hidden" name="id" value={tournament.id} />
          {modes.map((mode) => {
            const list = maps.filter((m) => m.modeId === mode.id && (m.active || tournament.mapPool.includes(m.id)));
            if (list.length === 0) return null;
            return (
              <fieldset key={mode.id} className="card p-3">
                <legend className="px-1 text-sm font-extrabold" style={{ color: mode.color }}>
                  {mode.icon} {mode.name}
                </legend>
                {list.map((m) => (
                  <label key={m.id} className="flex min-h-[40px] items-center gap-3 text-sm font-bold">
                    <input
                      type="checkbox"
                      name="maps"
                      value={m.id}
                      defaultChecked={tournament.mapPool.includes(m.id)}
                      className="h-5 w-5 accent-[var(--brand)]"
                    />
                    {m.name}
                  </label>
                ))}
              </fieldset>
            );
          })}
          <SubmitButton className="btn-secondary w-full">Guardar pool</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
