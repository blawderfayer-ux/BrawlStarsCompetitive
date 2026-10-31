/**
 * Reglamento base de los torneos, inspirado en las reglas del competitivo oficial
 * (Brawl Stars Championship): series al mejor de N, bans globales a ciegas, tolerancia de
 * 15 minutos y resultados con captura. La organización puede agregar sus reglas propias encima.
 */
export interface RuleSection {
  title: string;
  items: string[];
}

export function baseRulebook(opts: { bestOf: string; bansPerTeam: number; teamSize: number }): RuleSection[] {
  const sections: RuleSection[] = [
    {
      title: "Formato",
      items: [
        "Eliminación directa: quien pierde una partida queda eliminado y quien gana avanza solo en el bracket.",
        opts.bestOf.includes("→")
          ? `El formato de cada partida cambia por ronda: ${opts.bestOf}. Gana la partida el primer equipo que gana la mayoría de los mapas (por ejemplo, 2 en un BO3).`
          : `Cada partida es al mejor de ${opts.bestOf.replace("BO", "")} ${opts.bestOf === "BO1" ? "mapa" : "mapas"} (${opts.bestOf}). Gana la partida el primer equipo que gana la mayoría de los mapas.`,
        "El modo y el mapa de cada game son los que muestra la página. Se sortean del pool oficial del torneo y no se repite modo dentro de una partida.",
        "Si la cantidad de equipos no es potencia de 2, los mejores sembrados pasan directo a la segunda ronda (BYE).",
      ],
    },
    {
      title: "Equipos",
      items: [
        `${opts.teamSize} titulares y un suplente opcional. Cada jugador juega con su propia cuenta.`,
        "Un jugador solo puede estar en un equipo por torneo.",
        "El suplente puede entrar entre games, nunca a mitad de un game.",
      ],
    },
  ];
  if (opts.bansPerTeam > 0) {
    sections.push({
      title: "Bans",
      items: [
        `Antes del primer game, cada equipo prohíbe ${opts.bansPerTeam} brawler${opts.bansPerTeam > 1 ? "s" : ""} desde la sala de la partida.`,
        "Los bans son a ciegas: el rival no los ve hasta que los dos equipos enviaron los suyos.",
        "Valen para toda la partida (bans globales, como en el competitivo oficial). Si los dos equipos prohíben el mismo brawler, cuenta una sola vez.",
        "Usar un brawler prohibido hace perder ese game.",
      ],
    });
  }
  sections.push(
    {
      title: "Cómo se juega cada game",
      items: [
        "Uno de los dos equipos crea la sala en Brawl Stars (Jugar → Amistoso) con el modo y mapa del game y pasa el código o link por el chat de la sala.",
        "Para el siguiente game crea la sala el equipo que perdió el anterior.",
        "Se juega con la configuración normal del modo, sin modificadores.",
      ],
    },
    {
      title: "Puntualidad",
      items: [
        "Hay 15 minutos de tolerancia desde la hora de la partida. Pasado ese tiempo, el equipo que no se presentó pierde por walkover.",
        "Si un equipo deja de responder a mitad de una partida por más de 15 minutos, también pierde por walkover.",
      ],
    },
    {
      title: "Desconexiones",
      items: [
        "Si un jugador se desconecta, el game sigue: puede volver a entrar mientras dure.",
        "El game solo se repite si los dos equipos están de acuerdo o si el árbitro lo decide (por ejemplo, una caída del juego para todos).",
      ],
    },
    {
      title: "Resultados",
      items: [
        "Al terminar cada game, los dos equipos tocan GANAMOS o PERDIMOS en la sala y mandan una captura del resultado por el chat.",
        "El árbitro confirma el resultado. Si los reportes no coinciden, decide el árbitro con las capturas.",
      ],
    },
    {
      title: "Conducta",
      items: [
        "Respeto en el chat y en el juego. Nada de insultos, trampas, cuentas ajenas, bugs ni programas externos.",
        "Las faltas se sancionan con la pérdida del game, de la partida o la descalificación, según la gravedad.",
        "Ante cualquier duda, el árbitro tiene la última palabra.",
      ],
    },
  );
  return sections;
}
