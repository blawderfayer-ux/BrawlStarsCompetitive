import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cómo jugar",
  description: "Video y pasos: inscribirte, entrar a la sala de tu partida y reportar si ganaste o perdiste.",
  openGraph: { images: [{ url: "/img/og-pixel.jpg", width: 1200, height: 630 }] },
};

const STEPS = [
  ["Inscríbete", "Abre el link de inscripción del grupo, llena tu equipo (3 jugadores) y marca quién es de la FICCT. Si 2 de los 3 son de la FICCT no pagan; si no, la entrada es 10 Bs."],
  ["Guarda tu enlace privado", "Al enviar la inscripción te sale un enlace privado. Ahí ves si te aprobaron y, cuando te aprueben, el CÓDIGO de tu equipo (también te lo puede mandar la organización)."],
  ["Busca tu partida", "El día del torneo entra a la página del torneo → PARTIDAS (o BRACKET) y toca la partida donde está tu equipo. Ahí ves a tu rival y el modo y mapa oficial de cada game."],
  ["Entra a la sala", "Baja a SALA DE LA PARTIDA, toca tu equipo y escribe tu código de 6 letras. La sala solo la ven tu equipo, tu rival y el árbitro."],
  ["Chatea con tu rival", "Pasa el link de invitación de tu equipo o el código de sala. Con el botón de la cámara puedes mandar capturas."],
  ["Reporta el resultado", "Cuando termine cada game toca GANAMOS o PERDIMOS. El árbitro confirma y el marcador se actualiza solo. Si es BO3, repites hasta que alguien gane 2."],
  ["Sigue avanzando", "Si ganas la serie, tu equipo pasa solo a la siguiente ronda. Mira el BRACKET para ver tu próxima partida y repite desde el paso 3."],
];

export default function HowToPlayPage() {
  return (
    <Container className="max-w-xl space-y-6 py-6">
      <div>
        <span className="tag-skew text-sm">
          <span>Tutorial</span>
        </span>
        <h1 className="title-ink mt-2 text-4xl leading-none">Cómo jugar el torneo</h1>
        <p className="mt-2 text-sm text-muted">Inscríbete, entra a la sala de tu partida y reporta si ganaste o perdiste.</p>
      </div>

      <div className="card overflow-hidden">
        <video
          src="/tutorial.mp4?v=2"
          poster="/img/tutorial-poster.jpg?v=2"
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
              <span className="title-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-brand text-xl text-brand-ink">
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
