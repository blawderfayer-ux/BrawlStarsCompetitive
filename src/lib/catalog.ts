/**
 * Catálogo inicial de modos 3v3 y mapas: pool competitivo BSC 2026 (Summer Split).
 * Es solo el punto de partida: desde el panel se pueden agregar, renombrar o desactivar
 * modos y mapas cuando Supercell cambie la rotación.
 */
export const DEFAULT_MODES = [
  {
    slug: "atrapagemas",
    name: "Atrapagemas",
    icon: "💎",
    color: "#a855f7",
    description: "Junta 10 gemas y aguántalas 15 segundos para ganar.",
    maps: ["Hard Rock Mine", "Double Swoosh", "Deathcap Trap"],
  },
  {
    slug: "balon-brawl",
    name: "Balón Brawl",
    icon: "⚽",
    color: "#3b82f6",
    description: "Anota 2 goles antes que el rival.",
    maps: ["Super Beach", "Pinhole Punt", "Sneaky Fields"],
  },
  {
    slug: "atraco",
    name: "Atraco",
    icon: "💰",
    color: "#ef4444",
    description: "Destruye la caja fuerte rival o hazle más daño que el rival a la tuya.",
    maps: ["Hot Potato", "Safe Zone", "Bridge Too Far"],
  },
  {
    slug: "zona-restringida",
    name: "Zona Restringida",
    icon: "🔥",
    color: "#f97316",
    description: "Controla las zonas hasta llenar el 100%.",
    maps: ["Ring of Fire", "Open Business", "Dueling Beetles"],
  },
  {
    slug: "caza-estelar",
    name: "Caza Estelar",
    icon: "⭐",
    color: "#eab308",
    description: "Elimina rivales para sumar estrellas; gana quien tenga más al final.",
    maps: ["Shooting Star", "Hideout", "Layer Cake"],
  },
  {
    slug: "noqueo",
    name: "Noqueo",
    icon: "💀",
    color: "#22c55e",
    description: "Al mejor de 3 rondas: gana la ronda el equipo que elimine a los 3 rivales.",
    maps: ["Goldarm Gulch", "Belle's Rock", "Out in the Open"],
  },
] as const;
