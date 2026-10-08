export const AVATAR_COLORS = [
  "maroon",
  "black",
  "brown",
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "violet",
  "magenta",
  "gray",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

export const AVATAR_SHAPES = [
  "blob",
  "squircle",
  "hex",
  "star",
  "heart",
  "shield",
  "diamond",
  "petal",
] as const;

export type AvatarShape = (typeof AVATAR_SHAPES)[number];

export const AVATAR_PALETTE: Record<
  AvatarColor,
  { fill: string; ink: string; label: string }
> = {
  maroon: { fill: "#7f1d2c", ink: "#fff6f4", label: "Bordó" },
  black: { fill: "#171411", ink: "#f6f1e8", label: "Negro" },
  brown: { fill: "#7c4a1e", ink: "#fff7ed", label: "Marrón" },
  red: { fill: "#b42318", ink: "#fff5f5", label: "Rojo" },
  orange: { fill: "#c2410c", ink: "#fff7ed", label: "Naranja" },
  yellow: { fill: "#a16207", ink: "#fffbeb", label: "Amarillo" },
  green: { fill: "#166534", ink: "#f0fdf4", label: "Verde" },
  cyan: { fill: "#0e7490", ink: "#ecfeff", label: "Cian" },
  blue: { fill: "#1d4ed8", ink: "#eff6ff", label: "Azul" },
  violet: { fill: "#6d28d9", ink: "#f5f3ff", label: "Violeta" },
  magenta: { fill: "#a21caf", ink: "#fdf4ff", label: "Magenta" },
  gray: { fill: "#57534e", ink: "#f5f5f4", label: "Gris" },
};

export const AVATAR_SHAPE_PATHS: Record<AvatarShape, string> = {
  blob: "M18 14C28 6 44 8 52 18C60 30 58 46 46 54C34 62 16 58 10 44C4 30 8 20 18 14Z",
  squircle:
    "M8 20C8 10 10 8 20 8H44C54 8 56 10 56 20V44C56 54 54 56 44 56H20C10 56 8 54 8 44V20Z",
  hex: "M32 4L56 18V46L32 60L8 46V18L32 4Z",
  star: "M32 4L39.2 24.2H60L43.4 36.6L50.6 56.8L32 44.4L13.4 56.8L20.6 36.6L4 24.2H24.8L32 4Z",
  heart:
    "M32 56C32 56 8 38 8 24C8 14 16 10 24 14C28 16 32 22 32 22C32 22 36 16 40 14C48 10 56 14 56 24C56 38 32 56 32 56Z",
  shield:
    "M32 4L56 14V34C56 48 44 56 32 60C20 56 8 48 8 34V14L32 4Z",
  diamond: "M32 4L60 32L32 60L4 32L32 4Z",
  petal:
    "M32 6C36 18 46 28 58 32C46 36 36 46 32 58C28 46 18 36 6 32C18 28 28 18 32 6Z",
};

export const AVATAR_SHAPE_LABELS: Record<AvatarShape, string> = {
  blob: "Blob",
  squircle: "Squircle",
  hex: "Hexágono",
  star: "Estrella",
  heart: "Corazón",
  shield: "Escudo",
  diamond: "Diamante",
  petal: "Pétalo",
};

export function isAvatarColor(value: string): value is AvatarColor {
  return (AVATAR_COLORS as readonly string[]).includes(value);
}

export function isAvatarShape(value: string): value is AvatarShape {
  return (AVATAR_SHAPES as readonly string[]).includes(value);
}

export function hashSlug(slug: string): number {
  let hash = 2166136261;
  for (const ch of slug) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function defaultAvatar(slug: string): {
  color: AvatarColor;
  shape: AvatarShape;
} {
  const hash = hashSlug(slug);
  return {
    color: AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? "maroon",
    shape:
      AVATAR_SHAPES[Math.floor(hash / AVATAR_COLORS.length) % AVATAR_SHAPES.length] ??
      "blob",
  };
}

export function resolveAvatar(bot: {
  slug: string;
  name?: string;
  avatar_color?: string | null;
  avatar_shape?: string | null;
  avatar_url?: string | null;
}): {
  color: AvatarColor;
  shape: AvatarShape;
  url: string | null;
  letter: string;
  fill: string;
  ink: string;
} {
  const fallback = defaultAvatar(bot.slug);
  const color = bot.avatar_color && isAvatarColor(bot.avatar_color)
    ? bot.avatar_color
    : fallback.color;
  const shape = bot.avatar_shape && isAvatarShape(bot.avatar_shape)
    ? bot.avatar_shape
    : fallback.shape;
  const palette = AVATAR_PALETTE[color];
  const letter = (bot.name?.trim()?.[0] ?? bot.slug[0] ?? "G").toUpperCase();
  return {
    color,
    shape,
    url: bot.avatar_url?.trim() || null,
    letter,
    fill: palette.fill,
    ink: palette.ink,
  };
}
