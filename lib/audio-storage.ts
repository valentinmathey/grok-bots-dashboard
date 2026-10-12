import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { AUDIO_BUCKET, type AudioStorage } from "@/lib/audio";

export function getAudioStorage(): AudioStorage {
  const bucket = () => createAdminClient().storage.from(AUDIO_BUCKET);
  return {
    async createSignedUploadUrl(path) {
      const { data, error } = await bucket().createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message ?? "No se pudo firmar la subida");
      return { signedUrl: data.signedUrl, token: data.token };
    },
    async upload(path, body, contentType) {
      const { error } = await bucket().upload(path, body, { contentType, upsert: false });
      if (error) throw new Error(error.message);
    },
    publicUrl(path) {
      return bucket().getPublicUrl(path).data.publicUrl;
    },
    async list(prefix) {
      const { data, error } = await bucket().list(prefix, { limit: 1000 });
      if (error) throw new Error(error.message);
      return (data ?? []).filter((f) => f.id).map((f) => f.name);
    },
    async remove(paths) {
      const { data, error } = await bucket().remove(paths);
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    },
  };
}
