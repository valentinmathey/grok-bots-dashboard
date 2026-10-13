import { cache } from "react";
import { getRepository } from "@/lib/data";
import { resolveAudiosShare, resolveShare, resolveSharedPost } from "@/lib/share";

export const loadShare = cache(async (token: string) => {
  const result = await resolveShare(getRepository(), token);
  return result.ok ? result.data : null;
});

export const loadSharedPost = cache(async (token: string, postId: string) => {
  const result = await resolveSharedPost(getRepository(), token, postId);
  return result.ok ? result.data : null;
});

export const loadAudiosShare = cache(async (token: string) => {
  const result = await resolveAudiosShare(getRepository(), token);
  return result.ok ? result.data : null;
});
