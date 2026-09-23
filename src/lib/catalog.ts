/**
 * Catálogo de modos 3v3 y mapas (nombres como aparecen en el juego en español),
 * tomados de la rotación de amistosos / competitivo 2026.
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
    maps: ["Mina rocosa", "Arcade de cristal", "Cueva subterránea", "Avalancha rocosa", "Mina inundada", "Ángulo agudo"],
  },
  {
    slug: "balon-brawl",
    name: "Balón Brawl",
    icon: "⚽",
    color: "#3b82f6",
    description: "Anota 2 goles antes que el rival.",
    maps: ["Superplaya", "Campos furtivos", "Fútbol soleado", "Triple drible", "Cancha peleona", "Palco central"],
  },
  {
    slug: "atraco",
    name: "Atraco",
    icon: "💰",
    color: "#ef4444",
    description: "Destruye la caja fuerte rival o hazle más daño que el rival a la tuya.",
    maps: ["Patata caliente", "Refugio", "Cañón explosivo", "Aguas turbulentas", "Cementerio G. G.", "Tormenta eléctrica"],
  },
  {
    slug: "zona-restringida",
    name: "Zona Restringida",
    icon: "🔥",
    color: "#f97316",
    description: "Controla las zonas hasta llenar el 100%.",
    maps: ["Duelo de escarabajos", "Bahía dorada", "Gran control", "Al límite", "Campo abierto"],
  },
  {
    slug: "caza-estelar",
    name: "Caza Estelar",
    icon: "⭐",
    color: "#eab308",
    description: "Elimina rivales para sumar estrellas; gana quien tenga más al final.",
    maps: ["Tiroteo estelar", "Escondite", "Excel"],
  },
  {
    slug: "noqueo",
    name: "Noqueo",
    icon: "💀",
    color: "#22c55e",
    description: "Al mejor de 3 rondas: gana la ronda el equipo que elimine a los 3 rivales.",
    maps: ["Roca de Belle", "Islas diminutas", "Nueva perspectiva", "Cuatro niveles", "Punto perfecto", "Nuevos horizontes"],
  },
] as const;

/** Mapas del catálogo anterior (en inglés) → su nombre en el juego en español. */
export const MAP_RENAMES: Record<string, string> = {
  "Hard Rock Mine": "Mina rocosa",
  "Super Beach": "Superplaya",
  "Sneaky Fields": "Campos furtivos",
  "Hot Potato": "Patata caliente",
  "Safe Zone": "Refugio",
  "Dueling Beetles": "Duelo de escarabajos",
  "Shooting Star": "Tiroteo estelar",
  Hideout: "Escondite",
  "Belle's Rock": "Roca de Belle",
};

/** Mapas del catálogo anterior que ya no están en la rotación: se desactivan. */
export const RETIRED_MAPS = [
  "Double Swoosh",
  "Deathcap Trap",
  "Pinhole Punt",
  "Bridge Too Far",
  "Ring of Fire",
  "Open Business",
  "Layer Cake",
  "Goldarm Gulch",
  "Out in the Open",
];
