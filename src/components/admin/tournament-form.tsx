import { ActionForm, SubmitButton } from "@/components/action-form";
import type { ActionResult } from "@/lib/action-result";
import { toLocalInputValue } from "@/lib/utils";
import type { TournamentView } from "@/lib/views";

const DEFAULT_RULES = `1. Los equipos son de 3 jugadores titulares y 1 suplente opcional.
2. Cada partida se juega en sala amistosa. El equipo de la izquierda del bracket crea la sala.
3. Se juega el modo y mapa que indica la página para cada game, en ese orden.
4. Solo la organización o un árbitro registra resultados. Guarda captura del resultado de cada game.
5. Si un equipo no se presenta 10 minutos después de su horario, pierde por walkover.
6. Desconexión: si ocurre en los primeros 30 segundos, se repite el game.
7. Cualquier reclamo se hace al árbitro antes de empezar el siguiente game.`;

export function TournamentForm({
  action,
  tournament,
  submitLabel,
}: {
  action: (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;
  tournament?: TournamentView;
  submitLabel: string;
}) {
  const locked = !!tournament?.bracketGeneratedAt;
  return (
    <ActionForm action={action} className="space-y-4">
      {tournament ? (
        <>
          <input type="hidden" name="id" value={tournament.id} />
          <input type="hidden" name="originalSlug" value={tournament.slug} />
        </>
      ) : null}
      <div className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="name">
            Nombre del torneo
          </label>
          <input id="name" name="name" required minLength={3} maxLength={80} className="input" defaultValue={tournament?.name} placeholder="Copa FICCT 2026" />
        </div>
        <div>
          <label className="label" htmlFor="slug">
            Dirección web (opcional)
          </label>
          <input id="slug" name="slug" className="input font-mono" defaultValue={tournament?.slug} placeholder="copa-ficct-2026" />
          <p className="mt-1 text-xs text-muted">/torneos/&lt;dirección&gt;. Si lo dejas vacío se genera del nombre.</p>
        </div>
        <div>
          <label className="label" htmlFor="description">
            Descripción
          </label>
          <textarea id="description" name="description" className="input" maxLength={2000} defaultValue={tournament?.description} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="startsAt">
              Fecha y hora de inicio
            </label>
            <input id="startsAt" name="startsAt" type="datetime-local" className="input" defaultValue={toLocalInputValue(tournament?.startsAt)} />
          </div>
          <div>
            <label className="label" htmlFor="maxTeams">
              Máximo de equipos
            </label>
            <input id="maxTeams" name="maxTeams" type="number" min={2} max={128} className="input" defaultValue={tournament?.maxTeams ?? 16} />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <p className="font-extrabold">Formato</p>
        <p className="text-sm text-muted">
          Eliminación simple. Si los equipos no son potencia de 2 (4, 8, 16, 32…), los mejores seeds pasan por BYE.
          Doble eliminación y round robin quedan para una próxima versión.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="defaultBestOf">
              Formato de serie
            </label>
            <select id="defaultBestOf" name="defaultBestOf" className="input" defaultValue={tournament?.defaultBestOf ?? 3} disabled={locked}>
              <option value={1}>BO1 · al mejor de 1</option>
              <option value={3}>BO3 · primero en ganar 2</option>
              <option value={5}>BO5 · primero en ganar 3</option>
              <option value={7}>BO7 · primero en ganar 4</option>
            </select>
            {locked ? <input type="hidden" name="defaultBestOf" value={tournament?.defaultBestOf} /> : null}
          </div>
          <div>
            <label className="label" htmlFor="bestOfByRound">
              BO por ronda (opcional)
            </label>
            <input
              id="bestOfByRound"
              name="bestOfByRound"
              className="input font-mono"
              placeholder="3, 3, 3, 5"
              defaultValue={tournament?.bestOfByRound.join(", ")}
              disabled={locked}
            />
            <p className="mt-1 text-xs text-muted">Ej: “3, 3, 5” → rondas 1 y 2 BO3, la final BO5.</p>
          </div>
          <div>
            <label className="label" htmlFor="roundDurationMinutes">
              Duración estimada por serie (min)
            </label>
            <input
              id="roundDurationMinutes"
              name="roundDurationMinutes"
              type="number"
              min={5}
              className="input"
              defaultValue={tournament?.roundDurationMinutes ?? 30}
            />
          </div>
        </div>
        {locked ? <p className="text-xs text-amber-300">El bracket ya está generado: el formato de series está bloqueado.</p> : null}
      </div>

      <div className="card p-4">
        <label className="label" htmlFor="rules">
          Reglamento
        </label>
        <textarea id="rules" name="rules" className="input min-h-[220px]" defaultValue={tournament?.rules ?? DEFAULT_RULES} />
      </div>

      <SubmitButton className="btn-primary w-full">{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
