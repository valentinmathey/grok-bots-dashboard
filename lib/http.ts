import { NextResponse } from "next/server";
import type { ApiErrorBody, Result } from "@/lib/types";

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  );
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Extract<Result<never>, { ok: false }> {
  return {
    ok: false,
    status,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}

export function resultToResponse<T>(result: Result<T>, successStatus = 200) {
  if (!result.ok) {
    return jsonError(
      result.status,
      result.error.code,
      result.error.message,
      result.error.details,
    );
  }
  return NextResponse.json(result.data, {
    status: result.status ?? successStatus,
  });
}

export async function readJsonBody(
  request: Request,
): Promise<Result<unknown>> {
  const text = await request.text();
  if (!text.trim()) {
    return fail(400, "invalid_json", "El cuerpo JSON está vacío");
  }

  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return fail(400, "invalid_json", "El cuerpo no es JSON válido");
  }
}
