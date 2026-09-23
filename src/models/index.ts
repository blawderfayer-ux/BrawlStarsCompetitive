import mongoose, { Schema, type Model, type SchemaOptions, Types } from "mongoose";

const { ObjectId } = Schema.Types;

/**
 * Crea un schema tipado con la interfaz explícita en vez de dejar que Mongoose infiera
 * el tipo desde la definición (esa inferencia hace que TypeScript se quede sin memoria).
 */
function defineSchema<T>(definition: Record<string, unknown>, options?: SchemaOptions): Schema<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Schema(definition as any, options as any) as unknown as Schema<T>;
}

function getModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}

/* ─────────────────────────── Usuarios del staff ─────────────────────────── */

export const STAFF_ROLES = ["admin", "referee"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: StaffRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = defineSchema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: STAFF_ROLES, required: true, default: "referee" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const User = getModel<UserDoc>("User", userSchema);

/* ─────────────────────────── Catálogo: modos y mapas ─────────────────────────── */

export interface GameModeDoc {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  order: number;
  active: boolean;
}

const gameModeSchema = defineSchema<GameModeDoc>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, default: "🎮" },
    color: { type: String, default: "#7c3aed" },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const GameMode = getModel<GameModeDoc>("GameMode", gameModeSchema);

export interface GameMapDoc {
  _id: Types.ObjectId;
  name: string;
  mode: Types.ObjectId;
  imageUrl: string;
  order: number;
  active: boolean;
}

