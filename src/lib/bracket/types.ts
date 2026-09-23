export type Slot = "A" | "B";

export type SeriesStatus =
  | "waiting" // faltan uno o ambos equipos
  | "pending" // equipos definidos, aún no empieza
  | "live" // en curso
  | "awaiting_result" // se jugó, falta que el árbitro confirme
  | "disputed" // hay un reclamo abierto
  | "finished"
  | "cancelled";

export type GameStatus = "pending" | "finished" | "skipped";

export interface GamePlan {
  modeId: string | null;
  mapId: string | null;
}

export interface GameState extends GamePlan {
  number: number;
  status: GameStatus;
  winnerSlot: Slot | null;
}

/** Estado mínimo de una serie que necesita la lógica del bracket. */
export interface SeriesState {
  key: string;
  round: number;
  position: number;
  teamA: string | null;
  teamB: string | null;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  winnerSlot: Slot | null;
  status: SeriesStatus;
  isBye: boolean;
  walkover: boolean;
  nextKey: string | null;
  nextSlot: Slot | null;
  games: GameState[];
}
