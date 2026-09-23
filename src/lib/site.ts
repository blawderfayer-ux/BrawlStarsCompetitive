/** URL pública del sitio (para vistas previas en WhatsApp/redes, que necesitan links absolutos). */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Vercel define esta variable con el dominio de producción (ej. mi-sitio.vercel.app).
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const DEFAULT_OG_IMAGE = "/img/og-default.jpg";

/**
 * Imagen para la vista previa del link de un torneo. WhatsApp necesita JPG/PNG horizontal:
 * los afiches que conocemos tienen su versión recortada; si el afiche ya es JPG/PNG se usa tal cual.
 */
const OG_FOR_POSTER: Record<string, string> = {
  "/img/afiche-pixel.webp": "/img/og-pixel.jpg",
};

export function ogImageFor(posterUrl: string | null | undefined) {
  if (!posterUrl) return DEFAULT_OG_IMAGE;
  if (OG_FOR_POSTER[posterUrl]) return OG_FOR_POSTER[posterUrl];
  if (/\.(jpe?g|png)(\?.*)?$/i.test(posterUrl)) return posterUrl;
  return DEFAULT_OG_IMAGE;
}
