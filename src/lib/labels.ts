/** Textos y colores de estados, compartidos entre la vista pública y el panel. */

type Badge = { label: string; className: string; icon?: string };

export const TOURNAMENT_STATUS: Record<string, Badge> = {
  draft: { label: "Borrador", className: "bg-slate-600/30 text-slate-300", icon: "📝" },
  registration_open: { label: "Inscripciones abiertas", className: "bg-sky-500/20 text-sky-300", icon: "📝" },
  registration_closed: { label: "Inscripciones cerradas", className: "bg-amber-500/20 text-amber-300", icon: "🔒" },
  live: { label: "En curso", className: "bg-emerald-500/20 text-emerald-300", icon: "🟢" },
  finished: { label: "Finalizado", className: "bg-violet-500/20 text-violet-300", icon: "🏆" },
  cancelled: { label: "Cancelado", className: "bg-red-500/20 text-red-300", icon: "⛔" },
};

export const REGISTRATION_STATUS: Record<string, Badge> = {
  pending: { label: "Pendiente", className: "bg-amber-500/20 text-amber-300", icon: "⏳" },
  needs_changes: { label: "Requiere corrección", className: "bg-orange-500/20 text-orange-300", icon: "✏️" },
  approved: { label: "Aprobado", className: "bg-emerald-500/20 text-emerald-300", icon: "✅" },
  rejected: { label: "Rechazado", className: "bg-red-500/20 text-red-300", icon: "❌" },
  withdrawn: { label: "Retirado", className: "bg-slate-600/30 text-slate-300", icon: "↩️" },
};

export const COMPETITION_STATUS: Record<string, Badge> = {
  registered: { label: "Inscrito", className: "bg-sky-500/20 text-sky-300", icon: "📋" },
  active: { label: "Activo", className: "bg-emerald-500/20 text-emerald-300", icon: "🟢" },
  in_match: { label: "En partida", className: "bg-rose-500/20 text-rose-300", icon: "🔴" },
  eliminated: { label: "Eliminado", className: "bg-slate-600/40 text-slate-400", icon: "❌" },
  disqualified: { label: "Descalificado", className: "bg-red-600/30 text-red-300", icon: "⛔" },
  champion: { label: "Campeón", className: "bg-yellow-400/20 text-yellow-300", icon: "🏆" },
};

export const SERIES_STATUS: Record<string, Badge> = {
  waiting: { label: "Por definir", className: "bg-slate-600/30 text-slate-400", icon: "⌛" },
  pending: { label: "Pendiente", className: "bg-sky-500/20 text-sky-300", icon: "🕒" },
  live: { label: "En curso", className: "bg-rose-500/25 text-rose-300", icon: "🔴" },
  awaiting_result: { label: "Resultado pendiente", className: "bg-amber-500/20 text-amber-300", icon: "📝" },
  disputed: { label: "Disputada", className: "bg-orange-500/25 text-orange-300", icon: "⚠️" },
  finished: { label: "Finalizada", className: "bg-emerald-500/20 text-emerald-300", icon: "✅" },
  cancelled: { label: "Cancelada", className: "bg-red-500/20 text-red-300", icon: "⛔" },
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
