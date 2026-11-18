import { NextResponse } from "next/server";
import { BackendError } from "./server";

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const requestHost = request.headers.get("host") ?? new URL(request.url).host;
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}

export function failureResponse(error: unknown): NextResponse {
  if (error instanceof BackendError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: { fields: error.fields } } },
      { status: error.status },
    );
  }
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại.", details: {} } },
    { status: 500 },
  );
}

export function invalidRequest(): NextResponse {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message: "Dữ liệu gửi lên không hợp lệ.", details: {} } },
    { status: 400 },
  );
}

export function forbiddenOrigin(): NextResponse {
  return NextResponse.json(
    { error: { code: "FORBIDDEN", message: "Nguồn yêu cầu không hợp lệ.", details: {} } },
    { status: 403 },
  );
}

export function unauthenticated(): NextResponse {
  return NextResponse.json(
    { error: { code: "UNAUTHENTICATED", message: "Vui lòng đăng nhập để tiếp tục.", details: {} } },
    { status: 401 },
  );
}
