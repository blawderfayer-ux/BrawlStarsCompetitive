"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Si una página falla (por ejemplo, la base de datos no responde), se muestra esto en vez de una pantalla en blanco. */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-display text-xs uppercase tracking-[0.2em] text-brand">Error del servidor</p>
      <h1 className="font-display mt-2 text-4xl uppercase">No pudimos cargar esta página</h1>
      <p className="mt-3 text-sm text-muted">
        Puede ser un problema momentáneo con la base de datos. Vuelve a intentar en unos segundos.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">
          Reintentar
        </button>
        <Link href="/" className="btn btn-ghost">
          Ir al inicio
        </Link>
      </div>
      <p className="mt-8 text-xs text-muted">
        ¿Eres organizador? Abre{" "}
        <a href="/api/salud" className="underline">
          /api/salud
        </a>{" "}
        para ver qué está fallando{error.digest ? ` (código ${error.digest})` : ""}.
      </p>
    </div>
  );
}
