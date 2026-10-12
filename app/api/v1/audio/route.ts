import { getRepository } from "@/lib/data";
import { readJsonBody, resultToResponse } from "@/lib/http";
import { createAudioUploadUrl, deleteAudio, uploadAudioFile } from "@/lib/audio";
import { getAudioStorage } from "@/lib/audio-storage";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST JSON {filename?, ext?, content_type?} -> URL firmada (PUT directo a Supabase, hasta 20 MB).
// POST multipart (campo "file") -> sube directo (límite Vercel ~4 MB).
export async function POST(request: Request) {
  const repo = getRepository();
  const storage = getAudioStorage();
  const auth = request.headers.get("authorization");
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return resultToResponse(fail(400, "invalid_input", "Multipart inválido"));
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return resultToResponse(fail(400, "invalid_input", "Falta el campo file"));
    }
    return resultToResponse(await uploadAudioFile(repo, storage, auth, file), 201);
  }
  const text = await request.clone().text();
  let payload: unknown = {};
  if (text.trim()) {
    const body = await readJsonBody(request);
    if (!body.ok) return resultToResponse(body);
    payload = body.data;
  }
  return resultToResponse(await createAudioUploadUrl(repo, storage, auth, payload), 201);
}

// DELETE ?path=slug/YYYY-MM/x.mp3 | ?month=YYYY-MM | JSON {path?, paths?, month?}
export async function DELETE(request: Request) {
  const params = new URL(request.url).searchParams;
  let payload: Record<string, unknown> = {};
  const text = await request.text();
  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      return resultToResponse(fail(400, "invalid_json", "JSON inválido"));
    }
  }
  if (params.get("path")) payload.path = params.get("path");
  if (params.get("month")) payload.month = params.get("month");
  return resultToResponse(
    await deleteAudio(getRepository(), getAudioStorage(), request.headers.get("authorization"), payload),
  );
}
