"use client";

import { useEffect, useState } from "react";
import { ChangesSection } from "@/components/ChangesSection";
import { PostCard, type PostCardChrome } from "@/components/PostCard";
import { hashPostId } from "@/lib/scroll-to-post";
import type { Post } from "@/lib/types";

/** Cambios de Eventos tech: plegado salvo que el deep link apunte a uno de estos. */
export function EventoChanges({
  posts,
  basePath,
  bot,
}: {
  posts: Post[];
  basePath: string;
  bot?: PostCardChrome["bot"];
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    function applyHash() {
      const id = hashPostId(window.location.hash);
      setTarget(id);
      if (id && posts.some((post) => post.id === id)) setOpen(true);
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [posts]);
  if (!posts.length) return null;
  return (
    <ChangesSection count={posts.length} open={open} onToggle={() => setOpen((v) => !v)} id="evento-cambios">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} filterBasePath={basePath} defaultOpen={post.id === target} bot={bot} />
      ))}
    </ChangesSection>
  );
}
