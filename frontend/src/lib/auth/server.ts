import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Account, ApiFailure, FieldErrors, Workspace } from "./types";

export const ACCESS_COOKIE = "cwrm_access";
export const WORKSPACE_COOKIE = "cwrm_workspace";

export class BackendError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: FieldErrors = {},
  ) {
    super(message);
    this.name = "BackendError";
  }
}

function apiBaseUrl(): string {
  const value = process.env.CWRM_API_BASE_URL?.replace(/\/$/, "");
  if (!value) {
    throw new BackendError(503, "API_NOT_CONFIGURED", "Chưa cấu hình CWRM_API_BASE_URL cho frontend.");
  }
  return value;
}

export async function backendRequest<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH"; body?: unknown; token?: string } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError(503, "API_UNAVAILABLE", "Không kết nối được API. Vui lòng kiểm tra backend và thử lại.");
  }

  if (!response.ok) {
    const failure = await response.json().catch(() => null) as ApiFailure | null;
    const detail = failure?.error;
    throw new BackendError(
      response.status,
      detail?.code ?? "API_ERROR",
      detail?.message ?? `API trả lỗi ${response.status}.`,
      detail?.details?.fields ?? {},
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function accessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export const getAccount = cache(async (): Promise<Account | null> => {
  const token = await accessToken();
  if (!token) return null;
  try {
    return await backendRequest<Account>("/auth/me", { token });
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) return null;
    throw error;
  }
});

export async function requireAccount(): Promise<Account> {
  const token = await accessToken();
  const account = await getAccount();
  if (!account) redirect(token ? "/login?expired=1" : "/login");
  return account;
}

export const getSelectedWorkspace = cache(async (): Promise<Workspace | null> => {
  const token = await accessToken();
  const workspaceId = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  if (!token || !workspaceId) return null;
  try {
    return await backendRequest<Workspace>(`/workspaces/${encodeURIComponent(workspaceId)}`, { token });
  } catch (error) {
    if (error instanceof BackendError && [401, 403, 404].includes(error.status)) return null;
    throw error;
  }
});

export async function requireWorkspace(): Promise<Workspace> {
  const workspace = await getSelectedWorkspace();
  if (!workspace) redirect("/workspaces");
  return workspace;
}
