import { backendRequest } from "@/lib/auth/server";
import { failureResponse, forbiddenOrigin, invalidRequest, sameOrigin } from "@/lib/auth/route-utils";
import type { Account } from "@/lib/auth/types";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbiddenOrigin();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalidRequest();
  try {
    const account = await backendRequest<Account>("/auth/register", { method: "POST", body });
    return Response.json(account, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return failureResponse(error);
  }
}
