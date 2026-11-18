import { NextResponse } from "next/server";
import { ACCESS_COOKIE, WORKSPACE_COOKIE, accessToken, backendRequest } from "@/lib/auth/server";
import { failureResponse, forbiddenOrigin, invalidRequest, sameOrigin, unauthenticated } from "@/lib/auth/route-utils";
import type { Workspace } from "@/lib/auth/types";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbiddenOrigin();
  const token = await accessToken();
  if (!token) return unauthenticated();
  const body = await request.json().catch(() => null) as { workspaceId?: unknown } | null;
  if (!body || typeof body.workspaceId !== "string" || !body.workspaceId) return invalidRequest();
  try {
    const workspace = await backendRequest<Workspace>(`/workspaces/${encodeURIComponent(body.workspaceId)}`, { token });
    const response = NextResponse.json(workspace, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(WORKSPACE_COOKIE, workspace.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    const response = failureResponse(error);
    if (response.status === 401) response.cookies.delete(ACCESS_COOKIE);
    return response;
  }
}
