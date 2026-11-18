import { NextResponse } from "next/server";
import { ACCESS_COOKIE, WORKSPACE_COOKIE, backendRequest, BackendError } from "@/lib/auth/server";
import { failureResponse, forbiddenOrigin, invalidRequest, sameOrigin } from "@/lib/auth/route-utils";
import type { Account } from "@/lib/auth/types";

interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  account: Account;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbiddenOrigin();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalidRequest();
  try {
    const session = await backendRequest<LoginResponse>("/auth/login", { method: "POST", body });
    if (!session.accessToken || session.tokenType !== "Bearer" || !Number.isInteger(session.expiresIn) || session.expiresIn < 1) {
      throw new BackendError(502, "INVALID_API_RESPONSE", "API đăng nhập trả dữ liệu không hợp lệ.");
    }
    const response = NextResponse.json({ account: session.account }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(ACCESS_COOKIE, session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: session.expiresIn,
    });
    response.cookies.delete(WORKSPACE_COOKIE);
    return response;
  } catch (error) {
    return failureResponse(error);
  }
}
