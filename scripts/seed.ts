/**
 * Prepara la base de datos:
 *   1. Carga los modos y mapas del BSC 2026 (no duplica si ya existen).
 *   2. Crea el primer administrador si se pasan ADMIN_EMAIL y ADMIN_PASSWORD.
 *
 * Uso:  ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD=unaClaveSegura ADMIN_NAME="Tu nombre" npm run seed
 */
import mongoose from "mongoose";
import { seedCatalog, createStaffUser } from "../src/lib/services/catalog";
import { User } from "../src/models";

async function main() {
  const { modes, maps } = await seedCatalog();
  console.log(`✔ Catálogo: ${modes} modos y ${maps} mapas nuevos.`);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (await User.exists({ email: email.toLowerCase() })) {
      console.log(`ℹ El usuario ${email} ya existe; no se modificó.`);
    } else {
      await createStaffUser({ email, password, name: process.env.ADMIN_NAME || "Administrador", role: "admin" });
      console.log(`✔ Administrador creado: ${email}`);
    }
  } else {
    console.log("ℹ Para crear el primer admin define ADMIN_EMAIL y ADMIN_PASSWORD.");
  }
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("✖", err instanceof Error ? err.message : err);
  await mongoose.disconnect();
  process.exit(1);
});
