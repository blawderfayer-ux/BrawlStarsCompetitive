import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { MapView, ModeView, TeamView } from "@/lib/views";

type BadgeMap = Record<string, { label: string; className: string; icon?: string }>;

export function StatusBadge({ map, value, className }: { map: BadgeMap; value: string; className?: string }) {
  const b = map[value] ?? { label: value, className: "bg-slate-600/30 text-slate-300" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide whitespace-nowrap",
        b.className,
        className,
      )}
    >
      {value === "live" ? <span className="live-dot !h-2 !w-2" aria-hidden /> : b.icon ? <span aria-hidden>{b.icon}</span> : null}
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
  if (!team) {
    return (
      <span
        style={style}
        className={cn("inline-flex shrink-0 items-center justify-center rounded-xl border border-dashed border-line text-muted", className)}
      >
        ?
      </span>
    );
  }
  if (team.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logoUrl}
        alt=""
        style={style}
        className={cn("shrink-0 rounded-xl bg-bg-soft object-cover", className)}
        loading="lazy"
      />
    );
  }
  return (
    <span
      style={{ ...style, background: `linear-gradient(160deg, ${team.color}, ${team.color}99)`, fontSize: size * 0.38 }}
      className={cn(
        "font-display inline-flex shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_-3px_0_#0003]",
        className,
      )}
      aria-hidden
    >
      {initials(team.name)}
    </span>
  );
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
  if (!mode && !map) return <span className="text-sm text-muted">Mapa por definir</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg",
          size === "lg" ? "h-12 w-12 text-2xl" : size === "md" ? "h-9 w-9 text-lg" : "h-7 w-7 text-sm",
        )}
        style={{ background: `${mode?.color ?? "#555"}33`, boxShadow: `inset 0 0 0 1px ${mode?.color ?? "#555"}88` }}
        aria-hidden
      >
        {mode?.icon ?? "🗺️"}
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={cn("block font-extrabold uppercase", size === "lg" ? "text-lg" : "text-xs")}
          style={{ color: mode?.color }}
        >
          {mode?.name ?? "Modo"}
        </span>
        <span className={cn("block truncate font-bold", size === "lg" ? "text-xl" : "text-sm")}>
          {map?.name ?? "Mapa por definir"}
        </span>
      </span>
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-xl uppercase text-text">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ icon = "🕹️", title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="card p-6 text-center">
      <div className="text-4xl" aria-hidden>
        {icon}
      </div>
      <p className="font-display mt-2 text-lg">{title}</p>
      {children ? <div className="mt-1 text-sm text-muted">{children}</div> : null}
    </div>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-5xl px-4", className)}>{children}</div>;
}
