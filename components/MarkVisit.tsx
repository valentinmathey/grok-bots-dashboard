"use client";

import { useEffect } from "react";
import { LAST_SEEN_COOKIE, VISIT_COOKIE } from "@/lib/last-seen";

const YEAR = 400 * 86_400;

/** Guarda la visita en cookies cuando el Resumen ya se mostró. */
export function MarkVisit({ lastSeen, visitAt }: { lastSeen: string; visitAt: string }) {
  useEffect(() => {
    const attrs = `; path=/; max-age=${YEAR}; samesite=lax`;
    document.cookie = `${LAST_SEEN_COOKIE}=${encodeURIComponent(lastSeen)}${attrs}`;
    document.cookie = `${VISIT_COOKIE}=${encodeURIComponent(visitAt)}${attrs}`;
  }, [lastSeen, visitAt]);
  return null;
}
