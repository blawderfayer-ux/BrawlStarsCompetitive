import { ModeIcon, SectionTitle } from "@/components/ui";
import { baseRulebook } from "@/lib/rulebook";
import { bestOfLabel } from "@/lib/utils";
import { loadTournament } from "../data";

export default async function RulesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tournament, modes, maps } = await loadTournament(slug);
  const pool = maps.filter((m) => tournament.mapPool.includes(m.id));
  const poolModes = modes.filter((mode) => pool.some((m) => m.modeId === mode.id));
  const bo = bestOfLabel(tournament.defaultBestOf, tournament.bestOfByRound);

  const rules = baseRulebook({ bestOf: bo, bansPerTeam: tournament.bansPerTeam, teamSize: tournament.teamSize });

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Formato", value: "Eliminación directa" },
          { label: "Partidas", value: bo },
          { label: "Bans", value: tournament.bansPerTeam ? `${tournament.bansPerTeam} por equipo` : "Sin bans" },
          { label: "Jugadores", value: `${tournament.teamSize} + suplente` },
        ].map((x) => (
          <div key={x.label} className="card p-3">
            <div className="eyebrow !text-[10px]">{x.label}</div>
            <div className="font-display text-lg leading-tight">{x.value}</div>
          </div>
        ))}
      </section>

      {tournament.rules ? (
        <section>
          <SectionTitle>Reglas de este torneo</SectionTitle>
          <div className="card whitespace-pre-line [overflow-wrap:anywhere] p-4 text-sm leading-relaxed">{tournament.rules}</div>
        </section>
      ) : null}

      <section>
        <SectionTitle>Reglamento general</SectionTitle>
        <p className="mb-3 text-sm text-muted">
          Basado en las reglas del competitivo oficial de Brawl Stars (Brawl Stars Championship), adaptado a torneos
          entre equipos de la universidad.{tournament.rules ? " Si algo choca con las reglas de arriba, valen las de este torneo." : ""}
        </p>
        <div className="space-y-2">
          {rules.map((sec, i) => (
            <details key={sec.title} className="card group overflow-hidden" open={i < 2}>
              <summary className="font-display flex cursor-pointer list-none items-center justify-between px-4 py-3 text-lg uppercase tracking-wide">
                <span>
                  <span className="mr-2 text-brand">{String(i + 1).padStart(2, "0")}</span>
                  {sec.title}
                </span>
                <span className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <ul className="space-y-2 border-t border-line px-4 py-3 text-sm leading-relaxed">
                {sec.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Pool de mapas</SectionTitle>
        <p className="mb-3 text-sm text-muted">
          Mapas posibles en este torneo. El de cada game se sortea y se muestra en la página de la partida.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {poolModes.map((mode) => (
            <div key={mode.id} className="card p-4">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white" style={{ backgroundColor: mode.color }}>
                  <ModeIcon mode={mode} size={18} />
                </span>
                <span className="font-display text-xl uppercase" style={{ color: mode.color }}>
                  {mode.name}
                </span>
              </div>
              <ul className="space-y-1 text-sm">
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
