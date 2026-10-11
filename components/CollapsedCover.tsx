"use client";

import { useState, type ReactNode } from "react";
import { isHttpUrl } from "@/lib/images";

export function CardCover({
  src,
  alt,
  fit = "cover",
}: {
  src?: string | null;
  alt: string;
  fit?: "cover" | "contain";
}) {
  const [failed, setFailed] = useState(false);
  if (!src || !isHttpUrl(src) || failed) return null;

  return (
    <div className="bg-chip">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
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
