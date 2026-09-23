"use client";

import { BookOpen, House, ScrollText, Shield, Swords, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "", label: "Inicio", icon: House },
  { href: "/equipos", label: "Equipos", icon: Shield },
  { href: "/bracket", label: "Bracket", icon: Trophy },
  { href: "/partidas", label: "Partidas", icon: Swords },
  { href: "/resultados", label: "Resultados", icon: ScrollText },
  { href: "/reglamento", label: "Reglas", icon: BookOpen },
];

export function TournamentNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/torneos/${slug}`;
  return (
    <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-1 pb-2" aria-label="Secciones del torneo">
      {TABS.map((t) => {
        const href = base + t.href;
        const active = t.href === "" ? pathname === base : pathname.startsWith(href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-display flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-3.5 py-2 text-sm uppercase shadow-[0_3px_0_var(--ink)] transition-transform active:translate-y-0.5",
              active ? "bg-brand text-brand-ink" : "bg-card-hi text-text",
            )}
          >
            <Icon size={16} strokeWidth={2.6} aria-hidden />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