const gameMapSchema = defineSchema<GameMapDoc>(
  {
    name: { type: String, required: true, trim: true },
    mode: { type: ObjectId, ref: "GameMode", required: true },
    imageUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
gameMapSchema.index({ mode: 1, name: 1 }, { unique: true });
export const GameMap = getModel<GameMapDoc>("GameMap", gameMapSchema);

/* ─────────────────────────── Torneos ─────────────────────────── */

export const TOURNAMENT_STATUSES = [
  "draft",
  "registration_open",
  "registration_closed",
  "live",
  "finished",
  "cancelled",
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const TOURNAMENT_FORMATS = ["single_elimination"] as const;

export interface PlannedGame {
  mode: Types.ObjectId | null;
  map: Types.ObjectId | null;
}

const plannedGameSchema = defineSchema<PlannedGame>(
  { mode: { type: ObjectId, ref: "GameMode", default: null }, map: { type: ObjectId, ref: "GameMap", default: null } },
  { _id: false },
);

export interface TournamentDoc {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  description: string;
  startsAt: Date | null;
  maxTeams: number;
  teamSize: number;
  format: (typeof TOURNAMENT_FORMATS)[number];
  defaultBestOf: number;
  bestOfByRound: number[];
  roundDurationMinutes: number;
  status: TournamentStatus;
  rules: string;
  posterUrl: string;
  mapPool: Types.ObjectId[];
  roundPlans: PlannedGame[][];
  totalRounds: number;
  bracketGeneratedAt: Date | null;
  championTeam: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const tournamentSchema = defineSchema<TournamentDoc>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startsAt: { type: Date, default: null },
    maxTeams: { type: Number, default: 16, min: 2, max: 128 },
    teamSize: { type: Number, default: 3 },
    format: { type: String, enum: TOURNAMENT_FORMATS, default: "single_elimination" },
    defaultBestOf: { type: Number, default: 3 },
    /** BO por ronda (índice 0 = ronda 1). Vacío → defaultBestOf. */
    bestOfByRound: { type: [Number], default: [] },
    /** Tiempo estimado por serie, para mostrar horarios. */
    roundDurationMinutes: { type: Number, default: 30 },
    status: { type: String, enum: TOURNAMENT_STATUSES, default: "draft" },
    rules: { type: String, default: "" },
    /** Afiche del torneo (URL o ruta como /img/afiche-pixel.webp). */
    posterUrl: { type: String, default: "" },
    mapPool: [{ type: ObjectId, ref: "GameMap" }],
    /** Plan de modo/mapa por ronda: roundPlans[i] = games de la ronda i+1. */
    roundPlans: { type: [[plannedGameSchema]], default: [] },
    totalRounds: { type: Number, default: 0 },
    bracketGeneratedAt: { type: Date, default: null },
    championTeam: { type: ObjectId, ref: "Team", default: null },
  },
  { timestamps: true },
);
export const Tournament = getModel<TournamentDoc>("Tournament", tournamentSchema);

/* ─────────────────────────── Equipos (inscripciones) ─────────────────────────── */

export const REGISTRATION_STATUSES = ["pending", "needs_changes", "approved", "rejected", "withdrawn"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

/** Estado dentro de la competición (solo aplica a equipos aprobados). */
export const COMPETITION_STATUSES = ["registered", "active", "eliminated", "disqualified", "champion"] as const;
export type CompetitionStatus = (typeof COMPETITION_STATUSES)[number];

export const MEMBER_ROLES = ["captain", "player", "sub"] as const;

export interface Member {
  name: string;
  tag: string;
  role: (typeof MEMBER_ROLES)[number];
  /** true = estudiante de la FICCT, false = de otra facultad, null = sin dato. */
  ficct: boolean | null;
}

const memberSchema = defineSchema<Member>(
  {
    name: { type: String, required: true, trim: true },
    tag: { type: String, default: "", uppercase: true, trim: true },
    role: { type: String, enum: MEMBER_ROLES, default: "player" },
    ficct: { type: Boolean, default: null },
  },
  { _id: false },
);

export interface TeamDoc {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  name: string;
  slug: string;
  color: string;
  hasLogo: boolean;
  captainContact: string;
  members: Member[];
  registrationStatus: RegistrationStatus;
  competitionStatus: CompetitionStatus;
  seed: number | null;
  adminNote: string;
  /** Control del día del torneo: pagó la entrada / mostró los carnets. */
  paid: boolean;
  idsChecked: boolean;
  editTokenHash: string;
  /** Código corto que el capitán usa para entrar a la sala de su partida. */
  accessCode: string;
  ipHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = defineSchema<TeamDoc>(
  {
    tournament: { type: ObjectId, ref: "Tournament", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    color: { type: String, default: "#3b82f6" },
    hasLogo: { type: Boolean, default: false },
    captainContact: { type: String, default: "" },
    members: { type: [memberSchema], default: [] },
    registrationStatus: { type: String, enum: REGISTRATION_STATUSES, default: "pending" },
    competitionStatus: { type: String, enum: COMPETITION_STATUSES, default: "registered" },
    seed: { type: Number, default: null },
    adminNote: { type: String, default: "" },
    paid: { type: Boolean, default: false },
    idsChecked: { type: Boolean, default: false },
    editTokenHash: { type: String, required: true, index: true },
    accessCode: { type: String, default: "" },
    ipHash: { type: String, default: "" },
  },
  { timestamps: true },
);
teamSchema.index({ tournament: 1, slug: 1 }, { unique: true });
export const Team = getModel<TeamDoc>("Team", teamSchema);

/** Logo guardado aparte para no inflar las consultas de equipos. */
export interface TeamLogoDoc {
  _id: Types.ObjectId;
  team: Types.ObjectId;
  data: Buffer;
  contentType: string;
  updatedAt: Date;
}

const teamLogoSchema = defineSchema<TeamLogoDoc>({
  team: { type: ObjectId, ref: "Team", required: true, unique: true },
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});
export const TeamLogo = getModel<TeamLogoDoc>("TeamLogo", teamLogoSchema);

/* ─────────────────────────── Series (enfrentamientos) y games ─────────────────────────── */

export const SERIES_STATUSES = [
  "waiting",
  "pending",
  "live",
  "awaiting_result",
  "disputed",
  "finished",
  "cancelled",
] as const;

export type SlotValue = "A" | "B" | null;

export interface GameDoc {
  number: number;
  mode: Types.ObjectId | null;
  map: Types.ObjectId | null;
  status: "pending" | "finished" | "skipped";
  winnerSlot: SlotValue;
}

const gameSchema = defineSchema<GameDoc>(
  {
    number: { type: Number, required: true },
    mode: { type: ObjectId, ref: "GameMode", default: null },
    map: { type: ObjectId, ref: "GameMap", default: null },
    status: { type: String, enum: ["pending", "finished", "skipped"], default: "pending" },
    winnerSlot: { type: String, enum: ["A", "B", null], default: null },
  },
  { _id: false },
);

/**
 * Una serie es un enfrentamiento A vs B (BO1/BO3/BO5). Cada game (mapa individual) va embebido:
 * así registrar un game y recalcular el marcador es una sola escritura atómica.
 */
export interface ReportDoc {
  game: number;
  team: Types.ObjectId;
  winnerSlot: "A" | "B";
  createdAt: Date;
}

const reportSchema = defineSchema<ReportDoc>(
  {
    game: { type: Number, required: true },
    team: { type: ObjectId, ref: "Team", required: true },
    winnerSlot: { type: String, enum: ["A", "B"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

export interface SeriesDoc {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  key: string;
  number: number;
  round: number;
  position: number;
  teamA: Types.ObjectId | null;
  teamB: Types.ObjectId | null;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  winnerSlot: SlotValue;
  status: (typeof SERIES_STATUSES)[number];
  isBye: boolean;
  walkover: boolean;
  nextKey: string | null;
  nextSlot: SlotValue;
  games: GameDoc[];
  /** Resultados reportados por los equipos; el árbitro los confirma. */
  reports: ReportDoc[];
  scheduledAt: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const seriesSchema = defineSchema<SeriesDoc>(
  {
    tournament: { type: ObjectId, ref: "Tournament", required: true },
    key: { type: String, required: true },
    number: { type: Number, required: true },
    round: { type: Number, required: true },
    position: { type: Number, required: true },
    teamA: { type: ObjectId, ref: "Team", default: null },
    teamB: { type: ObjectId, ref: "Team", default: null },
    bestOf: { type: Number, required: true },
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },
    winnerSlot: { type: String, enum: ["A", "B", null], default: null },
    status: { type: String, enum: SERIES_STATUSES, default: "waiting" },
    isBye: { type: Boolean, default: false },
    walkover: { type: Boolean, default: false },
    nextKey: { type: String, default: null },
    nextSlot: { type: String, enum: ["A", "B", null], default: null },
    games: { type: [gameSchema], default: [] },
    reports: { type: [reportSchema], default: [] },
    scheduledAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);
seriesSchema.index({ tournament: 1, key: 1 }, { unique: true });
seriesSchema.index({ tournament: 1, round: 1, position: 1 });
export const Series = getModel<SeriesDoc>("Series", seriesSchema);

/* ─────────────────────────── Eventos (historial, auditoría y notificaciones) ─────────────────────────── */

export const EVENT_TYPES = [
  "tournament_updated",
  "registration_submitted",
  "registration_reviewed",
  "bracket_generated",
  "bracket_reset",
  "series_updated",
  "series_live",
  "game_reported",
  "team_advanced",
  "team_eliminated",
  "champion",
  "result_corrected",
] as const;

export interface EventDoc {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  type: (typeof EVENT_TYPES)[number];
  message: string;
  public: boolean;
  actor: Types.ObjectId | null;
  series: Types.ObjectId | null;
  createdAt: Date;
}

const eventSchema = defineSchema<EventDoc>({
  tournament: { type: ObjectId, ref: "Tournament", required: true },
  type: { type: String, enum: EVENT_TYPES, required: true },
  message: { type: String, required: true },
  /** Eventos públicos se muestran a los jugadores; los privados solo en el panel. */
  public: { type: Boolean, default: true },
  actor: { type: ObjectId, ref: "User", default: null },
  series: { type: ObjectId, ref: "Series", default: null },
  createdAt: { type: Date, default: Date.now },
});
eventSchema.index({ tournament: 1, createdAt: -1 });
export const TournamentEvent = getModel<EventDoc>("TournamentEvent", eventSchema);

/* ─────────────────────────── Sala de partida (chat entre rivales y árbitro) ─────────────────────────── */

export interface ChatMessageDoc {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  series: Types.ObjectId;
  authorType: "team" | "staff" | "system";
  team: Types.ObjectId | null;
  authorName: string;
  text: string;
  hasImage: boolean;
  image: { data: Buffer; contentType: string } | null;
  createdAt: Date;
}

const chatMessageSchema = defineSchema<ChatMessageDoc>({
  tournament: { type: ObjectId, ref: "Tournament", required: true },
  series: { type: ObjectId, ref: "Series", required: true },
  authorType: { type: String, enum: ["team", "staff", "system"], required: true },
  team: { type: ObjectId, ref: "Team", default: null },
  authorName: { type: String, required: true },
  text: { type: String, default: "" },
  hasImage: { type: Boolean, default: false },
  image: { type: { data: Buffer, contentType: String }, default: null },
  createdAt: { type: Date, default: Date.now },
});
chatMessageSchema.index({ series: 1, createdAt: 1 });
export const ChatMessage = getModel<ChatMessageDoc>("ChatMessage", chatMessageSchema);
