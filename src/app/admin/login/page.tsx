import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "@/app/admin/actions";
import { hasAnyStaff } from "@/lib/services/catalog";

export const metadata: Metadata = { title: "Acceso organizadores", robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  if (!(await hasAnyStaff())) redirect("/admin/setup");
  return (
    <Container className="max-w-sm py-12">
      <div className="card p-6">
        <Image src="/img/skull.webp" alt="" width={64} height={64} className="mx-auto rounded-2xl border-2 border-ink shadow-[0_3px_0_var(--ink)]" />
        <h1 className="font-display mt-2 text-center text-2xl">Panel de organización</h1>
        <p className="mb-5 text-center text-sm text-muted">Solo administradores y árbitros.</p>
        <ActionForm action={loginAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="username" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
            />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="Entrando…">
            Entrar
          </SubmitButton>
        </ActionForm>
      </div>
    </Container>
  );
}
