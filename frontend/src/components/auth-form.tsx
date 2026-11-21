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
  const [confirmPassword, setConfirmPassword] = useState("");
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
      if (Array.from(password).length < 8) {
        nextFields.password = ["Mật khẩu phải có ít nhất 8 ký tự."];
      } else if (new TextEncoder().encode(password).length > 72) {
        nextFields.password = ["Mật khẩu không được vượt quá 72 byte UTF-8."];
      }
      if (!confirmPassword) {
        nextFields.confirmPassword = ["Vui lòng nhập lại mật khẩu để xác nhận."];
      } else if (confirmPassword !== password) {
        nextFields.confirmPassword = ["Mật khẩu xác nhận không khớp với mật khẩu đã nhập."];
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
        setError("Không thể gửi yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="login-intro">
        <span className="login-mark">C</span>
        <p className="eyebrow">CWRM PLATFORM</p>
        <h1>Công việc rõ người, rủi ro rõ bằng chứng.</h1>
        <p>
          {mode === "login"
            ? "Đăng nhập để vào Workspace của bạn."
            : "Đăng ký tài khoản để bắt đầu quản lý dự án và phân định trách nhiệm RACI."}
        </p>
      </div>
      <form className="login-card" onSubmit={submit} noValidate>
        <h2>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
        <p>{mode === "login" ? "Sử dụng tài khoản từ CWRM API." : "Nhập thông tin bên dưới để đăng ký tài khoản mới."}</p>
        {notice && <p className="form-notice" role="status">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {mode === "register" && (
          <label className="field">
            Tên hiển thị
            <input
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={pending}
              placeholder="Ví dụ: Nguyễn Văn A"
              aria-invalid={!!fields.displayName}
            />
            {fields.displayName?.map((message) => (
              <span className="field-error" key={message}>{message}</span>
            ))}
          </label>
        )}
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            placeholder="name@example.com"
            aria-invalid={!!fields.email}
          />
          {fields.email?.map((message) => (
            <span className="field-error" key={message}>{message}</span>
          ))}
        </label>
        <label className="field">
          Mật khẩu
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            placeholder={mode === "register" ? "Tối thiểu 8 ký tự" : "••••••••"}
            aria-invalid={!!fields.password}
          />
          {mode === "register" && (
            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 450, marginTop: "-2px" }}>
              Quy định: Ít nhất 8 ký tự (tối đa 72 byte).
            </span>
          )}
          {fields.password?.map((message) => (
            <span className="field-error" key={message}>{message}</span>
          ))}
        </label>
        {mode === "register" && (
          <label className="field">
            Xác nhận mật khẩu
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={pending}
              placeholder="Nhập lại mật khẩu"
              aria-invalid={!!fields.confirmPassword}
            />
            {fields.confirmPassword?.map((message) => (
              <span className="field-error" key={message}>{message}</span>
            ))}
          </label>
        )}
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
        </button>
        <Link href={mode === "login" ? "/register" : "/login"} className="text-link">
          {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </Link>
      </form>
    </main>
  );
}
