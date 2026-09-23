import { ActionForm, SubmitButton } from "@/components/action-form";
import { currentGameOf } from "@/components/series-card";
import { ModeMapChip, StatusBadge, TeamLogo } from "@/components/ui";
import { SERIES_STATUS } from "@/lib/labels";
import { cn, formatDateTime, toLocalInputValue } from "@/lib/utils";
import type { MapView, ModeView, SeriesView } from "@/lib/views";
import {
  walkoverAction,
  reportGameAction,
  resetSeriesAction,
  scheduleSeriesAction,
  setSeriesGameMapAction,
  setSeriesStatusAction,
  undoGameAction,
} from "@/app/admin/actions";

export function MapSelect({
  name,
  modes,
  maps,
  value,
}: {
  name: string;
  modes: ModeView[];
  maps: MapView[];
  value: string;
}) {
  return (
    <select name={name} className="input" defaultValue={value}>
      <option value=":">— Sin definir —</option>
      {modes.map((mode) => (
        <optgroup key={mode.id} label={`${mode.icon} ${mode.name}`}>
          {maps
            .filter((m) => m.modeId === mode.id)
            .map((m) => (
              <option key={m.id} value={`${mode.id}:${m.id}`}>
                {mode.name} · {m.name}
                {m.active ? "" : " (inactivo)"}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

/** Tarjeta de control de una serie: registrar games, estado, horario y correcciones. */
export function SeriesControl({
  series: s,
  modes,
  maps,
  isAdmin,
}: {
  series: SeriesView;
  modes: ModeView[];
  maps: MapView[];
  isAdmin: boolean;
}) {
  const game = currentGameOf(s);
  const ready = !!(s.teamA && s.teamB);
  const finishedGames = s.games.filter((g) => g.status === "finished").length;
  const hidden = <input type="hidden" name="seriesId" value={s.id} />;

  return (
    <article className={cn("card space-y-4 p-4", s.status === "live" && "ring-2 ring-live/60")}>
      <header className="flex items-center justify-between gap-2 text-xs font-extrabold uppercase text-muted">
        <span>
          Partida #{s.number} · {s.roundName} · BO{s.bestOf}
        </span>
        <StatusBadge map={SERIES_STATUS} value={s.status} />
      </header>

      <div className="space-y-2">
        {(["A", "B"] as const).map((slot) => {
          const team = slot === "A" ? s.teamA : s.teamB;
          const score = slot === "A" ? s.scoreA : s.scoreB;
          const won = s.winnerSlot === slot;
          return (
            <div key={slot} className={cn("flex items-center gap-3", s.winnerSlot && !won && "opacity-50")}>
              <TeamLogo team={team} size={36} />
              <span className={cn("flex-1 truncate text-lg font-extrabold", won && "text-brand")}>
                {team?.name ?? "Por definir"} {won ? "👑" : ""}
              </span>
              <span className="font-display text-3xl">{score}</span>
            </div>
          );
        })}
      </div>

      {s.scheduledAt ? <p className="text-sm font-bold">🕒 {formatDateTime(s.scheduledAt)}</p> : null}

      {/* Registrar resultado del game actual */}
      {ready && game && s.status !== "cancelled" ? (
        <section className="rounded-2xl border border-brand/40 bg-brand/5 p-3">
          <p className="mb-2 text-xs font-extrabold uppercase text-muted">Game {game.number} · ¿Quién ganó?</p>
          <div className="mb-3">
            <ModeMapChip mode={game.mode} map={game.map} size="md" />
          </div>
          <ActionForm action={reportGameAction} className="grid grid-cols-2 gap-2">
            {hidden}
            <input type="hidden" name="game" value={game.number} />
            <SubmitButton name="slot" value="A" className="btn-ok !normal-case" pendingText="…">
              <span className="truncate">{s.teamA?.name} ganó</span>
            </SubmitButton>
            <SubmitButton name="slot" value="B" className="btn-ok !normal-case" pendingText="…">
              <span className="truncate">{s.teamB?.name} ganó</span>
            </SubmitButton>
          </ActionForm>
        </section>
      ) : null}

      {/* Estado manual */}
      {ready && !s.winnerSlot ? (
        <ActionForm action={setSeriesStatusAction} className="flex flex-wrap gap-2" showSuccess={false}>
          {hidden}
          {s.status !== "live" ? (
            <SubmitButton name="status" value="live" className="btn-danger btn-sm">
              🔴 Iniciar
            </SubmitButton>
          ) : null}
          {s.status !== "awaiting_result" ? (
            <SubmitButton name="status" value="awaiting_result" className="btn-ghost btn-sm">
              Resultado pendiente
            </SubmitButton>
          ) : null}
          {s.status !== "disputed" ? (
            <SubmitButton name="status" value="disputed" className="btn-ghost btn-sm">
              ⚠️ Disputada
            </SubmitButton>
          ) : null}
          {s.status !== "pending" ? (
            <SubmitButton name="status" value="pending" className="btn-ghost btn-sm">
              Pendiente
            </SubmitButton>
          ) : null}
        </ActionForm>
      ) : null}

      <details className="rounded-xl bg-bg-soft p-3">
        <summary className="cursor-pointer text-sm font-bold">Horario, mapas y correcciones</summary>
        <div className="mt-3 space-y-5">
          <ActionForm action={scheduleSeriesAction} className="space-y-2">
            {hidden}
            <label className="label" htmlFor={`when-${s.id}`}>
              Horario (reprogramar)
            </label>
            <input id={`when-${s.id}`} name="scheduledAt" type="datetime-local" className="input" defaultValue={toLocalInputValue(s.scheduledAt)} />
            <input name="notes" className="input" placeholder="Nota pública (ej: sala creada por Team A)" defaultValue={s.notes} maxLength={500} />
            <SubmitButton className="btn-ghost btn-sm">Guardar horario</SubmitButton>
          </ActionForm>

          {isAdmin ? (
            <div className="space-y-2">
              <p className="label">Mapas de esta serie</p>
              {s.games.map((g) =>
                g.status === "pending" ? (
                  <ActionForm key={g.number} action={setSeriesGameMapAction} className="flex items-center gap-2" showSuccess={false}>
                    {hidden}
                    <input type="hidden" name="game" value={g.number} />
                    <span className="w-8 shrink-0 text-center font-display">{g.number}</span>
                    <MapSelect name="value" modes={modes} maps={maps} value={`${g.mode?.id ?? ""}:${g.map?.id ?? ""}`} />
                    <SubmitButton className="btn-ghost btn-sm shrink-0">OK</SubmitButton>
                  </ActionForm>
                ) : (
                  <div key={g.number} className="flex items-center gap-2 text-sm opacity-60">
                    <span className="w-8 text-center font-display">{g.number}</span>
                    <ModeMapChip mode={g.mode} map={g.map} size="sm" />
                  </div>
                ),
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {finishedGames > 0 && !s.walkover ? (
              <ActionForm action={undoGameAction} confirm="¿Deshacer el último game registrado?">
                {hidden}
                <SubmitButton className="btn-ghost btn-sm">↩️ Deshacer último game</SubmitButton>
              </ActionForm>
            ) : null}
            {isAdmin && ready && !s.winnerSlot ? (
              <ActionForm action={walkoverAction} className="flex flex-wrap gap-2" confirm="¿Declarar ganador por walkover?">
                {hidden}
                <SubmitButton name="slot" value="A" className="btn-ghost btn-sm !normal-case">
                  W.O. para {s.teamA?.name}
                </SubmitButton>
                <SubmitButton name="slot" value="B" className="btn-ghost btn-sm !normal-case">
                  W.O. para {s.teamB?.name}
                </SubmitButton>
              </ActionForm>
            ) : null}
            {isAdmin && (finishedGames > 0 || s.walkover) ? (
              <ActionForm action={resetSeriesAction} confirm="¿Reiniciar la serie? Se borran todos sus games (repetir partida).">
                {hidden}
                <SubmitButton className="btn-danger btn-sm">Reiniciar serie</SubmitButton>
              </ActionForm>
            ) : null}
            {isAdmin && ready && !s.winnerSlot && s.status !== "cancelled" ? (
              <ActionForm action={setSeriesStatusAction} confirm="¿Anular/cancelar esta partida?">
                {hidden}
                <input type="hidden" name="status" value="cancelled" />
                <SubmitButton className="btn-ghost btn-sm">Anular partida</SubmitButton>
              </ActionForm>
            ) : null}
          </div>
          <p className="text-xs text-muted">
            Las correcciones solo se permiten mientras la siguiente partida del ganador no haya empezado.
          </p>
        </div>
      </details>
    </article>
  );
}
