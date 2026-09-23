"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Vuelve a pedir los datos de la página cada `seconds` mientras la pestaña está visible.
 * Es la forma más simple de tener el bracket "en vivo" sin websockets.
 */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);
  return null;
}

interface Toast {
  id: string;
  message: string;
}

/**
 * Notificaciones visuales: consulta los eventos nuevos del torneo y los muestra como avisos
 * ("¡Team Alpha avanza a semifinales!"). Más adelante se puede reemplazar por push.
 */
export function EventToasts({ slug, seconds = 12 }: { slug: string; seconds?: number }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const since = useRef<string>(new Date().toISOString());

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/torneos/${slug}/eventos?after=${encodeURIComponent(since.current)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: { events: { id: string; message: string; createdAt: string }[] } = await res.json();
        if (!alive || data.events.length === 0) return;
        since.current = data.events[0].createdAt;
        const fresh = data.events.slice(0, 3).reverse();
        setToasts((t) => [...t, ...fresh.map((e) => ({ id: e.id, message: e.message }))].slice(-3));
        for (const e of fresh) {
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== e.id)), 7000);
        }
      } catch {
        // sin conexión: se reintenta en el próximo ciclo
      }
    };
    const id = setInterval(poll, seconds * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug, seconds]);

  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
          className="toast pointer-events-auto w-full max-w-md rounded-2xl border border-brand/40 bg-card-hi px-4 py-3 text-left text-sm font-extrabold shadow-2xl shadow-black/50"
        >
          🔔 {t.message}
        </button>
      ))}
    </div>
  );
}
