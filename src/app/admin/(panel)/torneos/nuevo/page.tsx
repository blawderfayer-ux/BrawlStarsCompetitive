import { TournamentForm } from "@/components/admin/tournament-form";
import { requireStaffPage } from "@/lib/auth";
import { createTournamentAction } from "@/app/admin/actions";

export default async function NewTournamentPage() {
  await requireStaffPage(["admin"]);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-1 text-2xl">Nuevo torneo</h1>
      <p className="mb-4 text-sm text-muted">Se crea como borrador. Lo publicas al abrir las inscripciones.</p>
      <TournamentForm action={createTournamentAction} submitLabel="Crear torneo" />
    </div>
  );
}
