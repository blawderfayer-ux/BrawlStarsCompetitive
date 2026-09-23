import { ActionForm, SubmitButton } from "@/components/action-form";
import { MapSelect } from "@/components/admin/series-control";
import { EmptyState, ModeMapChip } from "@/components/ui";
import { requireStaffPage } from "@/lib/auth";
import { roundName } from "@/lib/bracket";
import { updateRoundPlanAction } from "@/app/admin/actions";
import { loadAdminTournament } from "../data";

/** Plan oficial de modo/mapa por ronda: lo que verán ambos equipos en cada game. */
export default async function RoundMapsPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireStaffPage(["admin"]);
  const { slug } = await params;
  const { tournament, series, modes, maps } = await loadAdminTournament(slug);

  if (!tournament.bracketGeneratedAt) {
    return (
      <EmptyState title="Primero genera el bracket">
        Al generarlo se propone automáticamente un plan de mapas por ronda (sin repetir modo en una serie) usando el
        pool del torneo. Aquí podrás cambiarlo. El pool se edita en Configuración.
      </EmptyState>
    );
  }

  const poolMaps = maps.filter((m) => tournament.mapPool.includes(m.id) || !m.active);
  const modeById = new Map(modes.map((m) => [m.id, m]));
  const mapById = new Map(maps.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Define qué modo y mapa se juega en cada game de cada ronda. Al guardar, se actualizan todas las partidas de esa
        ronda que todavía no empezaron. Para cambiar el mapa de una sola partida usa “Horario, mapas y correcciones” en
        Partidas.
      </p>
      {Array.from({ length: tournament.totalRounds }, (_, i) => i + 1).map((round) => {
        const bestOf = series.find((s) => s.round === round)?.bestOf ?? tournament.defaultBestOf;
        const plan = tournament.roundPlans[round - 1] ?? [];
        const started = series.filter((s) => s.round === round && !s.isBye && s.games.some((g) => g.status !== "pending")).length;
        return (
          <section key={round} className="card space-y-3 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl">{roundName(round, tournament.totalRounds)}</h2>
              <span className="text-xs font-bold text-muted">BO{bestOf}</span>
            </div>
            <div className="space-y-1">
              {plan.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-center font-display text-muted">{i + 1}</span>
                  <ModeMapChip mode={g.modeId ? modeById.get(g.modeId) ?? null : null} map={g.mapId ? mapById.get(g.mapId) ?? null : null} size="sm" />
                </div>
              ))}
            </div>
            <details className="rounded-xl bg-bg-soft p-3">
              <summary className="cursor-pointer text-sm font-bold">Cambiar mapas de esta ronda</summary>
              <ActionForm action={updateRoundPlanAction} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={tournament.id} />
                <input type="hidden" name="round" value={round} />
                <input type="hidden" name="games" value={bestOf} />
                {Array.from({ length: bestOf }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-center font-display">{i + 1}</span>
                    <MapSelect
                      name={`game${i + 1}`}
                      modes={modes}
                      maps={poolMaps.length ? poolMaps : maps}
                      value={`${plan[i]?.modeId ?? ""}:${plan[i]?.mapId ?? ""}`}
                    />
                  </div>
                ))}
                {started ? (
                  <p className="text-xs text-amber-300">{started} partidas de esta ronda ya empezaron y no se modificarán.</p>
                ) : null}
                <SubmitButton className="btn-primary btn-sm">Guardar mapas de la ronda</SubmitButton>
              </ActionForm>
            </details>
          </section>
        );
      })}
    </div>
  );
}
