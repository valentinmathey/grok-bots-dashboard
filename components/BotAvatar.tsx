"use client";

import { useState } from "react";
import { resolveAvatar } from "@/lib/avatar";

const SIZES = {
  sm: "h-9 w-9 text-[13px]",
  md: "h-12 w-12 text-lg",
  lg: "h-[4.5rem] w-[4.5rem] text-2xl",
  xl: "h-20 w-20 text-[1.75rem]",
} as const;

export function BotAvatar({
  bot,
  size = "md",
  className = "",
}: {
  bot: {
    slug: string;
    name?: string;
    avatar_color?: string | null;
    avatar_shape?: string | null;
    avatar_url?: string | null;
  };
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const avatar = resolveAvatar(bot);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const showPhoto = Boolean(avatar.url) && avatar.url !== brokenUrl;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold leading-none shadow-sm ring-1 ring-black/10 dark:ring-white/15 ${SIZES[size]} ${className}`}
      style={{ backgroundColor: avatar.fill, color: avatar.ink }}
      aria-hidden
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- URLs externas; object-cover + onError
        <img
          src={avatar.url ?? ""}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => {
            if (avatar.url) {
              setBrokenUrl(avatar.url);
            }
          }}
        />
      ) : (
        <span className="select-none">{avatar.letter}</span>
      )}
    </span>
  );
}
