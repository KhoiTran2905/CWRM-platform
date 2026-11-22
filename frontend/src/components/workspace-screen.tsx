"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAppContext } from "@/components/app-context";
import { ClientApiError, readApiResponse } from "@/lib/auth/client";
import type { Workspace, WorkspacePage } from "@/lib/auth/types";
import {
  FolderGit2,
  Plus,
  ArrowRight,
  LogOut,
  Loader2,
  Building2,
  AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function WorkspaceScreen() {
  const router = useRouter();
  const { account, workspace: selected } = useAppContext();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WorkspacePage | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/workspaces?page=${page}&pageSize=12`, { cache: "no-store", signal: controller.signal })
      .then((response) => readApiResponse<WorkspacePage>(response))
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        if (caught instanceof ClientApiError && caught.status === 401) {
          router.replace("/login?expired=1");
          return;
        }
        setError(caught instanceof Error ? caught.message : "Không tải được Workspace.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [page, reload, router]);

  function changePage(nextPage: number) {
    setLoading(true);
    setData(null);
    setError("");
    setPage(nextPage);
  }

  function retry() {
    setLoading(true);
    setData(null);
    setError("");
    setReload((value) => value + 1);
  }

  async function select(workspace: Workspace) {
    setPendingId(workspace.id);
    setError("");
    try {
      await readApiResponse(
        await fetch("/api/workspaces/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: workspace.id }),
        })
      );
      router.replace("/workspace");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.status === 401) {
        router.replace("/login?expired=1");
        return;
      }
      setError(caught instanceof Error ? caught.message : "Không chọn được Workspace.");
    } finally {
      setPendingId(null);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || Array.from(trimmed).length > 160) {
      setError("Tên Workspace cần từ 1 đến 160 ký tự.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const workspace = await readApiResponse<Workspace>(response);
      setName("");
      await select(workspace);
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.status === 401) {
        router.replace("/login?expired=1");
        return;
      }
      setError(caught instanceof Error ? caught.message : "Không tạo được Workspace.");
    } finally {
      setCreating(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="ws-picker-page">
      <header className="ws-picker-header">
        <div className="ws-picker-brand">
          <span className="brand-mark">
            C<span className="brand-mark-dot" />
          </span>
          <div>
            <p className="eyebrow">CWRM PLATFORM</p>
            <h1>Chọn Không gian làm việc</h1>
            <p className="text-slate-500 text-sm">
              Xin chào <strong>{account.displayName}</strong>. Chọn dự án làm việc của bạn hoặc khởi tạo Workspace mới.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="button button-secondary flex items-center gap-1.5" onClick={logout}>
            <LogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {selected && (
        <div className="ws-picker-active-notice">
          <Building2 size={16} className="text-sky-500" />
          <span>
            Workspace đang hoạt động: <strong>{selected.name}</strong>
          </span>
        </div>
      )}

      {error && (
        <div className="auth-alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button type="button" className="text-link text-xs ml-auto" onClick={retry}>
            Thử tải lại
          </button>
        </div>
      )}

      <div className="ws-picker-layout">
        {/* Workspace List Section */}
        <section className="ws-picker-panel">
          <div className="ws-panel-header">
            <div>
              <p className="eyebrow">DANH SÁCH</p>
              <h2>Không gian làm việc của bạn</h2>
            </div>
            {data && <span className="text-xs text-slate-500 font-medium">Tổng cộng: {data.total}</span>}
          </div>

          {loading ? (
            <div className="ws-loading-state">
              <Loader2 size={24} className="animate-spin text-sky-500" />
              <p>Đang tải danh sách Workspace…</p>
            </div>
          ) : data?.items.length ? (
            <div className="ws-cards-grid">
              {data.items.map((ws) => {
                const isCurrent = selected?.id === ws.id;
                const isPending = pendingId === ws.id;
                return (
                  <button
                    key={ws.id}
                    className={`ws-card-item ${isCurrent ? "ws-card-active" : ""}`}
                    onClick={() => void select(ws)}
                    disabled={!!pendingId || creating}
                  >
                    <div className="ws-card-top">
                      <div className="ws-card-icon">
                        <FolderGit2 size={20} />
                      </div>
                      {isCurrent && <span className="ws-active-badge">Đang chọn</span>}
                    </div>

                    <div className="ws-card-info">
                      <strong>{ws.name}</strong>
                      <small>Mã ID: #{ws.id.slice(0, 8)}</small>
                    </div>

                    <div className="ws-card-footer">
                      <span>{isPending ? "Đang mở…" : "Vào làm việc"}</span>
                      {isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ArrowRight size={14} className="ws-arrow" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-workspace-state">
              <div className="empty-icon-circle">
                <FolderGit2 size={32} />
              </div>
              <h3>Bạn chưa có Workspace nào</h3>
              <p>Hãy tạo Không gian làm việc đầu tiên ở khung bên cạnh để bắt đầu điều hành dự án.</p>
            </div>
          )}

          {data && data.total > data.pageSize && (
            <div className="button-row workspace-pagination">
              <button
                className="button button-secondary"
                disabled={page <= 1 || loading}
                onClick={() => changePage(page - 1)}
              >
                Trang trước
              </button>
              <span>
                Trang {page} / {Math.ceil(data.total / data.pageSize)}
              </span>
              <button
                className="button button-secondary"
                disabled={page >= Math.ceil(data.total / data.pageSize) || loading}
                onClick={() => changePage(page + 1)}
              >
                Trang sau
              </button>
            </div>
          )}
        </section>

        {/* Create Workspace Section */}
        <section className="ws-picker-panel ws-create-panel">
          <div className="ws-panel-header">
            <div>
              <p className="eyebrow">KHỞI TẠO</p>
              <h2>Tạo Workspace mới</h2>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Mỗi Workspace đại diện cho một dự án độc lập, có phân quyền điều phối RACI và luồng kiểm soát rủi ro riêng biệt.
          </p>

          <form onSubmit={create} className="ws-create-form">
            <div className="form-group">
              <label htmlFor="ws-name">Tên Workspace dự án</label>
              <div className="input-with-icon">
                <Building2 size={16} className="input-icon" />
                <input
                  id="ws-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={creating}
                  placeholder="Ví dụ: Chiến dịch Q4, Dự án Alpha…"
                />
              </div>
            </div>

            <button type="submit" className="button button-primary w-full" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang khởi tạo…</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Tạo Workspace ngay</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
