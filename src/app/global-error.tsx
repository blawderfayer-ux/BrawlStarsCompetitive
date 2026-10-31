"use client";

/** Último recurso: si falla hasta el diseño general del sitio. Sin estilos externos a propósito. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#07090f", color: "#f3f5fa", fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center" }}>
        <div style={{ maxWidth: 420 }}>
          <p style={{ color: "#ffcd1c", fontWeight: 800, letterSpacing: "0.2em", fontSize: 12 }}>TORNEOS UAGRM</p>
          <h1 style={{ fontSize: 28, margin: "8px 0" }}>No pudimos cargar la página</h1>
          <p style={{ opacity: 0.75, fontSize: 14 }}>Puede ser un problema momentáneo con la base de datos. Intenta de nuevo en unos segundos.</p>
          <button type="button" onClick={reset} style={{ marginTop: 20, padding: "12px 20px", borderRadius: 10, border: 0, background: "#ffcd1c", color: "#141000", fontWeight: 800, cursor: "pointer" }}>
            Reintentar
          </button>
          <p style={{ marginTop: 28, fontSize: 12, opacity: 0.6 }}>
            Organizadores: abran <a href="/api/salud" style={{ color: "inherit" }}>/api/salud</a> para ver el diagnóstico{error.digest ? ` (código ${error.digest})` : ""}.
          </p>
        </div>
      </body>
    </html>
  );
}
