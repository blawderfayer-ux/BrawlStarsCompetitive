import type { Metadata } from "next";
import Image from "next/image";
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
        <Image src="/img/skull.webp" alt="" width={64} height={64} className="mx-auto rounded-2xl border-2 border-ink shadow-[0_3px_0_var(--ink)]" />
        <h1 className="font-display mt-2 text-center text-2xl">Configuración inicial</h1>
        <p className="mb-5 text-center text-sm text-muted">
          Crea la cuenta del administrador principal. También se cargan los modos y mapas 2026 (nombres en español). Esta
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
