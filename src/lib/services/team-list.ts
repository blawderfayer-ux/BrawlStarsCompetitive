/** Tag de Brawl Stars: # seguido de letras/números (el juego usa 0289PYLQGRJCUV). Es opcional. */
export const TAG_RE = /^#?[0-9A-Z]{3,12}$/;

export function normalizeTag(raw: string) {
  const t = raw.trim().toUpperCase().replace(/\s+/g, "").replace(/O/g, "0");
  if (!t) return "";
  return t.startsWith("#") ? t : `#${t}`;
}

/**
 * Lee una lista pegada tal cual del WhatsApp:
 *   1.- Nombre del equipo
 *   -jugador 1
 *   -jugador 2 #TAG (el tag es opcional)
 * Las líneas que empiezan con -, •, * o · son jugadores; el resto son nombres de equipo.
 */
export function parseTeamList(text: string) {
  const teams: { name: string; players: { name: string; tag: string }[] }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[-•*·–—]/.test(line)) {
      if (!teams.length) continue;
      let name = line.replace(/^[-•*·–—.\s]+/, "").trim();
      const tagMatch = name.match(/\s(#[0-9A-Za-z]{3,12})$/);
      const tag = tagMatch ? normalizeTag(tagMatch[1]) : "";
      if (tagMatch) name = name.slice(0, -tagMatch[0].length).trim();
      if (name) teams[teams.length - 1].players.push({ name: name.slice(0, 40), tag: TAG_RE.test(tag) ? tag : "" });
    } else {
      const name = line.replace(/^\d+\s*(?:[.\-)–:]+\s*|\s+)/, "").trim();
      if (name) teams.push({ name: name.slice(0, 32), players: [] });
    }
  }
  // Títulos sueltos sin jugadores (p. ej. "Equipos de brawl") no son equipos.
  return teams.filter((team) => team.players.length > 0);
}
