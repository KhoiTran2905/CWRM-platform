import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { listTasks } from "@/lib/api/client";
import { requireWorkspace } from "@/lib/auth/server";
import { isDemoWorkspace } from "@/lib/demo-data";

export default async function WorkspaceHome() {
  const workspace = await requireWorkspace();
  const isDemo = isDemoWorkspace(workspace.id);
  const tasks = isDemo ? await listTasks() : [];

  const inProgress = tasks.filter((t) => t.status === "In Progress" || t.status === "IN_PROGRESS");
  const blocked = tasks.filter((t) => t.status === "Blocked" || t.status === "BLOCKED");
  const awaitingReview = tasks.filter((t) => t.status === "Review" || t.status === "REVIEW");
  const highRisk = tasks.filter((t) => t.riskLevel === "High" || t.riskLevel === "HIGH");

  return (
    <AppShell>
      <style>{`
        .ws-hero { padding: 10px 16px; margin-bottom: 10px; background: linear-gradient(135deg, var(--card) 0%, var(--card-soft) 100%); border-left: 4px solid var(--primary); }
        .ws-hero-content { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .ws-hero-main h2 { font-size: 16px; font-weight: 750; margin: 4px 0 2px; }
        .ws-hero-main p { margin: 0; color: var(--muted); font-size: 11.5px; }
        .ws-hero-stats { display: flex; align-items: center; gap: 10px; }
        .ws-stat-box { display: flex; flex-direction: column; padding: 5px 12px; background: var(--card); border: 1px solid var(--border); border-radius: 6px; }
        .ws-stat-box span { font-size: 10px; color: var(--muted); }
        .ws-stat-box strong { font-size: 17px; font-weight: 800; color: var(--primary); }
        .ws-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 10px; flex-shrink: 0; }
        .ws-metrics .metric-card { min-height: 56px; padding: 7px 12px; }
        .ws-metrics .metric-card strong { margin-top: 1px; font-size: 21px; line-height: 1; }
        .ws-metrics .metric-card small { margin-top: 1px; font-size: 10px; }
        .ws-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 12px; flex: 1; min-height: 0; }
        .ws-col { display: flex; flex-direction: column; min-height: 0; }
        .ws-col .panel { flex: 1; display: flex; flex-direction: column; min-height: 0; margin-bottom: 0; }
        .ws-scroll-area { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
        .hub-quick-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .hub-action-card { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--card-soft); transition: all .15s ease; }
        .hub-action-card:hover { border-color: var(--accent); background: var(--card); transform: translateY(-1px); }
        .hub-action-card strong { font-size: 12.5px; color: var(--heading); }
        .hub-action-card span { font-size: 11px; color: var(--muted); line-height: 1.35; }
        .hub-card-icon { font-size: 18px; margin-bottom: 2px; }
        .priority-task-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 10px; border-radius: 6px; background: var(--card-soft); border: 1px solid var(--border-soft); transition: background .12s ease; }
        .priority-task-item:hover { background: var(--card); border-color: var(--accent-border); }
        .priority-task-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .priority-task-title { font-size: 12px; font-weight: 700; color: var(--heading); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .priority-task-meta { font-size: 10.5px; color: var(--muted); }
        @media (max-width: 860px) {
          .ws-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <PageHeading
        eyebrow="KHÔNG GIAN LÀM VIỆC DỰ ÁN"
        title={workspace.name}
        description="Bàn làm việc điều hành dự án: theo dõi tiến độ tổng thể, quản lý phân công RACI và giám sát rủi ro."
        action={
          <div className="button-row">
            <Link href="/workspaces" className="button button-secondary">
              Đổi Workspace
            </Link>
            <Link href="/tasks/new" className="button button-primary">
              + Tạo công việc
            </Link>
          </div>
        }
      />

      <section className="panel ws-hero">
        <div className="ws-hero-content">
          <div className="ws-hero-main">
            <span className={`status-badge ${isDemo ? "status-success" : "status-info"}`} style={{ padding: "1px 6px", fontSize: "11px" }}>
              <span className={`status-badge-dot ${isDemo ? "status-badge-dot-success" : "status-badge-dot-info"}`} />
              {isDemo ? "Đang vận hành" : "Dự án mới khởi tạo"}
            </span>
            <h2>{isDemo ? "Chiến dịch Quảng bá & Ra mắt Sản phẩm (Q4)" : `Dự án: ${workspace.name}`}</h2>
            <p>
              {isDemo
                ? "Cột mốc mục tiêu: Campaign Launch · Hạn chót hoàn thành sau 14 ngày."
                : `Không gian dự án: ${workspace.name} · Chưa thiết lập cột mốc mục tiêu.`}
            </p>
          </div>
          <div className="ws-hero-stats">
            <div className="ws-stat-box">
              <span>Tiến độ tổng thể</span>
              <strong>{isDemo ? "65%" : "0%"}</strong>
            </div>
            <div className="ws-stat-box">
              <span>Đội ngũ</span>
              <strong>{isDemo ? "3 người" : "1 người"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="ws-metrics" aria-label="Chỉ số dự án">
        <div className="metric-card">
          <span>Tổng số công việc</span>
          <strong>{tasks.length}</strong>
          <small>Đã lập kế hoạch</small>
        </div>
        <div className="metric-card">
          <span>Đang thực hiện</span>
          <strong>{inProgress.length}</strong>
          <small>Triển khai đúng hạn</small>
        </div>
        <div className="metric-card">
          <span>Đang nghẽn</span>
          <strong style={{ color: blocked.length ? "var(--warm)" : "inherit" }}>{blocked.length}</strong>
          <small>Cần tháo gỡ</small>
        </div>
        <div className="metric-card metric-alert">
          <span>Rủi ro cao (AI)</span>
          <strong>{highRisk.length}</strong>
          <small>Cần xử lý hạn chót</small>
        </div>
      </section>

      <div className="ws-grid">
        <div className="ws-col">
          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">HÀNH ĐỘNG NHANH</p>
                <h2>Tác nghiệp điều hành</h2>
              </div>
            </div>
            <div className="hub-quick-grid">
              <Link href="/tasks" className="hub-action-card">
                <div className="hub-card-icon">📋</div>
                <strong>Quản lý công việc</strong>
                <span>Toàn bộ task & RACI</span>
              </Link>
              <Link href="/review" className="hub-action-card">
                <div className="hub-card-icon">🔍</div>
                <strong>Nghiệm thu</strong>
                <span>{awaitingReview.length} task đang chờ A duyệt</span>
              </Link>
              <Link href="/risk" className="hub-action-card">
                <div className="hub-card-icon">⚠️</div>
                <strong>Kiểm soát rủi ro AI</strong>
                <span>Chẩn đoán R01–R03</span>
              </Link>
              <Link href="/my-work" className="hub-action-card">
                <div className="hub-card-icon">👤</div>
                <strong>Nhiệm vụ trực tiếp</strong>
                <span>Bàn giao & nhận việc</span>
              </Link>
            </div>
          </section>
        </div>

        <div className="ws-col">
          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">TIẾN ĐỘ THỰC TẾ</p>
                <h2>Công việc trọng tâm ({tasks.length})</h2>
              </div>
              <Link href="/tasks" className="text-link">Xem tất cả →</Link>
            </div>
            <div className="ws-scroll-area">
              {tasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 16px", color: "var(--muted)" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 6px", color: "var(--heading)" }}>
                    Chưa có công việc nào trong dự án này
                  </p>
                  <p style={{ fontSize: "12px", margin: "0 0 14px", lineHeight: 1.5 }}>
                    Không gian <strong>&quot;{workspace.name}&quot;</strong> vừa được khởi tạo thành công.
                  </p>
                  <Link href="/tasks/new" className="button button-primary" style={{ height: "34px", fontSize: "12px" }}>
                    + Tạo công việc đầu tiên
                  </Link>
                </div>
              ) : (
                tasks.map((task) => (
                  <Link href={`/tasks/${task.id}`} className="priority-task-item" key={task.id}>
                    <div className="priority-task-info">
                      <span className="priority-task-title">{task.title}</span>
                      <span className="priority-task-meta">{task.id} · {task.team} · Tiến độ: {task.progress}%</span>
                    </div>
                    <StatusBadge value={task.status} />
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
