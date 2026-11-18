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
    setError(""); setFields({});
    const nextFields: FieldErrors = {};
    if (!email.trim() || Array.from(email.trim()).length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextFields.email = ["Nhập email hợp lệ (tối đa 320 ký tự)."];
    if (!password) nextFields.password = ["Nhập mật khẩu."];
    if (mode === "register") {
      if (!displayName.trim() || Array.from(displayName.trim()).length > 120) nextFields.displayName = ["Tên hiển thị cần từ 1 đến 120 ký tự."];
      if (Array.from(password).length < 8 || new TextEncoder().encode(password).length > 72) nextFields.password = ["Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte."];
    }
    if (Object.keys(nextFields).length) { setFields(nextFields); return; }
    setPending(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { email: email.trim(), password, displayName: displayName.trim() } : { email: email.trim(), password }),
      });
      await readApiResponse(response);
      router.replace(mode === "register" ? "/login?registered=1" : "/workspaces");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ClientApiError) {
        setError(caught.message); setFields(caught.fields);
      } else setError("Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally { setPending(false); }
  }

  return <main className="login-page">
    <div className="login-theme-toggle"><ThemeToggle /></div>
    <div className="login-intro"><span className="login-mark">C</span><p className="eyebrow">CWRM Platform</p><h1>Công việc rõ người, rủi ro rõ bằng chứng.</h1><p>Đăng nhập để vào Workspace của bạn. Các màn công việc hiện vẫn là giao diện minh họa.</p></div>
    <form className="login-card" onSubmit={submit} noValidate>
      <h2>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
      <p>{mode === "login" ? "Sử dụng tài khoản từ CWRM API." : "Sau khi đăng ký, hãy đăng nhập để bắt đầu."}</p>
      {notice && <p className="form-notice" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {mode === "register" && <label className="field">Tên hiển thị<input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={pending} aria-invalid={!!fields.displayName} />{fields.displayName?.map((message) => <span className="field-error" key={message}>{message}</span>)}</label>}
      <label className="field">Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} aria-invalid={!!fields.email} />{fields.email?.map((message) => <span className="field-error" key={message}>{message}</span>)}</label>
      <label className="field">Mật khẩu<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} aria-invalid={!!fields.password} />{fields.password?.map((message) => <span className="field-error" key={message}>{message}</span>)}</label>
      <button className="button button-primary" disabled={pending} type="submit">{pending ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký"}</button>
      <Link href={mode === "login" ? "/register" : "/login"} className="text-link">{mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}</Link>
    </form>
  </main>;
}
