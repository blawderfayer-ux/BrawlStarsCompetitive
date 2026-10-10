import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_OG_IMAGE, siteUrl } from "@/lib/site";
import { getTeamSession } from "@/lib/team-session";
import "./globals.css";

// Todas las páginas leen datos en vivo de MongoDB.
export const dynamic = "force-dynamic";

const display = Lilita_One({ variable: "--font-display", weight: "400", subsets: ["latin"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"], weight: ["600", "700", "800", "900"] });

const SITE_NAME = "Torneos UAGRM";
const DESCRIPTION = "Torneos 3v3 de Brawl Stars en la UAGRM: inscripción, bracket, tu partida y resultados en vivo desde el celular.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_BO",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE] },
};

export const viewport: Viewport = {
  themeColor: "#0a0f2e",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Si el jugador ya entró con el código de su equipo, el botón "Mi equipo" queda siempre a mano.
  const team = await getTeamSession();
  return (
    <html lang="es" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans font-semibold">
        <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-[#0b1340]/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <Image
                src="/img/skull.webp"
                alt=""
                width={34}
                height={34}
                priority
                className="rounded-lg border-2 border-ink shadow-[0_2px_0_var(--ink)]"
              />
              <span className="title-ink whitespace-nowrap text-lg leading-none text-brand sm:text-xl">TORNEOS UAGRM</span>
            </Link>
            <nav className="flex items-center gap-3 sm:gap-4">
              {team ? (
                <Link
                  href={`/torneos/${team.tournamentSlug}/mi-equipo`}
                  className="font-display whitespace-nowrap rounded-lg border-2 border-ink bg-brand px-2 py-1 text-sm uppercase text-brand-ink shadow-[0_2px_0_var(--ink)]"
                >
                  Mi equipo
                </Link>
              ) : null}
              <Link
                href="/como-jugar"
                className={team ? "font-display hidden text-base uppercase text-muted min-[400px]:inline" : "font-display text-sm uppercase text-muted sm:text-base"}
              >
                Ayuda
              </Link>
              <Link href="/torneos" className={team ? "font-display hidden text-base uppercase text-muted sm:inline" : "font-display text-base uppercase text-muted"}>
                Torneos
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mt-10 border-t-[3px] border-ink bg-[#070b24]">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs font-semibold text-muted">
            <p>
              This material is unofficial and is not endorsed by Supercell. For more information see{" "}
              <a href="https://supercell.com/en/fan-content-policy/" className="underline" target="_blank" rel="noreferrer">
                Supercell&apos;s Fan Content Policy
              </a>
              .
            </p>
            <p className="mt-1">Plataforma independiente de organización de torneos.</p>
            <p className="mt-3">
              <Link href="/admin" className="underline underline-offset-2">
                Acceso organizadores
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
