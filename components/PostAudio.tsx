"use client";

import { useState } from "react";
import { Download, Headphones } from "lucide-react";
import type { Post } from "@/lib/types";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function postAudio(post?: Post | null): { url: string; duration: number | null } | null {
  const details = post?.details;
  if (!details || typeof details !== "object") return null;
  const url = (details as Record<string, unknown>).audio_url;
  if (typeof url !== "string" || !/^https?:\/\//.test(url)) return null;
  const d = (details as Record<string, unknown>).audio_duration_seconds;
  return { url, duration: typeof d === "number" && d > 0 ? d : null };
}

function downloadHref(url: string, title: string) {
  const name = `${title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim().slice(0, 60) || "audio"}.${
    url.split("?")[0].split(".").pop() || "mp3"
  }`;
  if (url.includes("/storage/v1/object/public/")) {
    const u = new URL(url);
    u.searchParams.set("download", name);
    return { href: u.toString(), name };
  }
  return { href: url, name };
}

export function PostAudio({ post }: { post?: Post | null }) {
  const audio = postAudio(post);
  const [broken, setBroken] = useState(false);
  if (!audio || broken || !post) return null;
  const dl = downloadHref(audio.url, post.title);
  return (
    <div
      data-no-collapse
      className="mt-2 flex w-full min-w-0 flex-wrap items-center gap-2 rounded-2xl bg-chip/60 p-2"
    >
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted">
        <Headphones size={14} strokeWidth={1.75} />
        Versión hablada
        {audio.duration ? <span className="tabular-nums">· {formatDuration(audio.duration)}</span> : null}
      </span>
      <audio
        controls
        preload="metadata"
        src={audio.url}
        onError={() => setBroken(true)}
        className="h-9 min-w-0 flex-1 basis-56"
      />
      <a
        href={dl.href}
        download={dl.name}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-chip px-3 py-1.5 text-xs font-semibold hover:opacity-80"
      >
        <Download size={14} strokeWidth={1.75} />
        Descargar
      </a>
    </div>
  );
}
