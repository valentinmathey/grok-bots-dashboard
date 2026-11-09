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
  extraActions,
}: {
  post?: Post;
  bot?: PostCardBot | null;
  open: boolean;
  kind?: string;
  allowRequest?: boolean;
  showFavorite?: boolean;
  extraActions?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-start gap-0.5" data-no-collapse>
      {kind ? (
        <span className="mt-1 hidden min-[480px]:inline-flex">
          <KindBadge kind={kind} />
        </span>
      ) : null}
      {extraActions}
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

/**
 * Header de card: fila superior (badges | acciones) y cuerpo a ancho completo
 * debajo, para que en mobile (~320px) el título y los chips no queden
 * apretados junto a los íconos.
 */
export function PostCardHeader({
  open,
  title,
  meta,
  subtitle,
  extra,
  badges,
  kind,
  post,
  bot,
  allowRequest = true,
  showFavorite = true,
  titleAs: TitleTag = "h3",
  titleClassName = "text-[1.05rem] font-semibold leading-snug tracking-tight",
  className = "",
  extraActions,
}: {
  open: boolean;
  title: ReactNode;
  meta?: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  /** Badges de importancia / estado: van en la fila de acciones, no junto al título. */
  badges?: ReactNode;
  kind?: string;
  post?: Post;
  bot?: PostCardBot | null;
  allowRequest?: boolean;
  showFavorite?: boolean;
  titleAs?: "h2" | "h3";
  titleClassName?: string;
  className?: string;
  extraActions?: ReactNode;
}) {
  const showTopBar = Boolean(badges) || Boolean(kind) || Boolean(post) || Boolean(extraActions);
  const showRegistered = post?.kind === "evento";

  return (
    <div className={className || undefined}>
      {showTopBar ? (
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {showRegistered ? <RegisteredBadge postId={post!.id} /> : null}
            {badges}
            {kind ? (
              <span className="min-[480px]:hidden">
                <KindBadge kind={kind} />
              </span>
            ) : null}
          </div>
          <PostCardActions
            post={post}
            bot={bot}
            open={open}
            kind={kind}
            allowRequest={allowRequest}
            showFavorite={showFavorite}
            extraActions={extraActions}
          />
        </div>
      ) : null}

      <div className={`min-w-0 ${showTopBar ? "mt-2" : ""}`}>
        {meta ? (
          <div className="flex flex-wrap items-center gap-1.5">{meta}</div>
        ) : null}
        <TitleTag
          className={`min-w-0 break-words [overflow-wrap:anywhere] ${titleClassName} ${meta ? "mt-1.5" : ""}`}
        >
          {title}
        </TitleTag>
        {subtitle}
        {extra}
      </div>
      <PostAudio post={post} />
    </div>
  );
}
