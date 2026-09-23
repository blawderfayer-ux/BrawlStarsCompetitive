import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { requireStaffPage } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { logoutAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Administración", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();
  const isAdmin = user.role === "admin";
  return (
    <Container className="py-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent">Administración</p>
          <p className="truncate text-sm font-bold">
            {user.name} · {ROLE_LABEL[user.role]}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <Link href="/admin" className="rounded-lg bg-card px-3 py-2">
            Torneos
          </Link>
          {isAdmin ? (
            <>
              <Link href="/admin/catalogo" className="rounded-lg bg-card px-3 py-2">
                Modos y mapas
              </Link>
              <Link href="/admin/staff" className="rounded-lg bg-card px-3 py-2">
                Staff
              </Link>
            </>
          ) : null}
          <form action={logoutAction}>
            <button type="submit" className="rounded-lg px-3 py-2 text-muted underline">
              Salir
            </button>
          </form>
        </nav>
      </div>
      {children}
    </Container>
  );
}
