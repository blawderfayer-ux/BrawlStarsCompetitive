import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { TOURNAMENT_STATUS } from "@/lib/labels";
import { cn, formatDateTime } from "@/lib/utils";
import type { TournamentView } from "@/lib/views";
import { StatusBadge } from "./ui";

/** Tarjeta de evento: imagen del torneo, estado, fecha, formato, equipos y premio. */
export function TournamentCard({ t, featured = false }: { t: TournamentView; featured?: boolean }) {
  return (
    <Link href={`/torneos/${t.slug}`} className="card group block overflow-hidden hover:border-muted/40">
      <div className={cn("relative isolate overflow-hidden border-b border-line", featured ? "h-44 sm:h-56" : "h-28")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.posterUrl || "/img/banner.webp"}
          alt=""
          loading="lazy"
          className={cn(
            "absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
            t.posterUrl ? "object-[50%_12%]" : "object-[50%_35%] opacity-70",
          )}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-card via-card/40 to-transparent" aria-hidden />
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge map={TOURNAMENT_STATUS} value={t.status} className="bg-bg/80 backdrop-blur" />
        </div>
      </div>
      <div className="p-4">
        <p className={cn("font-display uppercase leading-tight", featured ? "text-3xl" : "text-xl")}>{t.name}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {t.startsAt ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} /> {formatDateTime(t.startsAt)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} /> {t.approvedTeams}/{t.maxTeams} · BO{t.defaultBestOf}
          </span>
          {t.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> {t.location}
            </span>
          ) : null}
          {t.prize ? (
            <span className="inline-flex items-center gap-1.5 text-brand">
              <Trophy size={14} /> {t.prize}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
