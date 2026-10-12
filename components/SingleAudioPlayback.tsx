"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Pausa los demás <audio> del bloque cuando uno empieza a sonar. */
export function SingleAudioPlayback({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onPlay = (event: Event) => {
      root.querySelectorAll("audio").forEach((audio) => {
        if (audio !== event.target && !audio.paused) audio.pause();
      });
    };
    root.addEventListener("play", onPlay, true);
    return () => root.removeEventListener("play", onPlay, true);
  }, []);
  return <div ref={ref}>{children}</div>;
}
