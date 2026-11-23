import type { ApiFailure, FieldErrors } from "./types";

export class ClientApiError extends Error {
  constructor(public status: number, message: string, public fields: FieldErrors = {}) {
    super(message);
  }
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = body as ApiFailure | null;
    throw new ClientApiError(response.status, failure?.error?.message ?? "Yêu cầu chưa hoàn tất. Vui lòng thử lại.", failure?.error?.details?.fields ?? {});
  }
  return body as T;
}
