import { NextResponse } from "next/server";
import { ACCESS_COOKIE, WORKSPACE_COOKIE, accessToken, backendRequest } from "@/lib/auth/server";
import { forbiddenOrigin, sameOrigin } from "@/lib/auth/route-utils";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbiddenOrigin();
  const token = await accessToken();
  if (token) {
    try {
      await backendRequest<void>("/auth/logout", { method: "POST", token });
    } catch {
      // Backend logout is stateless; clearing the browser cookie ends this session.
    }
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(WORKSPACE_COOKIE);
  return response;
}
