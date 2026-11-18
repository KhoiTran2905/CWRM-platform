"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAppContext } from "@/components/app-context";
import { ClientApiError, readApiResponse } from "@/lib/auth/client";
import type { Workspace, WorkspacePage } from "@/lib/auth/types";

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
      .then((result) => { setData(result); setLoading(false); })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        if (caught instanceof ClientApiError && caught.status === 401) { router.replace("/login?expired=1"); return; }
        setError(caught instanceof Error ? caught.message : "Không tải được Workspace.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [page, reload, router]);

  function changePage(nextPage: number) { setLoading(true); setData(null); setError(""); setPage(nextPage); }
  function retry() { setLoading(true); setData(null); setError(""); setReload((value) => value + 1); }

  async function select(workspace: Workspace) {
    setPendingId(workspace.id); setError("");
    try {
      await readApiResponse(await fetch("/api/workspaces/select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: workspace.id }) }));
      router.replace("/workspace"); router.refresh();
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.status === 401) { router.replace("/login?expired=1"); return; }
      setError(caught instanceof Error ? caught.message : "Không chọn được Workspace.");
    } finally { setPendingId(null); }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || Array.from(trimmed).length > 160) { setError("Tên Workspace cần từ 1 đến 160 ký tự."); return; }
    setCreating(true); setError("");
    try {
      const response = await fetch("/api/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: trimmed }) });
      const workspace = await readApiResponse<Workspace>(response);
      setName("");
      await select(workspace);
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.status === 401) { router.replace("/login?expired=1"); return; }
      setError(caught instanceof Error ? caught.message : "Không tạo được Workspace.");
    } finally { setCreating(false); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login"); router.refresh();
  }

  return <main className="workspace-page">
    <header className="workspace-header"><div><p className="eyebrow">CWRM Platform</p><h1>Chọn Workspace</h1><p>Xin chào {account.displayName}. Chọn nơi làm việc của bạn hoặc tạo Workspace mới.</p></div><button className="button button-secondary" onClick={logout}>Đăng xuất</button></header>
    {selected && <p className="form-notice">Đang chọn: <strong>{selected.name}</strong></p>}
    {error && <div className="form-error" role="alert">{error} <button type="button" className="text-link" onClick={retry}>Thử tải lại</button></div>}
    <section className="workspace-panel"><h2>Workspace của bạn</h2>
      {loading ? <p role="status">Đang tải Workspace…</p> : data?.items.length ? <div className="workspace-list">{data.items.map((workspace) => <button key={workspace.id} className="workspace-item" onClick={() => void select(workspace)} disabled={!!pendingId || creating}><strong>{workspace.name}</strong><span>{pendingId === workspace.id ? "Đang mở…" : "Mở Workspace →"}</span></button>)}</div> : <p>Bạn chưa có Workspace nào. Hãy tạo Workspace đầu tiên bên dưới.</p>}
      {data && data.total > data.pageSize && <div className="button-row workspace-pagination"><button className="button button-secondary" disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>Trang trước</button><span>Trang {page} / {Math.ceil(data.total / data.pageSize)}</span><button className="button button-secondary" disabled={page >= Math.ceil(data.total / data.pageSize) || loading} onClick={() => changePage(page + 1)}>Trang sau</button></div>}
    </section>
    <form className="workspace-panel workspace-create" onSubmit={create}><h2>Tạo Workspace mới</h2><label className="field">Tên Workspace<input value={name} onChange={(event) => setName(event.target.value)} disabled={creating} placeholder="Ví dụ: Dự án CWRM" /></label><button className="button button-primary" disabled={creating}>{creating ? "Đang tạo…" : "Tạo Workspace"}</button></form>
  </main>;
}
