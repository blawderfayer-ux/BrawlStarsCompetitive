import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cómo jugar",
  description: "Paso a paso: inscribir a tu equipo, entrar con tu código a “Mi equipo”, hablar con tu rival y reportar el resultado.",
};

const STEPS = [
  ["Inscríbete", "Abre el torneo y toca INSCRIBIR MI EQUIPO. Pon el nombre del equipo y a los 3 jugadores (y un suplente si tienen). Revisa en las reglas del torneo si hay que pagar entrada."],
  ["Guarda tu enlace privado", "Al enviar la inscripción te sale un enlace privado: guárdalo. Ahí ves si aprobaron a tu equipo y, cuando lo aprueben, el CÓDIGO de tu equipo (6 letras). La organización también te lo manda por WhatsApp."],
  ["Entra a “Mi equipo”", "El día del torneo abre la página del torneo y toca MI EQUIPO (o el botón “Entrar como mi equipo” de tu enlace privado). Escribe el código una sola vez: el celular lo recuerda. Los 3 jugadores pueden usar el mismo código."],
  ["Abre la sala de tu partida", "En MI EQUIPO aparece tu rival, el modo y el mapa que les toca, y el botón amarillo ABRIR LA SALA DE MI PARTIDA. La sala solo la ven tu equipo, tu rival y el árbitro."],
  ["Creen la sala en el juego", "Pónganse de acuerdo en el chat: uno de los dos crea la sala en Brawl Stars (Jugar → Amistoso), elige el modo y mapa que dice la página y pasa el código o link de invitación. Con la cámara pueden mandar capturas."],
  ["Reporta el resultado", "Cuando termine el game, toquen GANAMOS o PERDIMOS. El árbitro lo confirma y el marcador cambia solo. Si es al mejor de 3, repitan con el siguiente mapa hasta que alguien gane 2."],
  ["Sigue avanzando", "Si ganan, pasan solos a la siguiente ronda. Vuelvan a MI EQUIPO: ahí aparece su nueva partida apenas se sepa su rival."],
];

export default function HowToPlayPage() {
  return (
    <Container className="max-w-xl space-y-6 py-6">
      <div>
        <span className="tag-skew text-sm">
          <span>Tutorial</span>
        </span>
        <h1 className="title-ink mt-2 text-4xl leading-none">Cómo jugar el torneo</h1>
        <p className="mt-2 text-sm text-muted">
          Lo más importante: el <b className="text-text">código de tu equipo</b>. Con él entras a{" "}
          <b className="text-text">Mi equipo</b> y ahí está todo: tu partida, tu rival, el chat y los botones para reportar.
        </p>
      </div>

      <div className="card overflow-hidden">
        <video
          src="/tutorial.mp4?v=3"
          poster="/img/tutorial-poster.jpg?v=3"
          controls
          playsInline
          preload="metadata"
          className="mx-auto max-h-[80vh] w-full bg-black"
        />
      </div>

      <section>
        <SectionTitle>Paso a paso</SectionTitle>
        <ol className="space-y-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="card flex gap-3 p-4">
              <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-brand text-2xl text-brand-ink">
                {i + 1}
              </span>
              <div>
                <p className="font-display text-lg leading-tight">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-4 text-sm">
        <p className="font-display text-lg">¿Problemas?</p>
        <p className="mt-1 text-muted">
          Escribe al árbitro en el chat de tu partida. Si reportaron resultados distintos, manden una captura del
          resultado por el chat y el árbitro decide.
        </p>
      </section>

      <Link href="/torneos" className="btn btn-primary w-full">
        Ver torneos
      </Link>
    </Container>
  );
}
