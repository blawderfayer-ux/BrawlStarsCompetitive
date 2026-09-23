/** Tipos "planos" que reciben las páginas y componentes (sin documentos de Mongoose). */

export interface ModeView {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  active: boolean;
}

export interface MapView {
  id: string;
  name: string;
  modeId: string;
  active: boolean;
}

export interface MemberView {
  name: string;
  tag: string;
  role: "captain" | "player" | "sub";
  ficct: boolean | null;
}

export interface TeamView {
  id: string;
  slug: string;
  name: string;
  color: string;
  hasLogo: boolean;
  logoUrl: string | null;
  members: MemberView[];
  registrationStatus: string;
  competitionStatus: string;
  seed: number | null;
  wins: number;
  losses: number;
  createdAt: string;
}

export interface TeamAdminView extends TeamView {
  captainContact: string;
  adminNote: string;
  accessCode: string;
  paid: boolean;
  idsChecked: boolean;
}

export interface GameView {
  number: number;
  status: "pending" | "finished" | "skipped";
  winnerSlot: "A" | "B" | null;
  mode: ModeView | null;
  map: MapView | null;
}

export interface SeriesView {
  id: string;
  key: string;
  number: number;
  round: number;
  roundName: string;
  position: number;
  bestOf: number;
  teamA: TeamView | null;
  teamB: TeamView | null;
  scoreA: number;
  scoreB: number;
  winnerSlot: "A" | "B" | null;
  status: string;
  isBye: boolean;
  walkover: boolean;
  nextKey: string | null;
  nextSlot: "A" | "B" | null;
  scheduledAt: string | null;
  notes: string;
  games: GameView[];
  /** Resultados reportados por los equipos (pendientes de confirmar por el árbitro). */
  reports: { game: number; teamId: string; winnerSlot: "A" | "B" }[];
}

export interface EventView {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface TournamentView {
  id: string;
  slug: string;
  name: string;
  description: string;
  startsAt: string | null;
  maxTeams: number;
  teamSize: number;
  format: string;
  defaultBestOf: number;
  bestOfByRound: number[];
  roundDurationMinutes: number;
  status: string;
  rules: string;
  posterUrl: string;
  mapPool: string[];
  roundPlans: { modeId: string | null; mapId: string | null }[][];
  totalRounds: number;
  bracketGeneratedAt: string | null;
  championTeamId: string | null;
  approvedTeams: number;
}

export interface TournamentData {
  tournament: TournamentView;
  teams: TeamView[];
  series: SeriesView[];
  modes: ModeView[];
  maps: MapView[];
  events: EventView[];
}
