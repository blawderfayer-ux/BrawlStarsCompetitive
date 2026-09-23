"use client";

import { useState, type ReactNode } from "react";

/** <details> que recuerda si está abierto aunque la página se vuelva a renderizar. */
export function Collapsible({
  summary,
  defaultOpen = false,
  className,
  children,
}: {
  summary: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className={className} open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      {summary}
      {children}
    </details>
  );
}
