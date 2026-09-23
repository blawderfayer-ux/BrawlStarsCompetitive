import Image from "next/image";
import {
  Flame,
  Gem,
  Skull,
  Star,
  Target,
  Vault,
  Volleyball,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { MapView, ModeView, TeamView } from "@/lib/views";

type BadgeMap = Record<string, { label: string; className: string }>;

export function StatusBadge({ map, value, className }: { map: BadgeMap; value: string; className?: string }) {
  const b = map[value] ?? { label: value, className: "bg-slate-600 text-white" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border-2 border-ink px-2 py-0.5 text-[11px] font-black uppercase tracking-wide shadow-[0_2px_0_var(--ink)]",
        b.className,
        className,
      )}
    >
      {value === "live" ? <span className="live-dot !h-2 !w-2 !bg-white" aria-hidden /> : null}
      {b.label}
    </span>
  );
}

function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? words[0]?.[1] ?? "")).toUpperCase();
}

/** Escudo del equipo: el logo subido o un escudo de color con iniciales. */
export function TeamLogo({
  team,
  size = 40,
  className,
}: {
  team: Pick<TeamView, "name" | "color" | "logoUrl"> | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  const base = "shrink-0 rounded-xl border-2 border-ink shadow-[0_2px_0_var(--ink)]";
  if (!team) {
    return (
      <span style={style} className={cn(base, "inline-flex items-center justify-center bg-bg-soft font-black text-muted", className)}>
        ?
      </span>
    );
  }
  if (team.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={team.logoUrl} alt="" style={style} className={cn(base, "bg-bg-soft object-cover", className)} loading="lazy" />
    );
  }
  return (
    <span
      style={{ ...style, backgroundColor: team.color, fontSize: size * 0.4 }}
      className={cn(base, "title-ink inline-flex items-center justify-center text-white", className)}
      aria-hidden
    >
      {initials(team.name)}
    </span>
  );
}

const MODE_ICONS: Record<string, LucideIcon> = {
  atrapagemas: Gem,
  "balon-brawl": Volleyball,
  atraco: Vault,
  "zona-restringida": Flame,
  "caza-estelar": Star,
  noqueo: Skull,
};

/** Ícono del modo: SVG para los modos conocidos; para modos nuevos, el ícono cargado en el panel. */
export function ModeIcon({ mode, size = 18 }: { mode: Pick<ModeView, "slug" | "icon"> | null; size?: number }) {
  const Icon = mode ? MODE_ICONS[mode.slug] : undefined;
  if (Icon) return <Icon size={size} strokeWidth={2.6} aria-hidden />;
  if (mode?.icon) return <span style={{ fontSize: size * 0.9 }} aria-hidden>{mode.icon}</span>;
  return <Target size={size} strokeWidth={2.6} aria-hidden />;
}

export function ModeMapChip({
  mode,
  map,
  size = "md",
}: {
  mode: ModeView | null;
  map: MapView | null;
  size?: "sm" | "md" | "lg";
}) {
  if (!mode && !map) return <span className="text-sm font-bold text-muted">Mapa por definir</span>;
  const box = size === "lg" ? "h-12 w-12" : size === "md" ? "h-10 w-10" : "h-8 w-8";
  const icon = size === "lg" ? 24 : size === "md" ? 20 : 16;
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <span
        className={cn(box, "inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-ink text-white shadow-[0_2px_0_var(--ink)]")}
        style={{ backgroundColor: mode?.color ?? "#555" }}
      >
        <ModeIcon mode={mode} size={icon} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block font-black uppercase tracking-wide", size === "lg" ? "text-sm" : "text-[11px]")} style={{ color: mode?.color }}>
          {mode?.name ?? "Modo"}
        </span>
        <span className={cn("font-display block truncate", size === "lg" ? "text-2xl" : "text-base")}>
          {map?.name ?? "Mapa por definir"}
        </span>
      </span>
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="title-ink flex items-center gap-2 text-2xl uppercase">
        <span className="inline-block h-6 w-2 -skew-x-12 rounded-sm border-2 border-ink bg-brand" aria-hidden />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, children, image = "/img/skull.webp" }: { title: string; children?: ReactNode; image?: string }) {
  return (
    <div className="card overflow-hidden p-6 text-center">
      <Image
        src={image}
        alt=""
        width={72}
        height={72}
        className="mx-auto h-[72px] w-[72px] rounded-2xl border-2 border-ink object-cover shadow-[0_3px_0_var(--ink)]"
      />
      <p className="title-ink mt-3 text-xl">{title}</p>
      {children ? <div className="mt-1 text-sm font-semibold text-muted">{children}</div> : null}
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-5xl px-4", className)}>{children}</div>;
}
