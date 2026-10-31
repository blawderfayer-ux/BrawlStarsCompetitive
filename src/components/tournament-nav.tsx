"use client";

import { BookOpen, House, KeyRound, ScrollText, Shield, Swords, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "", label: "Inicio", icon: House },
  { href: "/mi-equipo", label: "Mi equipo", icon: KeyRound },
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
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4" aria-label="Secciones del torneo">
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
              "font-display flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[15px] uppercase tracking-wide transition-colors",
              active ? "border-brand text-text" : "border-transparent text-muted hover:text-text",
              t.href === "/mi-equipo" && !active && "text-brand/90",
            )}
          >
            <Icon size={15} strokeWidth={2.4} aria-hidden />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
