import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// Todas las páginas leen datos en vivo de MongoDB.
export const dynamic = "force-dynamic";

const display = Lilita_One({ variable: "--font-display", weight: "400", subsets: ["latin"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Brawl Tournament", template: "%s · Brawl Tournament" },
  description: "Torneos 3v3 de Brawl Stars: equipos, bracket, partidas, mapas y resultados en vivo.",
};

export const viewport: Viewport = {
  themeColor: "#0c0a1d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="font-display flex items-center gap-2 text-lg text-brand">
              <span aria-hidden>🏆</span> BRAWL TOURNAMENT
            </Link>
            <Link href="/torneos" className="text-sm font-bold text-muted">
              Torneos
            </Link>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-muted">
          <p>Plataforma independiente de organización de torneos. No afiliada a Supercell.</p>
          <p className="mt-2">
            <Link href="/admin" className="underline underline-offset-2">
              Acceso organizadores
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
