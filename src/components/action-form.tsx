"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

type Action = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;

const PendingContext = createContext(false);

/**
 * Envía el formulario a la acción SIN el reseteo automático de React 19, para que si hay
 * un error (tag duplicado, contraseña incorrecta…) no se pierda lo que la persona escribió.
 */
export function useActionSubmit(
  dispatch: (form: FormData) => void,
  opts: { confirm?: string; prepare?: (form: FormData) => void } = {},
) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (opts.confirm && !window.confirm(opts.confirm)) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const form = new FormData(e.currentTarget, submitter);
    opts.prepare?.(form);
    startTransition(() => dispatch(form));
  };
}

/**
 * Formulario conectado a una server action: muestra "Guardando…", el error o el mensaje
 * de éxito, y opcionalmente pide confirmación antes de enviar.
 */
export function ActionForm({
  action,
  children,
  confirm,
  className,
  resetOnSuccess = false,
  showSuccess = true,
}: {
  action: Action;
  children: ReactNode;
  confirm?: string;
  className?: string;
  resetOnSuccess?: boolean;
  showSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const onSubmit = useActionSubmit(formAction, { confirm });

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <PendingContext.Provider value={pending}>
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {children}
        {state && !state.ok ? (
          <p role="alert" className="mt-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm font-bold text-red-300">
            {state.error}
          </p>
        ) : null}
        {state?.ok && state.message && showSuccess ? (
          <p role="status" className="mt-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-300">
            {state.message}
          </p>
        ) : null}
      </form>
    </PendingContext.Provider>
  );
}

export function PendingProvider({ pending, children }: { pending: boolean; children: ReactNode }) {
  return <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>;
}

export function SubmitButton({
  children,
  className,
  pendingText = "Guardando…",
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
}) {
  const status = useFormStatus();
  const pending = useContext(PendingContext) || status.pending;
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={cn("btn", className ?? "btn-primary")}>
      {pending ? pendingText : children}
    </button>
  );
}
