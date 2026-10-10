"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";
import type { ActionResult } from "@/lib/action-result";
import { PendingProvider, SubmitButton, useActionSubmit } from "./action-form";
import { useMyTeam } from "./use-my-team";

type Action = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;

/**
 * Entrada única de los jugadores: escriben el código de 6 letras de su equipo y listo.
 * El código identifica al equipo, así que no hace falta elegirlo de una lista.
 */
export function TeamCodeLogin({
  action,
  slug,
  tournamentId,
  title = "Entra con el código de tu equipo",
  intro,
  goTo,
}: {
  action: Action;
  slug: string;
  tournamentId: string;
  title?: string;
  intro?: React.ReactNode;
  /** Página "Mi equipo" a la que se va después de entrar (si no, se recarga la página actual). */
  goTo?: string;
}) {
  const router = useRouter();
  const [, setMyTeam] = useMyTeam(slug);
  const [state, formAction, pending] = useActionState(action, null);
  const onSubmit = useActionSubmit(formAction);

  useEffect(() => {
    if (!state?.ok) return;
    if (typeof state.data === "string") setMyTeam(state.data);
    router.refresh();
  }, [state, router, setMyTeam]);

  return (
    <PendingProvider pending={pending}>
      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <KeyRound className="shrink-0 text-brand" />
          <p className="title-ink text-xl leading-tight">{title}</p>
        </div>
        {intro ? <div className="text-sm text-muted">{intro}</div> : null}
        <input type="hidden" name="tournamentId" value={tournamentId} />
        {goTo ? <input type="hidden" name="goTo" value={goTo} /> : null}
        <input
          name="code"
          required
          maxLength={10}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="characters"
          aria-label="Código de tu equipo"
          placeholder="Ej: K7M4QX"
          className="input text-center font-mono text-2xl uppercase tracking-[0.3em] placeholder:text-base placeholder:tracking-normal placeholder:normal-case placeholder:text-muted/50"
        />
        {state && !state.ok ? <p className="rounded-lg bg-red/20 px-3 py-2 text-sm font-bold text-red-200">{state.error}</p> : null}
        <SubmitButton className="btn-primary w-full" pendingText="Entrando…">
          Entrar
        </SubmitButton>
        <p className="text-xs text-muted">
          ¿No tienes el código? Está en el enlace privado que te salió al inscribirte, o pídeselo a la organización por
          WhatsApp. Cualquiera de los 3 jugadores puede entrar con el mismo código.
        </p>
      </form>
    </PendingProvider>
  );
}

/** "Salir": deja de usar el código de este equipo en este celular. */
export function TeamLogoutButton({ action, slug }: { action: () => Promise<void>; slug: string }) {
  const router = useRouter();
  const [, setMyTeam] = useMyTeam(slug);
  return (
    <button
      type="button"
      className="text-xs font-bold text-muted underline"
      onClick={() =>
        startTransition(async () => {
          await action();
          setMyTeam(null);
          router.refresh();
        })
      }
    >
      Salir
    </button>
  );
}

/** Recuerda el equipo en este navegador (para resaltarlo en el bracket). */
export function RememberTeam({ slug, teamId }: { slug: string; teamId: string }) {
  const [current, setMyTeam] = useMyTeam(slug);
  useEffect(() => {
    if (current !== teamId) setMyTeam(teamId);
  }, [current, teamId, setMyTeam]);
  return null;
}
