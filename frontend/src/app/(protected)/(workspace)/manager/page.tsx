import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { TaskTable } from "@/components/task-table";
import { listTasks } from "@/lib/api/client";
import { requireWorkspace } from "@/lib/auth/server";
import { isDemoWorkspace } from "@/lib/demo-data";
import {
  FolderKanban,
  Clock,
  AlertCircle,
  ShieldAlert,
  Plus,
} from "lucide-react";

export default async function ManagerPage() {
  const workspace = await requireWorkspace();
  const isDemo = isDemoWorkspace(workspace.id);
  const demoTasks = isDemo ? await listTasks() : [];
  const interventionTasks = demoTasks.filter(
    (task) =>
      task.riskLevel === "High" ||
      task.riskLevel === "Medium" ||
      task.riskLevel === "HIGH" ||
      task.riskLevel === "MEDIUM"
  );
  const highRisk = interventionTasks.filter((task) => task.riskLevel === "High" || task.riskLevel === "HIGH");
  const blocked = demoTasks.filter((task) => task.status === "Blocked" || task.status === "BLOCKED");
  const inProgress = demoTasks.filter((task) => task.status === "In Progress" || task.status === "IN_PROGRESS");
  const awaitingReview = demoTasks.filter((task) => task.status === "Review" || task.status === "REVIEW");

  return (
    <AppShell>
      <style>{`
        .mgr-page-grid {
          display: grid;
          grid-template-columns: 400px minmax(0, 1fr);
          gap: 12px;
          flex: 1;
          min-height: 0;
        }
        .mgr-col-left {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 0;
        }
        .mgr-col-right {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .mgr-col-right .panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          margin-bottom: 0;
        }
        .mgr-scroll-box {
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-right: 4px;
        }
        .mgr-priority-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-top: 3px solid var(--danger);
          margin-bottom: 0;
        }
        .mgr-review-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-top: 3px solid var(--primary);
          margin-bottom: 0;
        }
        .mgr-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 10px;
          flex-shrink: 0;
        }
        .mgr-metrics .metric-card { min-height: 58px; padding: 7px 12px; }
        .mgr-metrics .metric-card strong { margin-top: 1px; font-size: 21px; line-height: 1; }
        .mgr-metrics .metric-card small { margin-top: 1px; font-size: 10px; }
        .mgr-review-list { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .mgr-review-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 10px; background: var(--card); border-bottom: 1px solid var(--border-soft); }
        .mgr-review-row:last-child { border-bottom: 0; }
        .mgr-review-row:hover { background: var(--card-soft); }
        .mgr-review-main { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .mgr-review-line { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .mgr-code { flex-shrink: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; font-variant-numeric: tabular-nums; font-size: 9.5px; font-weight: 700; color: var(--faint); }
        .mgr-review-title { color: var(--heading); font-size: 12px; font-weight: 700; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mgr-review-title:hover { color: var(--accent-text); }
        .mgr-review-meta { color: var(--muted); font-size: 10px; }
        .mgr-review-action { flex-shrink: 0; min-height: 26px; padding: 0 10px; border-radius: 6px; font-size: 11px; }
        .risk-row { padding: 6px 10px; margin-top: 4px; gap: 8px; }
        .risk-row-main strong { font-size: 12.5px; }
        .risk-row-main span, .risk-row-evidence { font-size: 10.5px; }
        @media (max-width: 1024px) {
          .mgr-page-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .mgr-review-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .mgr-review-action { width: 100%; text-align: center; }
        }
      `}</style>
      <PageHeading
        eyebrow="TỔNG QUAN ĐIỀU HÀNH"
        title="Bàn làm việc Trưởng nhóm"
        description="Ưu tiên theo dõi công việc có rủi ro và xử lý các kết quả đang chờ nghiệm thu."
        action={
          <Link className="button button-primary flex items-center gap-1.5" href="/tasks/new">
            <Plus size={15} />
            <span>Tạo công việc</span>
          </Link>
        }
      />

      <section className="modern-kpi-grid" aria-label="Chỉ số tổng quan">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
            <FolderKanban size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng công việc</span>
            <strong className="kpi-number">{demoTasks.length}</strong>
            <small className="kpi-hint">Toàn bộ dự án</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Đang thực hiện</span>
            <strong className="kpi-number text-blue-600 dark:text-blue-400">{inProgress.length}</strong>
            <small className="kpi-hint">Đang triển khai</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Đang nghẽn</span>
            <strong className={`kpi-number ${blocked.length ? "text-amber-600 dark:text-amber-400" : ""}`}>
              {blocked.length}
            </strong>
            <small className="kpi-hint">Cần gỡ blocker</small>
          </div>
        </div>

        <div className="kpi-card kpi-card-danger">
          <div className="kpi-icon-wrapper bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlert size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Rủi ro Cao (AI)</span>
            <strong className="kpi-number text-rose-600 dark:text-rose-400">{highRisk.length}</strong>
            <small className="kpi-hint">Cần quyết định can thiệp</small>
          </div>
        </div>
      </section>

      <div className="mgr-page-grid">
        <div className="mgr-col-left">
          <section className="panel mgr-priority-card">
            <div className="section-header">
              <div><p className="eyebrow">ƯU TIÊN</p><h2>Công việc có rủi ro ({interventionTasks.length})</h2></div>
              <Link href="/risk" className="text-link">Chi tiết →</Link>
            </div>
            <div className="mgr-scroll-box">
              {interventionTasks.length > 0 ? (
                interventionTasks.map((task) => (
                  <Link className={`risk-row ${task.riskLevel === "Medium" || task.riskLevel === "MEDIUM" ? "risk-row-medium" : ""}`} key={task.id} href={`/tasks/${task.id}`}>
                    <div className="risk-indicator" aria-hidden="true" />
                    <div className="risk-row-main">
                      <strong>{task.title}</strong>
                      <span>{task.id} · {task.team} · R: {task.responsible ?? "Chưa có"}</span>
                    </div>
                    <StatusBadge kind="riskLevel" value={task.riskLevel} />
                  </Link>
                ))
              ) : (
                <p className="helper-note" style={{ margin: 0, padding: "12px 6px" }}>Không có rủi ro nào cần xử lý.</p>
              )}
            </div>
          </section>

          <section className="panel mgr-review-card">
            <div className="section-header">
              <div><p className="eyebrow">NGHIỆM THU</p><h2>Hàng chờ Nghiệm thu ({awaitingReview.length})</h2></div>
              <Link href="/review" className="text-link">Toàn bộ →</Link>
            </div>
            <div className="mgr-scroll-box">
              {awaitingReview.length > 0 ? (
                <div className="mgr-review-list">
                  {awaitingReview.map((task) => (
                    <div className="mgr-review-row" key={task.id}>
                      <div className="mgr-review-main">
                        <div className="mgr-review-line">
                          <span className="mgr-code">{task.id}</span>
                          <Link href={`/tasks/${task.id}`} className="mgr-review-title">{task.title}</Link>
                        </div>
                        <span className="mgr-review-meta">{task.team} · {task.progress}%</span>
                      </div>
                      <Link href={`/tasks/${task.id}`} className="button button-primary mgr-review-action">Nghiệm thu</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="helper-note" style={{ margin: 0 }}>Không có task chờ duyệt.</p>
              )}
            </div>
          </section>
        </div>

        <div className="mgr-col-right">
          <section className="panel">
            <div className="section-header">
              <div><p className="eyebrow">TIẾN ĐỘ THỰC TẾ</p><h2>Danh sách công việc dự án</h2></div>
              <Link href="/tasks" className="text-link">Toàn màn hình →</Link>
            </div>
            <TaskTable tasks={demoTasks} />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
