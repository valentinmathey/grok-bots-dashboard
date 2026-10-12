import "server-only";

import { isPreviewMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const memory = new Set<string>();

export async function listRegisteredIds(): Promise<string[]> {
  if (isPreviewMode()) return [...memory];
  const { data, error } = await createAdminClient()
    .from("post_registrations")
    .select("post_id");
  if (error) throw error;
  return (data ?? []).map((row) => row.post_id as string);
}

export async function registeredIdSet(): Promise<Set<string>> {
  try {
    return new Set(await listRegisteredIds());
  } catch {
    return new Set();
  }
}

export async function setRegistered(postId: string, on: boolean): Promise<{ registered: boolean }> {
  if (isPreviewMode()) {
    if (on) memory.add(postId);
    else memory.delete(postId);
    return { registered: on };
  }
  const admin = createAdminClient();
  const { error } = on
    ? await admin.from("post_registrations").upsert({ post_id: postId }, { onConflict: "post_id" })
    : await admin.from("post_registrations").delete().eq("post_id", postId);
  if (error) throw error;
  return { registered: on };
}
