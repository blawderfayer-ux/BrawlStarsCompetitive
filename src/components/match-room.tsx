"use client";

import { Camera, LogOut, Send, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/action-result";
import { cn, formatTime } from "@/lib/utils";
import { PendingProvider, SubmitButton, useActionSubmit } from "./action-form";
import { useMyTeam } from "./use-my-team";

interface Message {
  id: string;
  authorType: "team" | "staff" | "system";
  teamId: string | null;
  authorName: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
}

interface RoomState {
  currentGame: number | null;
  reports: { teamId: string; winnerSlot: "A" | "B" }[];
  finished: boolean;
}

type Action = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;

/** Convierte los links en enlaces tocables (para pasar el link de invitación al equipo). */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="underline [overflow-wrap:anywhere]">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Reduce la foto en el celular (máx. 1280 px, JPG) antes de enviarla. */
async function shrinkPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
  return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
}

/* ─────────────── Entrar con el código del equipo ─────────────── */

export function TeamLogin({
  action,
  slug,
  tournamentId,
  teams,
}: {
  action: Action;
  slug: string;
  tournamentId: string;
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [, setMyTeam] = useMyTeam(slug);
  const [state, formAction, pending] = useActionState(action, null);
  const onSubmit = useActionSubmit(formAction);

  useEffect(() => {
    if (state?.ok) {
      if (typeof state.data === "string") setMyTeam(state.data);
      router.refresh();
    }
  }, [state, router, setMyTeam]);

  return (
    <PendingProvider pending={pending}>
      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-brand" />
          <p className="title-ink text-xl">Sala de la partida</p>
        </div>
        <p className="text-sm text-muted">
          ¿Juegas esta partida? Entra con el <b className="text-text">código de tu equipo</b> para chatear con tu rival,
          pasar el link del equipo y reportar el resultado. Te lo da la organización.
        </p>
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <div className="grid grid-cols-2 gap-2">
          {teams.map((t, i) => (
            <label
              key={t.id}
              className={cn(
                "font-display flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border-2 border-ink px-2 text-center text-sm has-[:checked]:ring-4 has-[:checked]:ring-brand",
                i === 0 ? "bg-blue/40" : "bg-red/40",
              )}
            >
              <input type="radio" name="teamId" value={t.id} className="sr-only" required />
              {t.name}
            </label>
          ))}
        </div>
        <input
          name="code"
          required
          maxLength={8}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="Código (ej. K7M4QX)"
          className="input text-center font-mono text-xl tracking-[0.3em] uppercase"
        />
        {state && !state.ok ? <p className="rounded-lg bg-red/20 px-3 py-2 text-sm font-bold text-red-200">{state.error}</p> : null}
        <SubmitButton className="btn-primary w-full" pendingText="Entrando…">
          Entrar a la sala
        </SubmitButton>
      </form>
    </PendingProvider>
  );
}

/* ─────────────── Sala: chat + reporte de resultado ─────────────── */

export function MatchRoom({
  seriesId,
  me,
  teamA,
  teamB,
  reportAction,
  logoutAction,
  initialGame,
  gameLabel,
}: {
  seriesId: string;
  me: { kind: "staff"; name: string } | { kind: "team"; slot: "A" | "B"; teamId: string; name: string };
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  reportAction: Action;
  logoutAction: () => Promise<void>;
  initialGame: number | null;
  gameLabel: ReactNode;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<RoomState>({ currentGame: initialGame, reports: [], finished: false });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastAt = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastGame = useRef(initialGame);

  const poll = useCallback(async () => {
    try {
      const qs = lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : "";
      const res = await fetch(`/api/sala/${seriesId}${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: RoomState & { messages: Message[] } = await res.json();
      if (data.messages.length) {
        lastAt.current = data.messages[data.messages.length - 1].createdAt;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
        });
      }
      setRoom({ currentGame: data.currentGame, reports: data.reports, finished: data.finished });
      // Si el árbitro confirmó un game, se actualiza el marcador de la página.
      if (data.currentGame !== lastGame.current) {
        lastGame.current = data.currentGame;
        router.refresh();
      }
    } catch {
      // sin conexión: se reintenta
    }
  }, [seriesId, router]);

  useEffect(() => {
    poll();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, 4000);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(image?: File) {
    if (!text.trim() && !image) return;
    setSending(true);
    setError(null);
    const form = new FormData();
    form.set("text", text);
    if (image) form.set("image", await shrinkPhoto(image).catch(() => image));
    const res = await fetch(`/api/sala/${seriesId}`, { method: "POST", body: form });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar.");
      return;
    }
    setText("");
    poll();
  }

  const [reportState, reportFormAction, reportPending] = useActionState(reportAction, null);
  const onReport = useActionSubmit(reportFormAction);
  useEffect(() => {
    if (reportState?.ok) poll();
  }, [reportState, poll]);

  const nameOf = (slot: "A" | "B") => (slot === "A" ? teamA.name : teamB.name);
  const myReport = me.kind === "team" ? room.reports.find((r) => r.teamId === me.teamId) : undefined;

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b-[2.5px] border-ink bg-card-hi px-4 py-2.5">
        <div className="min-w-0">
          <p className="title-ink text-lg leading-tight">Sala de la partida</p>
          <p className="truncate text-xs font-bold text-muted">
            {me.kind === "staff" ? `Árbitro · ${me.name}` : `Entraste como ${me.name}`} · solo la ven los dos equipos y el árbitro
          </p>
        </div>
        {me.kind === "team" ? (
          <button
            type="button"
            onClick={() => startTransition(async () => {
              await logoutAction();
              router.refresh();
            })}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-muted underline"
          >
            <LogOut size={14} /> Salir
          </button>
        ) : null}
      </div>

      {/* Reporte de resultado del game actual */}
      {me.kind === "team" && room.currentGame && !room.finished ? (
        <div className="border-b-[2.5px] border-ink bg-bg-soft p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted">
            Reportar game {room.currentGame} · {gameLabel}
          </p>
          {myReport ? (
            <p className="rounded-xl border-2 border-ink bg-card px-3 py-2 text-sm font-bold">
              Reportaste: ganó <span className="text-brand">{nameOf(myReport.winnerSlot)}</span>. Esperando al árbitro.
            </p>
          ) : null}
          <PendingProvider pending={reportPending}>
            <form onSubmit={onReport} className="mt-2 grid grid-cols-2 gap-2">
              <input type="hidden" name="seriesId" value={seriesId} />
              <input type="hidden" name="game" value={room.currentGame} />
              <SubmitButton name="outcome" value="win" className="btn-ok btn-sm" pendingText="…">
                Ganamos
              </SubmitButton>
              <SubmitButton name="outcome" value="loss" className="btn-danger btn-sm" pendingText="…">
                Perdimos
              </SubmitButton>
            </form>
          </PendingProvider>
          {reportState && !reportState.ok ? <p className="mt-2 text-sm font-bold text-red-300">{reportState.error}</p> : null}
        </div>
      ) : null}

      {me.kind === "staff" && room.reports.length ? (
        <div className="border-b-[2.5px] border-ink bg-bg-soft p-3 text-sm font-bold">
          {room.reports.map((r) => (
            <p key={r.teamId}>
              {r.teamId === teamA.id ? teamA.name : teamB.name} dice: ganó <span className="text-brand">{nameOf(r.winnerSlot)}</span>
            </p>
          ))}
          <p className="mt-1 text-xs text-muted">Confírmalo en el panel → Partidas.</p>
        </div>
      ) : null}

      <div ref={listRef} className="h-[360px] space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted">
            Todavía no hay mensajes. Pasa aquí el link de invitación de tu equipo o el código de sala.
          </p>
        ) : null}
        {messages.map((m) => {
          if (m.authorType === "system") {
            return (
              <p key={m.id} className="mx-auto max-w-[90%] rounded-lg bg-brand/15 px-3 py-1.5 text-center text-xs font-bold text-brand">
                {m.text}
              </p>
            );
          }
          const mine = me.kind === "team" ? m.teamId === me.teamId : m.authorType === "staff";
          const color = m.authorType === "staff" ? "bg-brand text-brand-ink" : m.teamId === teamA.id ? "bg-blue text-white" : "bg-red text-white";
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[82%] rounded-2xl border-2 border-ink px-3 py-2 shadow-[0_2px_0_var(--ink)]", color)}>
                <p className="text-[11px] font-black uppercase opacity-80">
                  {m.authorName} · {formatTime(m.createdAt)}
                </p>
                {m.imageUrl ? (
                  <a href={m.imageUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.imageUrl} alt="Foto enviada" className="mt-1 max-h-64 rounded-lg border-2 border-ink" />
                  </a>
                ) : null}
                {m.text ? (
                  <p className="text-sm font-bold whitespace-pre-line [overflow-wrap:anywhere]">
                    <Linkified text={m.text} />
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="flex items-end gap-2 border-t-[2.5px] border-ink bg-card-hi p-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn btn-ghost btn-sm !min-h-[44px] !px-3"
          aria-label="Enviar foto"
          disabled={sending}
        >
          <Camera size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) send(f);
          }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          maxLength={600}
          placeholder="Mensaje o link…"
          className="input !min-h-[44px] resize-none !py-2.5"
        />
        <button type="submit" className="btn btn-primary btn-sm !min-h-[44px] !px-3" aria-label="Enviar" disabled={sending}>
          <Send size={18} />
        </button>
      </form>
      {error ? <p className="bg-red/20 px-3 py-2 text-sm font-bold text-red-200">{error}</p> : null}
    </section>
  );
}
