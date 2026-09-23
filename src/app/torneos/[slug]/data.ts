import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTournamentData } from "@/lib/queries";

/** Una sola lectura por request, compartida entre el layout y la página. */
export const loadTournament = cache(async (slug: string) => {
  const data = await getTournamentData(slug);
  if (!data) notFound();
  return data;
});
