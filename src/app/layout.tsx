import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_OG_IMAGE, siteUrl } from "@/lib/site";
import { getTeamSession } from "@/lib/team-session";
import "./globals.css";

// Todas las páginas leen datos en vivo de MongoDB.
export const dynamic = "force-dynamic";

const display = Barlow_Condensed({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });
const body = Barlow({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

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
  themeColor: "#07090f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Si el jugador ya entró con el código de su equipo, el botón "Mi equipo" queda siempre a mano.
  const team = await getTeamSession();
  return (
    <html lang="es" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans font-medium">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <Image src="/img/skull.webp" alt="" width={32} height={32} priority className="rounded-md" />
              <span className="font-display whitespace-nowrap text-xl leading-none tracking-wide">
                TORNEOS <span className="text-brand">UAGRM</span>
              </span>
            </Link>
            <nav className="font-display flex items-center gap-3 text-[15px] uppercase tracking-wide text-muted sm:gap-5">
              {team ? (
                <Link
                  href={`/torneos/${team.tournamentSlug}/mi-equipo`}
                  className="whitespace-nowrap rounded-md bg-brand px-2.5 py-1 text-brand-ink"
                >
                  Mi equipo
                </Link>
              ) : null}
              <Link href="/torneos" className={team ? "hidden hover:text-text min-[420px]:inline" : "hover:text-text"}>
                Torneos
              </Link>
              <Link href="/ranking" className={team ? "hidden hover:text-text sm:inline" : "hover:text-text"}>
                Ranking
              </Link>
              <Link href="/como-jugar" className="hidden hover:text-text sm:inline">
                Ayuda
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mt-12 border-t border-line bg-bg-soft">
          <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-xl tracking-wide">
                  TORNEOS <span className="text-brand">UAGRM</span>
                </p>
                <p className="mt-1 max-w-xs text-sm text-muted">Torneos 3v3 de Brawl Stars: inscripción, bracket, partidas y resultados en vivo.</p>
              </div>
              <nav className="font-display grid grid-cols-2 gap-x-8 gap-y-2 text-sm uppercase tracking-wide text-muted">
                <Link href="/torneos" className="hover:text-text">Torneos</Link>
                <Link href="/ranking" className="hover:text-text">Ranking</Link>
                <Link href="/como-jugar" className="hover:text-text">Cómo jugar</Link>
                <Link href="/admin" className="hover:text-text">Organizadores</Link>
              </nav>
            </div>
            <p className="mt-8 border-t border-line pt-4 text-xs text-muted">
              This material is unofficial and is not endorsed by Supercell. For more information see{" "}
              <a href="https://supercell.com/en/fan-content-policy/" className="underline" target="_blank" rel="noreferrer">
                Supercell&apos;s Fan Content Policy
              </a>
              . Plataforma independiente de organización de torneos.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
