/**
 * Brawlers para sugerir al escribir los bans (lista de ayuda: se puede escribir cualquier nombre,
 * así los brawlers nuevos funcionan sin actualizar esto).
 */
export const BRAWLERS = [
  "8-Bit", "Alli", "Amber", "Angelo", "Ash", "Barley", "Bea", "Belle", "Berry", "Bibi", "Bo", "Bonnie", "Brock",
  "Bull", "Buster", "Buzz", "Byron", "Carl", "Charlie", "Chester", "Chuck", "Clancy", "Colette", "Colt",
  "Cordelius", "Crow", "Darryl", "Doug", "Draco", "Dynamike", "Edgar", "El Primo", "Emz", "Eve", "Fang",
  "Finx", "Frank", "Gale", "Gene", "Gigi", "Gray", "Griff", "Grom", "Gus", "Hank", "Jacky", "Jae-Yong", "Janet",
  "Jessie", "Juju", "Kaze", "Kenji", "Kit", "Larry & Lawrie", "Leon", "Lily", "Lola", "Lou", "Lumi", "Maisie",
  "Mandy", "Max", "Meeple", "Meg", "Melodie", "Mico", "Mina", "Moe", "Mortis", "Mr. P", "Nani", "Nita", "Ollie",
  "Otis", "Pam", "Pearl", "Penny", "Piper", "Poco", "R-T", "Rico", "Rosa", "Ruffs", "Sam", "Sandy", "Shade",
  "Shelly", "Spike", "Sprout", "Squeak", "Stu", "Surge", "Tara", "Tick", "Trunk", "Willow", "Ziggy",
];

/** Limpia lo que escribe el jugador: sin espacios de más, sin repetidos (sin importar mayúsculas). */
export function cleanBans(input: string[], count: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const name = raw.trim().replace(/\s+/g, " ").slice(0, 24);
    if (!name) continue;
    const known = BRAWLERS.find((b) => b.toLowerCase() === name.toLowerCase());
    const key = (known ?? name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(known ?? name);
  }
  if (out.length !== count) {
    throw new Error(count === 1 ? "Escribe 1 brawler." : `Escribe ${count} brawlers distintos.`);
  }
  return out;
}

/** Bans visibles: solo cuando los dos equipos enviaron los suyos (a ciegas, como en el competitivo). */
export function revealedBans(
  bans: { team: string; brawlers: string[] }[],
  teamA: string | null,
  teamB: string | null,
): { A: string[]; B: string[] } | null {
  const a = bans.find((b) => b.team === teamA);
  const b = bans.find((x) => x.team === teamB);
  return a && b ? { A: a.brawlers, B: b.brawlers } : null;
}
