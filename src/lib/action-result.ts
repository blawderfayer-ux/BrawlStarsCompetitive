import "server-only";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { AuthError } from "./auth";
import { UserError } from "./services/tx";

export type ActionResult<T = unknown> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/**
 * Ejecuta una acción del servidor y convierte los errores esperados en un mensaje
 * que el formulario puede mostrar. Los errores inesperados se registran y se ocultan.
 */
export async function runAction<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    // Las páginas son dinámicas: esto hace que el cliente vuelva a pedir los datos frescos.
    revalidatePath("/", "layout");
    return { ok: true, data, message };
  } catch (err) {
    if (err instanceof UserError || err instanceof AuthError) return { ok: false, error: err.message };
    if (err instanceof ZodError) return { ok: false, error: err.issues[0]?.message ?? "Datos inválidos." };
    console.error(err);
    return { ok: false, error: "Ocurrió un error inesperado. Intenta de nuevo." };
  }
}

export function str(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function num(form: FormData, key: string, fallback = 0) {
  const n = Number(str(form, key));
  return Number.isFinite(n) && str(form, key) !== "" ? n : fallback;
}

export function file(form: FormData, key: string): File | null {
  const v = form.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}
