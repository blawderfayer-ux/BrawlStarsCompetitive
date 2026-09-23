import { ActionForm, SubmitButton } from "@/components/action-form";
import { requireStaffPage } from "@/lib/auth";
import { getCatalog } from "@/lib/queries";
import { saveMapAction, saveModeAction, seedCatalogAction } from "@/app/admin/actions";

/** Modos y mapas: editables porque Supercell cambia la rotación y el pool competitivo. */
export default async function CatalogPage() {
  await requireStaffPage(["admin"]);
  const { modes, maps } = await getCatalog();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Modos y mapas</h1>
          <p className="text-sm text-muted">Desactiva lo que salga de rotación y agrega lo nuevo. Afecta a torneos futuros.</p>
        </div>
        <ActionForm action={seedCatalogAction}>
          <SubmitButton className="btn-ghost btn-sm" pendingText="Cargando…">
            Recargar pool BSC 2026
          </SubmitButton>
        </ActionForm>
      </div>

      {modes.map((mode) => (
        <section key={mode.id} className="card space-y-4 p-4" style={{ borderTop: `4px solid ${mode.color}` }}>
          <details>
            <summary className="cursor-pointer">
              <span className="font-display text-xl">
                {mode.icon} {mode.name}
              </span>
              {!mode.active ? <span className="ml-2 text-xs font-bold text-red-300">(inactivo)</span> : null}
            </summary>
            <ActionForm action={saveModeAction} className="mt-3 grid gap-2 sm:grid-cols-[80px_1fr_90px]">
              <input type="hidden" name="id" value={mode.id} />
              <input name="icon" className="input text-center" defaultValue={mode.icon} aria-label="Ícono" />
              <input name="name" className="input" defaultValue={mode.name} aria-label="Nombre" required />
              <input name="color" type="color" className="input !p-1" defaultValue={mode.color} aria-label="Color" />
              <input name="description" className="input sm:col-span-3" defaultValue={mode.description} placeholder="Descripción corta" />
              <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
                <input type="checkbox" name="active" defaultChecked={mode.active} className="h-5 w-5" /> Activo
              </label>
              <SubmitButton className="btn-ghost btn-sm">Guardar modo</SubmitButton>
            </ActionForm>
          </details>

          <ul className="space-y-2">
            {maps
              .filter((m) => m.modeId === mode.id)
              .map((m) => (
                <li key={m.id}>
                  <ActionForm action={saveMapAction} className="flex flex-wrap items-center gap-2" showSuccess={false}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="modeId" value={mode.id} />
                    <input name="name" className="input !min-h-[40px] flex-1" defaultValue={m.name} required aria-label="Nombre del mapa" />
                    <label className="flex items-center gap-1 text-xs font-bold">
                      <input type="checkbox" name="active" defaultChecked={m.active} className="h-5 w-5" /> Activo
                    </label>
                    <SubmitButton className="btn-ghost btn-sm">Guardar</SubmitButton>
                  </ActionForm>
                </li>
              ))}
          </ul>
          <ActionForm action={saveMapAction} className="flex gap-2" resetOnSuccess>
            <input type="hidden" name="modeId" value={mode.id} />
            <input type="hidden" name="active" value="on" />
            <input name="name" className="input !min-h-[40px] flex-1" placeholder="Nuevo mapa…" required />
            <SubmitButton className="btn-secondary btn-sm">Agregar</SubmitButton>
          </ActionForm>
        </section>
      ))}

      <section className="card p-4">
        <h2 className="font-display mb-3 text-xl">Nuevo modo</h2>
        <ActionForm action={saveModeAction} className="grid gap-2 sm:grid-cols-[80px_1fr_90px]" resetOnSuccess>
          <input name="icon" className="input text-center" placeholder="🎮" aria-label="Ícono" />
          <input name="name" className="input" placeholder="Nombre (ej: Destrucción)" required />
          <input name="color" type="color" className="input !p-1" defaultValue="#7c3aed" aria-label="Color" />
          <input name="description" className="input sm:col-span-3" placeholder="Descripción corta" />
          <input type="hidden" name="active" value="on" />
          <SubmitButton className="btn-primary btn-sm sm:col-span-3">Crear modo</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
