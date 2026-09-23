import Link from "next/link";
import { AutoRefresh } from "@/components/live";
import { StatusBadge } from "@/components/ui";
import { requireStaffPage } from "@/lib/auth";
import { TOURNAMENT_STATUS } from "@/lib/labels";
import { loadAdminTournament } from "./data";

export default async function AdminTournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const user = await requireStaffPage();
  const { slug } = await params;
  const { tournament } = await loadAdminTournament(slug);
  const base = `/admin/torneos/${slug}`;
  const tabs = [
    ...(user.role === "admin"
      ? [
          { href: base, label: "Resumen" },
          { href: `${base}/inscripciones`, label: "Inscripciones" },
        ]
      : []),
    { href: `${base}/partidas`, label: "Partidas" },
    ...(user.role === "admin"
      ? [
          { href: `${base}/mapas`, label: "Mapas" },
          { href: `${base}/configuracion`, label: "Configuración" },
          { href: `${base}/historial`, label: "Historial" },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display truncate text-2xl">{tournament.name}</h1>
          <Link href={`/torneos/${slug}`} className="text-xs font-bold text-muted underline" target="_blank">
            Ver página pública ↗
          </Link>
        </div>
        <StatusBadge map={TOURNAMENT_STATUS} value={tournament.status} />
      </div>
      <nav className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="shrink-0 rounded-xl bg-card px-3.5 py-2.5 text-sm font-extrabold uppercase text-muted">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
      {tournament.status === "live" ? <AutoRefresh seconds={30} /> : null}
    </div>
  );
}
