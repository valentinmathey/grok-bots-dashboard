import "server-only";

import { isPreviewMode } from "@/lib/env";
import { postAudio } from "@/lib/post-audio";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Post } from "@/lib/types";

export async function listAudioPosts(): Promise<Post[]> {
  if (isPreviewMode()) return [];
  const { data, error } = await createAdminClient()
    .from("posts")
    .select("*")
    .not("details->>audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as Post[]).filter((post) => postAudio(post));
}
