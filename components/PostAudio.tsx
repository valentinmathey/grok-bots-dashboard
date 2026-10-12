"use client";

import { useRef, useState } from "react";
import { Download, Headphones } from "lucide-react";
import { postAudio } from "@/lib/post-audio";
import type { Post } from "@/lib/types";

export { postAudio };

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
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

const RATES = ["1", "1.5", "2"];

export function PostAudio({ post }: { post?: Post | null }) {
  const audio = postAudio(post);
  const [broken, setBroken] = useState(false);
  const [rate, setRate] = useState("1");
  const ref = useRef<HTMLAudioElement>(null);
  function changeRate(next: string) {
    setRate(next);
    if (ref.current) ref.current.playbackRate = Number(next);
  }
  if (!audio || broken || !post) return null;
  const dl = downloadHref(audio.url, post.title);
  const nextRate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
  return (
    <div
      data-no-collapse
      className="mt-3 w-full min-w-0 rounded-2xl bg-chip/60 px-3 py-2"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-muted">
          <Headphones size={14} strokeWidth={1.75} className="shrink-0" />
          <span className="truncate">
            Versión hablada
            {audio.duration ? <span className="tabular-nums"> · {formatDuration(audio.duration)}</span> : null}
          </span>
        </span>
        <button
          type="button"
          onClick={() => changeRate(nextRate)}
          aria-label={`Velocidad ${rate}x. Tocá para cambiar a ${nextRate}x`}
          className="inline-flex min-h-8 min-w-10 shrink-0 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums hover:bg-chip"
        >
          {rate}x
        </button>
        <a
          href={dl.href}
          download={dl.name}
          aria-label="Descargar"
          title="Descargar"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-foreground"
        >
          <Download size={16} strokeWidth={1.75} />
        </a>
      </div>
      <audio
        ref={ref}
        controls
        onLoadedMetadata={(e) => { e.currentTarget.playbackRate = Number(rate); }}
        preload="metadata"
        src={audio.url}
        onError={() => setBroken(true)}
        className="mt-1.5 block h-9 w-full min-w-0"
      />
    </div>
  );
}
