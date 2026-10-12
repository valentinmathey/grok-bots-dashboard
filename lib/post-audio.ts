import type { Post } from "@/lib/types";

// Compartido entre server y client: no puede vivir en un módulo "use client".
export function postAudio(post?: Post | null): { url: string; duration: number | null } | null {
  const details = post?.details;
  if (!details || typeof details !== "object") return null;
  const url = (details as Record<string, unknown>).audio_url;
  if (typeof url !== "string" || !/^https?:\/\//.test(url)) return null;
  const d = (details as Record<string, unknown>).audio_duration_seconds;
  return { url, duration: typeof d === "number" && d > 0 ? d : null };
}
