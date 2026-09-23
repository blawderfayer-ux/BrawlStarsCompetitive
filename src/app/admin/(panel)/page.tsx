import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { EmptyState, StatusBadge } from "@/components/ui";
import { requireStaffPage } from "@/lib/auth";
import { TOURNAMENT_STATUS } from "@/lib/labels";
import { getCatalog, listAllTournamentsForAdmin } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import { seedCatalogAction } from "@/app/admin/actions";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireStaffPage();
  const { error } = await searchParams;
  const [tournaments, catalog] = await Promise.all([listAllTournamentsForAdmin(), getCatalog()]);
  const isAdmin = user.role === "admin";

  return (
    <div className="space-y-6">
      {error === "permiso" ? (
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-300">
          Esa sección es solo para administradores.
        </p>
      ) : null}

      {isAdmin && catalog.modes.length === 0 ? (
        <div className="card border-brand/50 p-4">
          <p className="font-extrabold">Primer paso: cargar modos y mapas</p>
          <p className="mb-3 text-sm text-muted">
            Carga el pool competitivo BSC 2026 (6 modos 3v3, 18 mapas). Después podrás editarlo.
          </p>
          <ActionForm action={seedCatalogAction}>
            <SubmitButton className="btn-primary" pendingText="Cargando…">
              Cargar catálogo BSC 2026
            </SubmitButton>
          </ActionForm>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Torneos</h1>
        {isAdmin ? (
          <Link href="/admin/torneos/nuevo" className="btn btn-primary btn-sm">
            + Nuevo torneo
          </Link>
        ) : null}
      </div>

      {tournaments.length === 0 ? (
        <EmptyState icon="🏆" title="Todavía no hay torneos">
          {isAdmin ? "Crea el primero con el botón “Nuevo torneo”." : "Un administrador debe crear el torneo."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={t.bracketGeneratedAt || !isAdmin ? `/admin/torneos/${t.slug}/partidas` : `/admin/torneos/${t.slug}`}
              className="card block p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl leading-tight">{t.name}</p>
                <StatusBadge map={TOURNAMENT_STATUS} value={t.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {t.approvedTeams}/{t.maxTeams} aprobados
                {t.pendingRegistrations ? ` · ⏳ ${t.pendingRegistrations} por revisar` : ""}
                {t.startsAt ? ` · ${formatDateTime(t.startsAt)}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
