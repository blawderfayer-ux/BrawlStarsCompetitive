/** Textos y colores de estados, compartidos entre la vista pública y el panel. */

type Badge = { label: string; className: string };

// Cada estado: fondo tenue + borde del mismo color (estilo marcador de esports).
export const TOURNAMENT_STATUS: Record<string, Badge> = {
  draft: { label: "Borrador", className: "bg-slate-500/15 text-slate-300 ring-slate-400/30" },
  registration_open: { label: "Inscripciones abiertas", className: "bg-blue/15 text-sky-300 ring-blue/40" },
  registration_closed: { label: "Inscripciones cerradas", className: "bg-amber-400/15 text-amber-300 ring-amber-400/40" },
  live: { label: "En curso", className: "bg-ok/15 text-emerald-300 ring-ok/40" },
  finished: { label: "Finalizado", className: "bg-brand text-brand-ink ring-brand" },
  cancelled: { label: "Cancelado", className: "bg-red/15 text-rose-300 ring-red/50" },
};

export const REGISTRATION_STATUS: Record<string, Badge> = {
  pending: { label: "Pendiente", className: "bg-amber-400/15 text-amber-300 ring-amber-400/40" },
  needs_changes: { label: "Requiere corrección", className: "bg-orange-400/15 text-orange-300 ring-orange-400/40" },
  approved: { label: "Aprobado", className: "bg-ok/15 text-emerald-300 ring-ok/40" },
  rejected: { label: "Rechazado", className: "bg-red/15 text-rose-300 ring-red/50" },
  withdrawn: { label: "Retirado", className: "bg-slate-500/15 text-slate-300 ring-slate-400/30" },
};

export const COMPETITION_STATUS: Record<string, Badge> = {
  registered: { label: "Inscrito", className: "bg-blue/15 text-sky-300 ring-blue/40" },
  active: { label: "Activo", className: "bg-ok/15 text-emerald-300 ring-ok/40" },
  in_match: { label: "En partida", className: "bg-red/15 text-rose-300 ring-red/50" },
  eliminated: { label: "Eliminado", className: "bg-slate-500/15 text-slate-400 ring-slate-500/30" },
  disqualified: { label: "Descalificado", className: "bg-red-800/30 text-rose-300 ring-red-700/50" },
  champion: { label: "Campeón", className: "bg-brand text-brand-ink ring-brand" },
};

export const SERIES_STATUS: Record<string, Badge> = {
  waiting: { label: "Por definir", className: "bg-slate-500/15 text-slate-400 ring-slate-500/30" },
  pending: { label: "Pendiente", className: "bg-blue/15 text-sky-300 ring-blue/40" },
  live: { label: "En vivo", className: "bg-red/15 text-rose-300 ring-red/50" },
  awaiting_result: { label: "Resultado pendiente", className: "bg-amber-400/15 text-amber-300 ring-amber-400/40" },
  disputed: { label: "Disputada", className: "bg-orange-400/15 text-orange-300 ring-orange-400/40" },
  finished: { label: "Finalizada", className: "bg-ok/15 text-emerald-300 ring-ok/40" },
  cancelled: { label: "Cancelada", className: "bg-red-800/30 text-rose-300 ring-red-700/50" },
};

export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  referee: "Árbitro",
};

export const MEMBER_ROLE_LABEL: Record<string, string> = {
  captain: "Capitán",
  player: "Jugador",
  sub: "Suplente",
};
