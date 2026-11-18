import { ACCESS_COOKIE, accessToken, backendRequest } from "@/lib/auth/server";
import { failureResponse, forbiddenOrigin, invalidRequest, sameOrigin, unauthenticated } from "@/lib/auth/route-utils";
import type { Workspace, WorkspacePage } from "@/lib/auth/types";

export async function GET(request: Request) {
  const token = await accessToken();
  if (!token) return unauthenticated();
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return invalidRequest();
  try {
    const data = await backendRequest<WorkspacePage>(`/workspaces?page=${page}&pageSize=${pageSize}`, { token });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const response = failureResponse(error);
    if (response.status === 401) response.cookies.delete(ACCESS_COOKIE);
    return response;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbiddenOrigin();
  const token = await accessToken();
  if (!token) return unauthenticated();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalidRequest();
  try {
    const workspace = await backendRequest<Workspace>("/workspaces", { method: "POST", body, token });
    return Response.json(workspace, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const response = failureResponse(error);
    if (response.status === 401) response.cookies.delete(ACCESS_COOKIE);
    return response;
  }
}
