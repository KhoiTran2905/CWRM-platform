import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { listTasks } from "@/lib/api/client";
import { requireWorkspace } from "@/lib/auth/server";
import { isDemoWorkspace } from "@/lib/demo-data";
import {
  FolderKanban,
  Clock,
  AlertCircle,
  ShieldAlert,
  Users,
  CheckSquare,
  Search,
  UserCheck,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function WorkspaceHome() {
  const workspace = await requireWorkspace();
  const isDemo = isDemoWorkspace(workspace.id);
  const tasks = isDemo ? await listTasks() : [];

  const inProgress = tasks.filter((t) => t.status === "In Progress" || t.status === "IN_PROGRESS");
  const blocked = tasks.filter((t) => t.status === "Blocked" || t.status === "BLOCKED");
  const awaitingReview = tasks.filter((t) => t.status === "Review" || t.status === "REVIEW");
  const highRisk = tasks.filter((t) => t.riskLevel === "High" || t.riskLevel === "HIGH");

  const progressPercent = isDemo ? 65 : 0;

  return (
    <AppShell>
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
              <Plus size={15} />
              <span>Tạo công việc</span>
            </Link>
          </div>
        }
      />

      {/* Project Hero Banner with Visual Progress Bar */}
      <section className="panel modern-project-hero">
        <div className="hero-top-row">
          <div className="hero-title-area">
            <div className="flex items-center gap-2 mb-1">
              <span className={`status-pill ${isDemo ? "status-pill-success" : "status-pill-info"}`}>
                <span className="status-pill-dot" />
                {isDemo ? "Đang vận hành" : "Dự án mới"}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Mã dự án: #{workspace.id.slice(0, 8)}
              </span>
            </div>
            <h2>{isDemo ? "Chiến dịch Quảng bá & Ra mắt Sản phẩm (Q4)" : `Dự án: ${workspace.name}`}</h2>
            <p>
              {isDemo
                ? "Cột mốc mục tiêu: Campaign Launch · Hạn chót hoàn thành sau 14 ngày."
                : `Không gian dự án: ${workspace.name} · Khởi tạo sẵn sàng cho Sprint.`}
            </p>
          </div>

          <div className="hero-stats-group">
            <div className="hero-stat-card">
              <div className="hero-stat-icon text-sky-500 bg-sky-500/10">
                <TrendingUp size={18} />
              </div>
              <div className="hero-stat-body">
                <span className="hero-stat-label">Tiến độ tổng thể</span>
                <strong className="hero-stat-value text-sky-600 dark:text-sky-400">
                  {progressPercent}%
                </strong>
              </div>
            </div>

            <div className="hero-stat-card">
              <div className="hero-stat-icon text-indigo-500 bg-indigo-500/10">
                <Users size={18} />
              </div>
              <div className="hero-stat-body">
                <span className="hero-stat-label">Thành viên</span>
                <strong className="hero-stat-value text-slate-800 dark:text-slate-100">
                  {isDemo ? "3 người" : "1 người"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar Strip */}
        <div className="hero-progress-container">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium text-slate-500">
            <span>Tiến độ thực tế toàn dự án</span>
            <span>{isDemo ? "5 / 8 công việc đã hoàn thành hoặc đang chạy" : "0 / 0 công việc"}</span>
          </div>
          <div className="hero-progress-track">
            <div
              className="hero-progress-fill"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </section>

      {/* KPI Metric Cards with Pastel Icons */}
      <section className="modern-kpi-grid" aria-label="Chỉ số dự án">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
            <FolderKanban size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng số công việc</span>
            <strong className="kpi-number">{tasks.length}</strong>
            <small className="kpi-hint">Đã lập kế hoạch</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Đang thực hiện</span>
            <strong className="kpi-number text-blue-600 dark:text-blue-400">{inProgress.length}</strong>
            <small className="kpi-hint">Triển khai đúng hạn</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Đang nghẽn (Blocked)</span>
            <strong className={`kpi-number ${blocked.length ? "text-amber-600 dark:text-amber-400" : ""}`}>
              {blocked.length}
            </strong>
            <small className="kpi-hint">{blocked.length ? "Cần hỗ trợ tháo gỡ" : "Không có blocker"}</small>
          </div>
        </div>

        <div className="kpi-card kpi-card-danger">
          <div className="kpi-icon-wrapper bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlert size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Rủi ro cao (AI)</span>
            <strong className="kpi-number text-rose-600 dark:text-rose-400">{highRisk.length}</strong>
            <small className="kpi-hint">{highRisk.length ? "Cần xử lý hạn chót" : "Hệ thống an toàn"}</small>
          </div>
        </div>
      </section>

      {/* Main Grid: Quick Actions & Priority Tasks */}
      <div className="modern-ws-grid">
        <div className="ws-col">
          <section className="panel flex-1">
            <div className="section-header">
              <div>
                <p className="eyebrow">HÀNH ĐỘNG NHANH</p>
                <h2>Tác nghiệp điều hành</h2>
              </div>
            </div>
            <div className="hub-quick-grid">
              <Link href="/tasks" className="hub-action-card">
                <div className="hub-action-icon text-sky-500 bg-sky-500/10">
                  <CheckSquare size={20} />
                </div>
                <strong>Quản lý công việc</strong>
                <span>Toàn bộ task & RACI</span>
              </Link>

              <Link href="/review" className="hub-action-card">
                <div className="hub-action-icon text-indigo-500 bg-indigo-500/10">
                  <Search size={20} />
                </div>
                <strong>Nghiệm thu</strong>
                <span>{awaitingReview.length} task đang chờ A duyệt</span>
              </Link>

              <Link href="/risk" className="hub-action-card">
                <div className="hub-action-icon text-amber-500 bg-amber-500/10">
                  <ShieldAlert size={20} />
                </div>
                <strong>Kiểm soát rủi ro AI</strong>
                <span>Chẩn đoán & bằng chứng</span>
              </Link>

              <Link href="/my-work" className="hub-action-card">
                <div className="hub-action-icon text-emerald-500 bg-emerald-500/10">
                  <UserCheck size={20} />
                </div>
                <strong>Nhiệm vụ trực tiếp</strong>
                <span>Bàn giao & nhận việc</span>
              </Link>
            </div>
          </section>
        </div>

        <div className="ws-col">
          <section className="panel flex-1">
            <div className="section-header">
              <div>
                <p className="eyebrow">TIẾN ĐỘ THỰC TẾ</p>
                <h2>Công việc trọng tâm ({tasks.length})</h2>
              </div>
              <Link href="/tasks" className="text-link flex items-center gap-1 text-xs">
                <span>Xem tất cả</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="ws-scroll-area">
              {tasks.length === 0 ? (
                <div className="empty-workspace-state">
                  <div className="empty-icon-circle">
                    <FolderKanban size={32} />
                  </div>
                  <h3>Chưa có công việc nào trong dự án này</h3>
                  <p>
                    Không gian <strong>&quot;{workspace.name}&quot;</strong> vừa được khởi tạo thành công. Bạn có thể bắt đầu tạo task mới.
                  </p>
                  <Link href="/tasks/new" className="button button-primary">
                    <Plus size={15} />
                    <span>Tạo công việc đầu tiên</span>
                  </Link>
                </div>
              ) : (
                tasks.map((task) => (
                  <Link href={`/tasks/${task.id}`} className="modern-task-row" key={task.id}>
                    <div className="task-row-left">
                      <span className="task-code-badge">{task.id}</span>
                      <div className="task-row-details">
                        <span className="task-row-title">{task.title}</span>
                        <span className="task-row-meta">{task.team} · Tiến độ: {task.progress}%</span>
                      </div>
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
