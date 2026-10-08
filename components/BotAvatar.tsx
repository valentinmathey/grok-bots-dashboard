import {
  AVATAR_SHAPE_PATHS,
  resolveAvatar,
} from "@/lib/avatar";

const SIZES = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-[4.5rem] w-[4.5rem]",
  xl: "h-20 w-20",
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
  const clipId = `avatar-${bot.slug}-${size}`.replace(/[^a-z0-9-]/gi, "");
  const path = AVATAR_SHAPE_PATHS[avatar.shape];

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center ${SIZES[size]} ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-sm">
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        </defs>
        <path d={path} fill={avatar.fill} />
        {avatar.url ? (
          <image
            href={avatar.url}
            x="4"
            y="4"
            width="56"
            height="56"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        ) : (
          <text
            x="32"
            y="40"
            textAnchor="middle"
            fill={avatar.ink}
            fontSize="26"
            fontWeight="700"
            fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
          >
            {avatar.letter}
          </text>
        )}
      </svg>
    </span>
  );
}
