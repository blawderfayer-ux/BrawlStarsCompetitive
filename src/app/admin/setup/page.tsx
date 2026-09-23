import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Container } from "@/components/ui";
import { setupAction } from "@/app/admin/actions";
import { hasAnyStaff } from "@/lib/services/catalog";

export const metadata: Metadata = { title: "Configuración inicial", robots: { index: false } };

/** Primera vez: crea la cuenta del administrador principal desde el navegador. */
export default async function SetupPage() {
  if (await hasAnyStaff()) redirect("/admin/login");
  return (
    <Container className="max-w-sm py-10">
      <div className="card p-6">
        <div className="text-center text-4xl" aria-hidden>
          🏆
        </div>
        <h1 className="font-display mt-2 text-center text-2xl">Configuración inicial</h1>
        <p className="mb-5 text-center text-sm text-muted">
          Crea la cuenta del administrador principal. También se cargan los modos y mapas del pool BSC 2026. Esta
          pantalla deja de estar disponible cuando termines.
        </p>
        <ActionForm action={setupAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Tu nombre
            </label>
            <input id="name" name="name" required maxLength={60} className="input" autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" required className="input" autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña (mínimo 8)
            </label>
            <input id="password" name="password" type="password" minLength={8} required className="input" autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="password2">
              Repite la contraseña
            </label>
            <input id="password2" name="password2" type="password" minLength={8} required className="input" autoComplete="new-password" />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="Creando…">
            Crear administrador
          </SubmitButton>
        </ActionForm>
      </div>
    </Container>
  );
}
