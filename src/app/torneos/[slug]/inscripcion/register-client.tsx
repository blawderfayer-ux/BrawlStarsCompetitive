"use client";

import { Hourglass } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RegistrationForm } from "@/components/registration-form";
import { registerTeamAction } from "../../actions";

function SuccessPanel({ token, slug }: { token: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/inscripcion/${token}` : `/inscripcion/${token}`;
  return (
    <div className="card pop-in space-y-4 p-5 text-center">
      <Hourglass size={44} className="mx-auto text-brand" />
      <p className="font-display text-2xl">¡Inscripción enviada!</p>
      <p className="text-sm">
        Estado: <span className="font-extrabold text-amber-300">PENDIENTE</span>. La organización revisará tu equipo.
      </p>
      <div className="rounded-2xl bg-bg-soft p-4 text-left">
        <p className="text-sm font-extrabold">Guarda este enlace privado</p>
        <p className="mb-2 text-xs text-muted">
          Con él puedes ver el estado de tu inscripción y corregirla si te lo piden. No lo compartas.
        </p>
        <p className="break-all rounded-lg bg-bg px-3 py-2 font-mono text-xs">{url}</p>
        <button
          type="button"
          className="btn btn-secondary btn-sm mt-3 w-full"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "✓ Copiado" : "Copiar enlace"}
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={`/inscripcion/${token}`} className="btn btn-primary">
          Ver mi inscripción
        </Link>
        <Link href={`/torneos/${slug}`} className="btn btn-ghost">
          Volver al torneo
        </Link>
      </div>
    </div>
  );
}

export function RegisterClient({ slug, teamSize }: { slug: string; teamSize: number }) {
  return (
    <RegistrationForm
      action={registerTeamAction}
      hidden={{ tournamentSlug: slug }}
      teamSize={teamSize}
      onSuccess={(r) =>
        r.ok ? <SuccessPanel token={(r.data as { token: string }).token} slug={slug} /> : null
      }
    />
  );
}
