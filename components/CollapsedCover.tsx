"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isHttpUrl } from "@/lib/images";
import { imageUrlFallback, preferCompatibleImageUrl } from "@/lib/remote-image";

export function CardCover({
  src,
  alt,
  fit = "cover",
}: {
  src?: string | null;
  alt: string;
  fit?: "cover" | "contain";
}) {
  const normalized = src && isHttpUrl(src) ? preferCompatibleImageUrl(src) : null;
  const [current, setCurrent] = useState<string | null>(normalized);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(normalized);
    setFailed(false);
  }, [normalized]);

  if (!current || failed) return null;

  return (
    <div className="relative min-h-0 w-full bg-chip">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          const next = imageUrlFallback(current);
          if (next && next !== current) {
            setCurrent(next);
            return;
          }
          setFailed(true);
        }}
        className={`aspect-video w-full object-center ${
          fit === "contain" ? "object-contain" : "object-cover"
        }`}
      />
    </div>
  );
}

export function CardHeaderPad({ children }: { children: ReactNode }) {
  return <div className="p-4 sm:p-5">{children}</div>;
}
