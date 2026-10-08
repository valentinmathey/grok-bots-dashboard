import "server-only";

import { isPreviewMode } from "@/lib/env";
import { getPreviewRepository } from "@/lib/preview-seed";
import { createSupabaseRepository } from "@/lib/supabase/repository";
import type { BotsRepository } from "@/lib/publishing";

export function getRepository(): BotsRepository {
  if (isPreviewMode()) {
    return getPreviewRepository();
  }
  return createSupabaseRepository();
}
