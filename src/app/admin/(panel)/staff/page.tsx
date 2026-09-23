import { ActionForm, SubmitButton } from "@/components/action-form";
import { requireStaffPage } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { listStaff } from "@/lib/services/catalog";
import { createStaffAction, updateStaffAction } from "@/app/admin/actions";

export default async function StaffPage() {
  const me = await requireStaffPage(["admin"]);
  const staff = await listStaff();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Staff</h1>
        <p className="text-sm text-muted">
          <b>Administrador</b>: controla todo. <b>Árbitro</b>: registra resultados, horarios y estados de partidas.
          Los jugadores no necesitan cuenta.
        </p>
      </div>

      <ul className="space-y-3">
        {staff.map((u) => (
          <li key={u.id} className="card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-extrabold">
                  {u.name} {u.id === me.id ? <span className="text-xs text-muted">(tú)</span> : null}
                </p>
                <p className="truncate text-xs text-muted">{u.email}</p>
              </div>
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-extrabold uppercase text-accent">
                {ROLE_LABEL[u.role]}
                {u.active ? "" : " · desactivado"}
              </span>
            </div>
            {u.id !== me.id ? (
              <ActionForm action={updateStaffAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <SubmitButton name="role" value={u.role === "admin" ? "referee" : "admin"} className="btn-ghost btn-sm">
                  Cambiar a {u.role === "admin" ? "árbitro" : "admin"}
                </SubmitButton>
                <SubmitButton name="active" value={u.active ? "false" : "true"} className="btn-ghost btn-sm">
                  {u.active ? "Desactivar" : "Activar"}
                </SubmitButton>
              </ActionForm>
            ) : null}
            <details>
              <summary className="cursor-pointer text-xs font-bold text-muted">Cambiar contraseña</summary>
              <ActionForm action={updateStaffAction} className="mt-2 flex gap-2" resetOnSuccess>
                <input type="hidden" name="userId" value={u.id} />
                <input name="password" type="password" minLength={8} required className="input !min-h-[40px]" placeholder="Nueva contraseña" autoComplete="new-password" />
                <SubmitButton className="btn-ghost btn-sm">Guardar</SubmitButton>
              </ActionForm>
            </details>
          </li>
        ))}
      </ul>

      <section className="card p-4">
        <h2 className="font-display mb-3 text-xl">Agregar árbitro o admin</h2>
        <ActionForm action={createStaffAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2" resetOnSuccess>
          <input name="name" className="input" placeholder="Nombre" required />
          <input name="email" type="email" className="input" placeholder="Email" required autoComplete="off" />
          <input name="password" type="password" minLength={8} className="input" placeholder="Contraseña (mín. 8)" required autoComplete="new-password" />
          <select name="role" className="input" defaultValue="referee">
            <option value="referee">Árbitro</option>
            <option value="admin">Administrador</option>
          </select>
          <SubmitButton className="btn-primary sm:col-span-2">Crear usuario</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
