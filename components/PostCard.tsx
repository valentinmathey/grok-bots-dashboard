"use client";

import { useState } from "react";
import Link from "next/link";
import { KindBadge } from "@/components/KindBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import { filtersToSearchParams } from "@/lib/filters";
import { formatDateTime, previewPlain } from "@/lib/format";
import type { Post, PostKind } from "@/lib/types";

export function PostCard({
  post,
  filterBasePath,
}: {
  post: Post;
  filterBasePath: string;
}) {
  const [open, setOpen] = useState(false);
  const preview = previewPlain(post.body_markdown);

  function href(next: { kind?: PostKind; product?: string; tag?: string }) {
    const query = filtersToSearchParams(next).toString();
    return query ? `${filterBasePath}?${query}` : filterBasePath;
  }

  return (
    <article className="surface min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h3 className="min-w-0 text-[1.05rem] font-semibold leading-snug tracking-tight break-words">
          {post.title}
        </h3>
        <time
          dateTime={post.created_at}
          title={formatDateTime(post.created_at)}
          className="text-xs text-muted sm:shrink-0 sm:pt-0.5"
        >
          {formatDateTime(post.created_at)}
        </time>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Link href={href({ kind: post.kind })} className="hover:opacity-80">
          <KindBadge kind={post.kind} />
        </Link>
        {post.product ? (
          <Link
            href={href({ product: post.product })}
            className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-foreground/80 hover:bg-accent/15"
          >
            {post.product}
          </Link>
        ) : null}
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={href({ tag })}
            className="text-[11px] text-muted hover:text-foreground"
          >
            #{tag}
          </Link>
        ))}
      </div>

      {open ? (
        <div className="mt-4 border-t border-line pt-3">
          <MarkdownBody markdown={post.body_markdown} />
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">{preview}</p>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-3 text-sm font-medium text-accent"
      >
        {open ? "Ver menos" : "Ver más"}
      </button>
    </article>
  );
}
