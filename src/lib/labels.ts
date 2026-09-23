/** Textos y colores de estados, compartidos entre la vista pública y el panel. */

type Badge = { label: string; className: string };

// Cada estado: fondo sólido + contorno oscuro, como una pegatina.
export const TOURNAMENT_STATUS: Record<string, Badge> = {
  draft: { label: "Borrador", className: "bg-slate-500 text-white" },
  registration_open: { label: "Inscripciones abiertas", className: "bg-blue text-white" },
  registration_closed: { label: "Inscripciones cerradas", className: "bg-amber-400 text-ink" },
  live: { label: "En curso", className: "bg-ok text-ink" },
  finished: { label: "Finalizado", className: "bg-brand text-ink" },
  cancelled: { label: "Cancelado", className: "bg-red text-white" },
};

export const REGISTRATION_STATUS: Record<string, Badge> = {
  pending: { label: "Pendiente", className: "bg-amber-400 text-ink" },
  needs_changes: { label: "Requiere corrección", className: "bg-orange-400 text-ink" },
  approved: { label: "Aprobado", className: "bg-ok text-ink" },
  rejected: { label: "Rechazado", className: "bg-red text-white" },
  withdrawn: { label: "Retirado", className: "bg-slate-500 text-white" },
};

export const COMPETITION_STATUS: Record<string, Badge> = {
  registered: { label: "Inscrito", className: "bg-blue text-white" },
  active: { label: "Activo", className: "bg-ok text-ink" },
  in_match: { label: "En partida", className: "bg-red text-white" },
  eliminated: { label: "Eliminado", className: "bg-slate-600 text-slate-200" },
  disqualified: { label: "Descalificado", className: "bg-red-800 text-white" },
  champion: { label: "Campeón", className: "bg-brand text-ink" },
};

export const SERIES_STATUS: Record<string, Badge> = {
  waiting: { label: "Por definir", className: "bg-slate-600 text-slate-200" },
  pending: { label: "Pendiente", className: "bg-blue text-white" },
  live: { label: "En vivo", className: "bg-red text-white" },
  awaiting_result: { label: "Resultado pendiente", className: "bg-amber-400 text-ink" },
  disputed: { label: "Disputada", className: "bg-orange-400 text-ink" },
  finished: { label: "Finalizada", className: "bg-ok text-ink" },
  cancelled: { label: "Cancelada", className: "bg-red-800 text-white" },
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
