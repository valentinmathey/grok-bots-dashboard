import Link from "next/link";
import { KindBadge } from "@/components/KindBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import { TimeStamp } from "@/components/TimeStamp";
import { filtersToSearchParams } from "@/lib/filters";
import type { Post, PostKind, PostWithBot } from "@/lib/types";

export function PostCard({
  post,
  compact = false,
  filterBasePath = "/",
}: {
  post: Post | PostWithBot;
  compact?: boolean;
  filterBasePath?: string;
}) {
  const bot = "bot" in post ? post.bot : null;

  function href(next: { kind?: PostKind; product?: string; tag?: string }) {
    const params = filtersToSearchParams(next);
    const query = params.toString();
    return query ? `${filterBasePath}?${query}` : filterBasePath;
  }

  return (
    <article className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={href({ kind: post.kind })}>
          <KindBadge kind={post.kind} />
        </Link>
        {post.product ? (
          <Link
            href={href({ product: post.product })}
            className="inline-flex items-center rounded-full bg-foreground/8 px-2.5 py-0.5 text-xs font-medium text-foreground/85"
          >
            {post.product}
          </Link>
        ) : null}
        {bot ? (
          <Link href={`/bots/${bot.slug}`} className="font-medium text-accent">
            {bot.name}
          </Link>
        ) : null}
        <TimeStamp iso={post.created_at} />
      </div>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">{post.title}</h3>
      {post.tags.length > 0 ? (
        <p className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
          {post.tags.map((tag) => (
            <Link key={tag} href={href({ tag })} className="hover:text-foreground">
              #{tag}
            </Link>
          ))}
        </p>
      ) : null}
      {compact ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
          {post.body_markdown.replace(/[#*_`>\-\[\]()]/g, "").slice(0, 180)}
        </p>
      ) : (
        <div className="mt-3">
          <MarkdownBody markdown={post.body_markdown} />
        </div>
      )}
    </article>
  );
}
