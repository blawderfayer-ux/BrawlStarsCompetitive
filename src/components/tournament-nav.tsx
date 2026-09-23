"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "Inicio", icon: "🏠" },
  { href: "/equipos", label: "Equipos", icon: "🛡️" },
  { href: "/bracket", label: "Bracket", icon: "🏆" },
  { href: "/partidas", label: "Partidas", icon: "⚔️" },
  { href: "/resultados", label: "Resultados", icon: "📜" },
  { href: "/reglamento", label: "Reglas", icon: "📘" },
];

export function TournamentNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/torneos/${slug}`;
  return (
    <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Secciones del torneo">
      {TABS.map((t) => {
        const href = base + t.href;
        const active = t.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={t.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-extrabold uppercase transition-colors",
              active ? "bg-brand text-brand-ink" : "bg-card text-muted",
            )}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
