"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientApiError, readApiResponse } from "@/lib/auth/client";
import type { FieldErrors } from "@/lib/auth/types";

export function AuthForm({ mode, notice }: { mode: "login" | "register"; notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFields({});
    const nextFields: FieldErrors = {};
    if (!email.trim() || Array.from(email.trim()).length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextFields.email = ["Nhập email hợp lệ (tối đa 320 ký tự)."];
    }
    if (!password) {
      nextFields.password = ["Nhập mật khẩu."];
    }
    if (mode === "register") {
      if (!displayName.trim() || Array.from(displayName.trim()).length > 120) {
        nextFields.displayName = ["Tên hiển thị cần từ 1 đến 120 ký tự."];
      }
      if (Array.from(password).length < 8 || new TextEncoder().encode(password).length > 72) {
        nextFields.password = ["Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte."];
      }
    }
    if (Object.keys(nextFields).length) {
      setFields(nextFields);
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { email: email.trim(), password, displayName: displayName.trim() }
            : { email: email.trim(), password }
        ),
      });
      await readApiResponse(response);
      router.replace(mode === "register" ? "/login?registered=1" : "/workspaces");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ClientApiError) {
        setError(caught.message);
        setFields(caught.fields);
      } else {
        setError("Không thể gửi yêu cầu. Vui lòng kiểm tra kết nối và thử lại.");
      }
    } finally {
      setPending(false);
    }
  }

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("change_me_demo_only");
  }

  return (
    <main className="auth-container">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="auth-card-wrapper">
        <div className="auth-brand-header">
          <div className="auth-brand-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1>CWRM Platform</h1>
          <p>Hệ thống Điều hành Dự án theo chuẩn RACI & Giám sát Rủi ro AI</p>
        </div>

        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="auth-form-head">
            <h2>{mode === "login" ? "Đăng nhập tài khoản" : "Tạo tài khoản mới"}</h2>
            <p>
              {mode === "login"
                ? "Nhập email và mật khẩu của bạn để truy cập dự án."
                : "Điền thông tin để bắt đầu sử dụng không gian làm việc."}
            </p>
          </div>

          {notice && <p className="form-notice" role="status">{notice}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          {mode === "register" && (
            <label className="field">
              <span>Họ và tên</span>
              <input
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={pending}
                placeholder="Ví dụ: Lê Đình Bảo"
                aria-invalid={!!fields.displayName}
              />
              {fields.displayName?.map((message) => (
                <span className="field-error" key={message}>{message}</span>
              ))}
            </label>
          )}

          <label className="field">
            <span>Địa chỉ Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
              placeholder="ten@congty.com"
              aria-invalid={!!fields.email}
            />
            {fields.email?.map((message) => (
              <span className="field-error" key={message}>{message}</span>
            ))}
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
              placeholder="••••••••"
              aria-invalid={!!fields.password}
            />
            {fields.password?.map((message) => (
              <span className="field-error" key={message}>{message}</span>
            ))}
          </label>

          <button className="button button-primary auth-submit-btn" disabled={pending} type="submit">
            {pending ? "Đang xác thực…" : mode === "login" ? "Đăng nhập vào hệ thống" : "Đăng ký thành viên"}
          </button>

          <div className="auth-switch-link">
            {mode === "login" ? (
              <span>
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-link">
                  Đăng ký ngay
                </Link>
              </span>
            ) : (
              <span>
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-link">
                  Đăng nhập
                </Link>
              </span>
            )}
          </div>

          {mode === "login" && (
            <div className="auth-demo-section">
              <span className="auth-demo-label">Tài khoản kiểm thử nhanh (Demo):</span>
              <div className="auth-demo-chips">
                <button
                  type="button"
                  className="auth-chip"
                  onClick={() => fillDemoAccount("manager@example.com")}
                  title="Điền tài khoản Quản lý Lê Đình Bảo"
                >
                  <span className="chip-badge chip-mgr">A</span>
                  <span>Trưởng nhóm (Lê Đình Bảo)</span>
                </button>
                <button
                  type="button"
                  className="auth-chip"
                  onClick={() => fillDemoAccount("designer@example.com")}
                  title="Điền tài khoản Thành viên Trần An"
                >
                  <span className="chip-badge chip-mem">R</span>
                  <span>Thiết kế (Trần An)</span>
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="auth-footer-tag">
          CWRM Platform · Chuẩn phân định trách nhiệm RACI & Cảnh báo rủi ro tiến độ
        </p>
      </div>
    </main>
  );
}
