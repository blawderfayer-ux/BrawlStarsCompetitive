"use client";

import { useActionState, useId, useRef, useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { PendingProvider, SubmitButton, useActionSubmit } from "./action-form";
import type { MemberView } from "@/lib/views";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];

export interface RegistrationDefaults {
  teamName: string;
  color: string;
  captainContact: string;
  members: MemberView[];
  logoUrl: string | null;
}

/** Reduce el logo a 256×256 WEBP en el celular antes de subirlo (rápido y liviano). */
async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) return file;
  return new File([blob], "logo.webp", { type: "image/webp" });
}

function PlayerFields({
  uid,
  prefix,
  title,
  optional,
  tagRequired,
  defaults,
}: {
  uid: string;
  tagRequired?: boolean;
  prefix: string;
  title: string;
  optional?: boolean;
  defaults?: MemberView;
}) {
  return (
    <fieldset className="card p-4">
      <legend className="sr-only">{title}</legend>
      <p className="mb-3 font-extrabold">
        {title} {optional ? <span className="text-xs font-bold text-muted">(opcional)</span> : null}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${uid}${prefix}Name`}>
            Nombre en el juego
          </label>
          <input
            id={`${uid}${prefix}Name`}
            name={`${prefix}Name`}
            className="input"
            required={!optional}
            maxLength={40}
            autoComplete="off"
            defaultValue={defaults?.name}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}${prefix}Tag`}>
            ID / Tag del jugador {tagRequired ? null : <span className="text-xs font-bold">(opcional)</span>}
          </label>
          <input
            id={`${uid}${prefix}Tag`}
            name={`${prefix}Tag`}
            className="input font-mono uppercase"
            placeholder="#2PP0Y8Q"
            required={!optional && tagRequired}
            maxLength={14}
            autoComplete="off"
            autoCapitalize="characters"
            defaultValue={defaults?.tag}
          />
        </div>
      </div>
    </fieldset>
  );
}

export function RegistrationForm({
  action,
  hidden,
  teamSize,
  defaults,
  submitLabel = "Enviar inscripción",
  onSuccess,
  admin = false,
}: {
  action: (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;
  hidden: Record<string, string>;
  teamSize: number;
  defaults?: RegistrationDefaults;
  submitLabel?: string;
  onSuccess?: (result: ActionResult) => React.ReactNode;
  /** Desde el panel: jugadores 2..n y contacto opcionales (equipos incompletos o importados). */
  admin?: boolean;
}) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(defaults?.logoUrl ?? null);
  const [color, setColor] = useState(defaults?.color ?? COLORS[0]);
  const logoInput = useRef<HTMLInputElement>(null);
  const uid = useId();

  const [state, formAction, pending] = useActionState(action, null);
  const onSubmit = useActionSubmit(formAction, {
    prepare: (form) => {
      form.delete("logo");
      if (logoFile) form.set("logo", logoFile);
    },
  });

  if (state?.ok && onSuccess) return <>{onSuccess(state)}</>;

  const captain = defaults?.members.find((m) => m.role === "captain");
  const players = defaults?.members.filter((m) => m.role === "player") ?? [];
  const sub = defaults?.members.find((m) => m.role === "sub");

  return (
    <PendingProvider pending={pending}>
      <form onSubmit={onSubmit} className="space-y-4">
        {Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input type="hidden" name="teamSize" value={teamSize} />
        <input type="hidden" name="color" value={color} />
        {/* Trampa anti-bots: invisible para personas */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <section className="card space-y-4 p-4">
          <div>
            <label className="label" htmlFor={`${uid}teamName`}>
              Nombre del equipo
            </label>
            <input
              id={`${uid}teamName`}
              name="teamName"
              className="input text-lg font-extrabold"
              required
              minLength={2}
              maxLength={32}
              defaultValue={defaults?.teamName}
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-bg-soft text-3xl"
              style={preview ? undefined : { background: `${color}33` }}
              aria-label="Subir logo del equipo"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                "🛡️"
              )}
            </button>
            <div className="min-w-0">
              <p className="font-extrabold">Logo del equipo</p>
              <p className="text-xs text-muted">Opcional. Toca el escudo para elegir una imagen.</p>
              <input
                ref={logoInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const small = await shrinkImage(f);
                    setLogoFile(small);
                    setPreview(URL.createObjectURL(small));
                  } catch {
                    setLogoFile(f);
                    setPreview(URL.createObjectURL(f));
                  }
                }}
              />
            </div>
          </div>

          <div>
            <span className="label">Color del equipo</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-10 w-10 rounded-xl border-2"
                  style={{ background: c, borderColor: c === color ? "white" : "transparent" }}
                  aria-label={`Color ${c}`}
                  aria-pressed={c === color}
                />
              ))}
            </div>
          </div>
        </section>

        <PlayerFields uid={uid} prefix="captain" title="👑 Capitán (jugador 1)" defaults={captain} />
        {Array.from({ length: teamSize - 1 }, (_, i) => (
          <PlayerFields
            key={i}
            uid={uid}
            prefix={`player${i + 2}`}
            title={`👤 Jugador ${i + 2}`}
            optional={admin}
            defaults={players[i]}
          />
        ))}
        <PlayerFields uid={uid} prefix="sub" title="🔁 Suplente" optional defaults={sub} />

        <section className="card p-4">
          <label className="label" htmlFor={`${uid}captainContact`}>
            Contacto del capitán
          </label>
          <input
            id={`${uid}captainContact`}
            name="captainContact"
            className="input"
            placeholder="WhatsApp, Discord o email"
            required={!admin}
            maxLength={80}
            defaultValue={defaults?.captainContact}
          />
          <p className="mt-1 text-xs text-muted">Solo lo ve la organización.</p>
        </section>

        {state && !state.ok ? (
          <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-300">
            {state.error}
          </p>
        ) : null}
        {state?.ok && state.message ? (
          <p role="status" className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-300">
            {state.message}
          </p>
        ) : null}

        <SubmitButton className="btn-primary w-full text-lg" pendingText="Enviando…">
          {submitLabel}
        </SubmitButton>
      </form>
    </PendingProvider>
  );
}
