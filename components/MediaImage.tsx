"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { isHttpUrl } from "@/lib/images";
import { imageUrlFallback, preferCompatibleImageUrl } from "@/lib/remote-image";

export function MediaImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const normalized = isHttpUrl(src) ? preferCompatibleImageUrl(src) : "";
  const [current, setCurrent] = useState(normalized);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(normalized);
    setFailed(false);
  }, [normalized]);

  if (!current || !isHttpUrl(current) || failed) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-2xl text-left"
        aria-label={alt ? `Ver imagen: ${alt}` : "Ver imagen"}
      >
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
          className={`aspect-[16/10] h-auto w-full object-cover ${className}`}
        />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
          aria-label={alt || "Imagen"}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt={alt}
            referrerPolicy="no-referrer"
            className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain"
          />
        </div>
      ) : null}
    </>
  );
}
