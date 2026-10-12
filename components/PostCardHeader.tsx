"use client";

import type { ReactNode } from "react";
import { ExpandChevron } from "@/components/ExpandableCard";
import { FavoriteStar } from "@/components/FavoriteStar";
import { PostAudio } from "@/components/PostAudio";
import { KindBadge } from "@/components/KindBadge";
import { RegisteredBadge, RegisteredToggle } from "@/components/RegisteredToggle";
import { RequestButton } from "@/components/RequestModal";
import type { Post } from "@/lib/types";

export type PostCardBot = {
  id: string;
  name: string;
  slug: string;
  avatar_color?: string | null;
  avatar_url?: string | null;
};

export function PostCardActions({
  post,
  bot,
  open,
  kind,
  allowRequest = true,
  showFavorite = true,
}: {
  post?: Post;
  bot?: PostCardBot | null;
  open: boolean;
  kind?: string;
  allowRequest?: boolean;
  showFavorite?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-start gap-0.5" data-no-collapse>
      {kind ? (
        <span className="mt-1 hidden min-[480px]:inline-flex">
          <KindBadge kind={kind} />
        </span>
      ) : null}
      {post && showFavorite && post.kind === "evento" ? <RegisteredToggle postId={post.id} /> : null}
      {post && showFavorite ? <FavoriteStar postId={post.id} /> : null}
      {post && allowRequest ? (
        <RequestButton
          postId={post.id}
          botId={post.bot_id}
          postTitle={post.title}
          bot={bot}
        />
      ) : null}
      <ExpandChevron open={open} />
    </div>
  );
}

export function PostCardHeader({
  open,
  title,
  meta,
  subtitle,
  extra,
  kind,
  post,
  bot,
  allowRequest = true,
  showFavorite = true,
  titleAs: TitleTag = "h3",
  titleClassName = "text-[1.05rem] font-semibold leading-snug tracking-tight",
  className = "",
}: {
  open: boolean;
  title: ReactNode;
  meta?: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  kind?: string;
  post?: Post;
  bot?: PostCardBot | null;
  allowRequest?: boolean;
  showFavorite?: boolean;
  titleAs?: "h2" | "h3";
  titleClassName?: string;
  className?: string;
}) {
  return (
    <div className={className || undefined}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {meta || kind ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {post?.kind === "evento" ? <RegisteredBadge postId={post.id} /> : null}
              {meta}
              {kind ? (
                <span className="min-[480px]:hidden">
                  <KindBadge kind={kind} />
                </span>
              ) : null}
            </div>
          ) : null}
          <TitleTag className={`min-w-0 break-words ${titleClassName}`}>
            {title}
          </TitleTag>
          {subtitle}
          {extra}
        </div>
        <PostCardActions
          post={post}
          bot={bot}
          open={open}
          kind={kind}
          allowRequest={allowRequest}
          showFavorite={showFavorite}
        />
      </div>
      <PostAudio post={post} />
    </div>
  );
}
