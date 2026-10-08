export const KNOWN_KINDS = [
  "update",
  "result",
  "report",
  "note",
  "evento",
] as const;

export type KnownKind = (typeof KNOWN_KINDS)[number];

/** Slug corto en minúsculas. Los conocidos tienen etiqueta en español. */
export type PostKind = string;

export type Bot = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string | null;
  status_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BotSummary = Bot & {
  post_count: number;
  last_activity_at: string | null;
};

export type Post = {
  id: string;
  bot_id: string;
  title: string;
  body_markdown: string;
  kind: PostKind;
  product: string | null;
  tags: string[];
  created_at: string;
};

export type PostWithBot = Post & {
  bot: Pick<Bot, "id" | "name" | "slug">;
};

export type AuthenticatedBot = {
  botId: string;
  name: string;
  slug: string;
  status: string | null;
};

export type CreatedPost = {
  id: string;
  title: string;
  kind: PostKind;
  product: string | null;
  tags: string[];
  created_at: string;
};

export type PostFacets = {
  products: string[];
  kinds: string[];
  tags: string[];
};

export type PageOptions = {
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type Result<T> =
  | { ok: true; data: T; status?: number }
  | { ok: false; status: number; error: ApiErrorBody["error"] };
