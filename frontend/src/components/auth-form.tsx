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
    <main className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="login-intro">
        <div className="login-logo-lockup">
          <span className="login-mark" aria-hidden="true">C</span>
          <span className="login-brand-name">CWRM Platform</span>
        </div>
        <h1>Công việc rõ người, rủi ro rõ bằng chứng.</h1>
        <p className="login-intro-lead">
          Nền tảng điều hành dự án phần mềm theo chuẩn RACI, quản lý hàng đợi nhận việc và tự động phát hiện rủi ro tiến độ bằng AI.
        </p>

        <div className="login-features">
          <div className="login-feature-item">
            <span className="login-feature-icon">✓</span>
            <div>
              <strong>Minh bạch trách nhiệm RACI</strong>
              <p>Mỗi công việc có đúng 1 Accountable nghiệm thu duy nhất và các Responsible thực hiện rõ ràng.</p>
            </div>
          </div>
          <div className="login-feature-item">
            <span className="login-feature-icon">✓</span>
            <div>
              <strong>Hàng đợi nhận việc mở (Open Work)</strong>
              <p>Thành viên tự ứng tuyển việc phù hợp với kỹ năng; quản lý phê duyệt công khai, bình đẳng.</p>
            </div>
          </div>
          <div className="login-feature-item">
            <span className="login-feature-icon">✓</span>
            <div>
              <strong>Cảnh báo rủi ro sớm bằng dữ liệu</strong>
              <p>Hệ thống AI giám sát liên tục tiến độ, thời hạn và điểm nghẽn để cảnh báo trước khi trễ hạn.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-container">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
          <p className="login-subtitle">
            {mode === "login"
              ? "Nhập email và mật khẩu để vào không gian làm việc."
              : "Điền thông tin để bắt đầu sử dụng hệ thống."}
          </p>

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
                placeholder="Ví dụ: Lê Đình Bảo"
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
              placeholder="••••••••"
              aria-invalid={!!fields.password}
            />
            {fields.password?.map((message) => (
              <span className="field-error" key={message}>{message}</span>
            ))}
          </label>

          <button className="button button-primary login-btn" disabled={pending} type="submit">
            {pending ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
          </button>

          <div className="login-divider">
            <span>hoặc</span>
          </div>

          <Link
            href={mode === "login" ? "/register" : "/login"}
            className={mode === "login" ? "button button-success-register" : "text-link align-center"}
          >
            {mode === "login" ? "Tạo tài khoản mới" : "Đã có tài khoản? Đăng nhập"}
          </Link>

          {mode === "login" && (
            <div className="demo-accounts-box">
              <span className="demo-accounts-title">Tài khoản thử nghiệm:</span>
              <div className="demo-accounts-buttons">
                <button
                  type="button"
                  className="demo-account-pill"
                  onClick={() => fillDemoAccount("manager@example.com")}
                  title="Điền tài khoản Trưởng nhóm"
                >
                  Trưởng nhóm (Manager)
                </button>
                <button
                  type="button"
                  className="demo-account-pill"
                  onClick={() => fillDemoAccount("designer@example.com")}
                  title="Điền tài khoản Thiết kế"
                >
                  Thiết kế (Designer)
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
