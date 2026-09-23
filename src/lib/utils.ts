export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(text: string) {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "equipo"
  );
}

export const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || "America/La_Paz";

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Convierte "2026-10-01T21:30" (hora local del torneo) a Date. */
export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const offset = process.env.TOURNAMENT_UTC_OFFSET || "-04:00";
  const d = new Date(`${value}:00${offset}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Valor para <input type="datetime-local"> en la hora local del torneo. */
export function toLocalInputValue(value: string | Date | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function timeAgo(value: string | Date) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}
