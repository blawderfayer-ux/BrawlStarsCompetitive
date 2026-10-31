import "server-only";

export interface DbProblem {
  /** Código corto para reconocer el caso. */
  code: string;
  /** Qué pasa, en palabras simples. */
  problem: string;
  /** Qué hacer para arreglarlo. */
  fix: string;
}

/** Traduce el error de conexión de MongoDB a un diagnóstico que el organizador pueda resolver. */
export function diagnoseDbError(err: unknown): DbProblem {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  if (/MONGODB_URI/.test(msg)) {
    return {
      code: "sin_uri",
      problem: "Vercel no tiene la variable MONGODB_URI.",
      fix: "Vercel → tu proyecto → Settings → Environment Variables: agrega MONGODB_URI con la dirección de Atlas y vuelve a desplegar (Deployments → ⋯ → Redeploy).",
    };
  }
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
    return {
      code: "cluster_no_encontrado",
      problem: "No se encuentra el clúster de MongoDB Atlas: la dirección no existe (el clúster se borró o la dirección está mal escrita).",
      fix: "Entra a cloud.mongodb.com → Database. Si el clúster ya no está, crea uno nuevo (M0 gratis), copia su dirección en Connect → Drivers y pégala en la variable MONGODB_URI de Vercel. Luego Redeploy.",
    };
  }
  if (/bad auth|authentication failed|auth.*failed/i.test(msg)) {
    return {
      code: "credenciales",
      problem: "MongoDB rechaza el usuario o la contraseña.",
      fix: "Atlas → Database Access: revisa el usuario o crea uno nuevo con contraseña sin símbolos raros, y actualiza MONGODB_URI en Vercel. Luego Redeploy.",
    };
  }
  if (/quota|space/i.test(msg)) {
    return {
      code: "sin_espacio",
      problem: "La base de datos gratuita se quedó sin espacio (512 MB).",
      fix: "Borra torneos de prueba viejos desde el panel o pasa el clúster a un plan con más espacio.",
    };
  }
  if (/ServerSelection|timed out|ETIMEDOUT|ECONNREFUSED|whitelist|not allowed|IP/i.test(msg)) {
    return {
      code: "sin_acceso",
      problem: "No se puede llegar al clúster: está pausado o Atlas no deja entrar a Vercel.",
      fix: "Atlas → Database: si el clúster dice PAUSED toca Resume. Luego Atlas → Network Access: debe existir la regla 0.0.0.0/0 (Allow access from anywhere), sin fecha de vencimiento.",
    };
  }
  return {
    code: "desconocido",
    problem: "Error al conectar con la base de datos.",
    fix: "Revisa en Vercel → tu proyecto → Logs el detalle del error y que MongoDB Atlas esté activo.",
  };
}

/** Solo el servidor del clúster (sin usuario ni contraseña) para mostrar en el diagnóstico. */
export function dbHost() {
  const uri = process.env.MONGODB_URI ?? "";
  const m = uri.match(/@([^/?]+)/) ?? uri.match(/^mongodb(?:\+srv)?:\/\/([^/?]+)/);
  return m ? m[1] : null;
}
