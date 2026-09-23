import { EmptyState, ModeMapChip, SectionTitle } from "@/components/ui";
import { loadTournament } from "../data";

export default async function RulesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament, modes, maps } = await loadTournament(slug);
  const pool = maps.filter((m) => tournament.mapPool.includes(m.id));
  const poolModes = modes.filter((mode) => pool.some((m) => m.modeId === mode.id));
  const bo = tournament.bestOfByRound.length
    ? tournament.bestOfByRound.map((n) => `BO${n}`).join(" → ")
    : `BO${tournament.defaultBestOf}`;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Formato", value: "Eliminación simple" },
          { label: "Series", value: bo },
          { label: "Equipos", value: `${tournament.approvedTeams}/${tournament.maxTeams}` },
          { label: "Jugadores", value: `${tournament.teamSize} + suplente` },
        ].map((x) => (
          <div key={x.label} className="card p-3">
            <div className="text-[11px] font-extrabold uppercase text-muted">{x.label}</div>
            <div className="font-extrabold">{x.value}</div>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle>Reglamento</SectionTitle>
        {tournament.rules ? (
          <div className="card whitespace-pre-line p-4 text-sm leading-relaxed">{tournament.rules}</div>
        ) : (
          <EmptyState title="La organización todavía no publicó el reglamento" />
        )}
      </section>

      <section>
        <SectionTitle>Pool de mapas</SectionTitle>
        <p className="mb-3 text-sm text-muted">
          El modo y mapa de cada game lo define la organización y se muestra en cada partida. No se repite modo dentro de
          una misma serie.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {poolModes.map((mode) => (
            <div key={mode.id} className="card p-4">
              <div className="mb-2">
                <ModeMapChip mode={mode} map={null} />
              </div>
              <ul className="space-y-1 text-sm font-bold">
                {pool
                  .filter((m) => m.modeId === mode.id)
                  .map((m) => (
                    <li key={m.id}>• {m.name}</li>
                  ))}
              </ul>
              {mode.description ? <p className="mt-2 text-xs text-muted">{mode.description}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
