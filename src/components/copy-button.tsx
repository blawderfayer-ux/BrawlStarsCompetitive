"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Copia un texto al portapapeles. `{origin}` se reemplaza por la dirección del sitio. */
export function CopyButton({ text, label = "Copiar", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={cn("btn btn-ghost btn-sm", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text.replaceAll("{origin}", window.location.origin));
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? <Check size={15} /> : <Copy size={15} />} {done ? "Copiado" : label}
    </button>
  );
}
