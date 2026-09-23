import { EmptyState } from "@/components/ui";
import { requireStaffPage } from "@/lib/auth";
import { getPrivateEvents } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import { loadAdminTournament } from "../data";

/** Registro de auditoría: quién hizo qué y cuándo (incluye eventos privados). */
export default async function AuditLogPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireStaffPage(["admin"]);
  const { slug } = await params;
  const { tournament } = await loadAdminTournament(slug);
  const events = await getPrivateEvents(tournament.id, 200);

  if (events.length === 0) return <EmptyState icon="📜" title="Sin actividad" />;
  return (
    <ul className="card divide-y divide-line/70">
      {events.map((e) => (
        <li key={e.id} className="px-4 py-3">
          <p className="text-sm font-bold">
            {e.public ? "" : "🔒 "}
            {e.message}
          </p>
          <p className="text-xs text-muted">
            {formatDateTime(e.createdAt)}
            {e.actorName ? ` · ${e.actorName}` : " · sistema / capitán"}
          </p>
        </li>
      ))}
    </ul>
  );
}
