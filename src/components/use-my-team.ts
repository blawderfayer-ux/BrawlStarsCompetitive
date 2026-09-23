"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "myteam-change";
const key = (slug: string) => `myteam:${slug}`;

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/**
 * "Mi equipo" guardado en el navegador (por torneo). Es solo una comodidad del visitante:
 * si el almacenamiento no está disponible, simplemente no se recuerda.
 */
export function useMyTeam(slug: string): [string | null, (id: string | null) => void] {
  const teamId = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key(slug));
      } catch {
        return null;
      }
    },
    () => null,
  );
  const setTeamId = useCallback(
    (id: string | null) => {
      try {
        if (id) localStorage.setItem(key(slug), id);
        else localStorage.removeItem(key(slug));
      } catch {
        // modo privado o almacenamiento bloqueado
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [slug],
  );
  return [teamId, setTeamId];
}
