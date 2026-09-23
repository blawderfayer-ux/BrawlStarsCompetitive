import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTournamentBySlugForAdmin } from "@/lib/queries";

export const loadAdminTournament = cache(async (slug: string) => {
  const data = await getTournamentBySlugForAdmin(slug);
  if (!data) notFound();
  return data;
});
