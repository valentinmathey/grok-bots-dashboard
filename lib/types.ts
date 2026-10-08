export const POST_KINDS = ["update", "result", "report", "note"] as const;

export type PostKind = (typeof POST_KINDS)[number];

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
