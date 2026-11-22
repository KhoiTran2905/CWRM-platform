"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientApiError, readApiResponse } from "@/lib/auth/client";
import type { FieldErrors } from "@/lib/auth/types";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CheckSquare,
} from "lucide-react";

export function AuthForm({ mode, notice }: { mode: "login" | "register"; notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <main className="auth-split-wrapper">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>

      {/* Left Column: B2B SaaS Showcase & Product Values */}
      <section className="auth-showcase-pane">
        <div className="showcase-content">
          <div className="showcase-brand">
            <span className="showcase-brand-mark">
              C<span className="showcase-dot" />
            </span>
            <span className="showcase-pill">
              <Sparkles size={13} className="text-sky-400" />
              <span>CWRM PLATFORM · B2B SAAS</span>
            </span>
          </div>

          <h1 className="showcase-title">
            Công việc rõ người, <br />
            <span className="text-sky-400">rủi ro rõ bằng chứng.</span>
          </h1>

          <p className="showcase-desc">
            Nền tảng điều phối công việc liên phòng ban, phân định trách nhiệm theo ma trận RACI và kiểm soát rủi ro AI theo thời gian thực.
          </p>

          {/* Interactive Feature Previews to eliminate generic AI template feel */}
          <div className="showcase-previews">
            {/* RACI Card Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <div className="flex items-center gap-2">
                  <div className="preview-icon-box bg-sky-500/10 text-sky-400">
                    <CheckSquare size={16} />
                  </div>
                  <div>
                    <strong className="text-xs text-white">TASK-104: Chuẩn bị trang đích</strong>
                    <div className="text-[11px] text-slate-400">Phân công RACI trực tiếp</div>
                  </div>
                </div>
                <span className="status-pill status-pill-success">
                  <span className="status-pill-dot" />
                  Đang thực hiện
                </span>
              </div>
              <div className="preview-raci-row">
                <span className="raci-chip raci-chip-a">
                  <strong>A</strong> T.M. Khôi (Tech Lead)
                </span>
                <span className="raci-chip raci-chip-r">
                  <strong>R</strong> Đ.V. Hiệp (Frontend)
                </span>
              </div>
            </div>

            {/* AI Risk Card Preview */}
            <div className="preview-card">
              <div className="preview-card-header">
                <div className="flex items-center gap-2">
                  <div className="preview-icon-box bg-amber-500/10 text-amber-400">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <strong className="text-xs text-white">R01: Tiến độ chậm 3 ngày</strong>
                    <div className="text-[11px] text-slate-400">Cảnh báo rủi ro tự động</div>
                  </div>
                </div>
                <span className="status-pill status-pill-warn">
                  <span className="status-pill-dot" />
                  Rủi ro Trung bình
                </span>
              </div>
              <div className="preview-risk-meta">
                <span>Độ tin cậy AI: <strong>94%</strong></span>
                <span>Bằng chứng: <strong>1 tài liệu</strong></span>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users size={14} className="text-sky-400" />
              <span>Chuẩn hóa quy trình điều phối dự án và kiểm duyệt nghiệm thu.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Clean, Polished Auth Form */}
      <section className="auth-form-pane">
        <div className="auth-card-box">
          <div className="auth-header">
            <div className="auth-logo-mini">
              <span>C</span>
            </div>
            <h2>{mode === "login" ? "Đăng nhập hệ thống" : "Tạo tài khoản mới"}</h2>
            <p>
              {mode === "login"
                ? "Chào mừng bạn trở lại! Nhập thông tin để vào Không gian làm việc."
                : "Điền thông tin bên dưới để bắt đầu quản lý dự án với CWRM."}
            </p>
          </div>

          {notice && (
            <div className="auth-alert alert-notice" role="status">
              <CheckCircle2 size={17} className="flex-shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="auth-alert alert-error" role="alert">
              <AlertCircle size={17} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form-fields" onSubmit={submit} noValidate>
            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="displayName">Tên hiển thị</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    id="displayName"
                    autoComplete="name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Ví dụ: Đặng Văn Hiệp"
                    disabled={pending}
                    aria-invalid={!!fields.displayName}
                  />
                </div>
                {fields.displayName?.map((msg) => (
                  <p key={msg} className="field-hint-error">{msg}</p>
                ))}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email tài khoản</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  disabled={pending}
                  aria-invalid={!!fields.email}
                />
              </div>
              {fields.email?.map((msg) => (
                <p key={msg} className="field-hint-error">{msg}</p>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  disabled={pending}
                  aria-invalid={!!fields.password}
                />
                <button
                  type="button"
                  className="input-trailing-action"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === "register" && (
                <span className="field-hint">Tối thiểu 8 ký tự, tối đa 72 byte UTF-8.</span>
              )}
              {fields.password?.map((msg) => (
                <p key={msg} className="field-hint-error">{msg}</p>
              ))}
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    disabled={pending}
                    aria-invalid={!!fields.confirmPassword}
                  />
                  <button
                    type="button"
                    className="input-trailing-action"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fields.confirmPassword?.map((msg) => (
                  <p key={msg} className="field-hint-error">{msg}</p>
                ))}
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Đang xử lý…</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch-row">
            {mode === "login" ? (
              <p>
                Chưa có tài khoản?{" "}
                <Link href="/register" className="auth-link">
                  Đăng ký ngay
                </Link>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{" "}
                <Link href="/login" className="auth-link">
                  Đăng nhập
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
