import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { listTasks } from "@/lib/api/client";
import { requireWorkspace } from "@/lib/auth/server";

export default async function WorkspaceHome() {
  const workspace = await requireWorkspace();
  const tasks = await listTasks();

  const inProgress = tasks.filter((t) => t.status === "In Progress" || t.status === "IN_PROGRESS");
  const blocked = tasks.filter((t) => t.status === "Blocked" || t.status === "BLOCKED");
  const awaitingReview = tasks.filter((t) => t.status === "Review" || t.status === "REVIEW");
  const highRisk = tasks.filter((t) => t.riskLevel === "High" || t.riskLevel === "HIGH");

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
              + Tạo công việc
            </Link>
          </div>
        }
      />

      <section className="panel workspace-hero-panel">
        <div className="workspace-hero-content">
          <div className="workspace-hero-main">
            <span className="status-badge status-success">
              <span className="status-badge-dot status-badge-dot-success" />
              Đang vận hành
            </span>
            <h2>Chiến dịch Quảng bá & Ra mắt Sản phẩm (Q4)</h2>
            <p>
              Cột mốc mục tiêu: <strong>Campaign Launch</strong> · Hạn chót hoàn thành sau 14 ngày.
            </p>
          </div>
          <div className="workspace-hero-stats">
            <div className="hero-stat-box">
              <span>Tiến độ tổng thể</span>
              <strong>65%</strong>
            </div>
            <div className="hero-stat-box">
              <span>Đội ngũ tham gia</span>
              <strong>3 thành viên</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid section-gap" aria-label="Chỉ số dự án">
        <div className="metric-card">
          <span>Tổng số công việc</span>
          <strong>{tasks.length}</strong>
          <small>Đã lập kế hoạch</small>
        </div>
        <div className="metric-card">
          <span>Đang thực hiện</span>
          <strong>{inProgress.length}</strong>
          <small>Đang triển khai đúng hạn</small>
        </div>
        <div className="metric-card">
          <span>Đang bị nghẽn (Blocked)</span>
          <strong style={{ color: blocked.length ? "var(--warm)" : "inherit" }}>{blocked.length}</strong>
          <small>Cần hỗ trợ tháo gỡ</small>
        </div>
        <div className="metric-card metric-alert">
          <span>Rủi ro cao (AI Alert)</span>
          <strong>{highRisk.length}</strong>
          <small>Cần điều chỉnh thời hạn</small>
        </div>
      </section>

      <div className="two-column-layout section-gap">
        <div className="hub-column">
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
                <span>Danh sách toàn bộ task, phân công RACI và tiến độ</span>
              </Link>
              <Link href="/review" className="hub-action-card">
                <div className="hub-card-icon">🔍</div>
                <strong>Kiểm duyệt & Nghiệm thu</strong>
                <span>{awaitingReview.length} task đang chờ Manager nghiệm thu</span>
              </Link>
              <Link href="/risk" className="hub-action-card">
                <div className="hub-card-icon">⚠️</div>
                <strong>Kiểm soát rủi ro AI</strong>
                <span>Chẩn đoán nguyên nhân và bằng chứng rủi ro tự động</span>
              </Link>
              <Link href="/open-work" className="hub-action-card">
                <div className="hub-card-icon">📥</div>
                <strong>Hàng đợi nhận việc</strong>
                <span>Các vị trí Open Work công khai cho thành viên</span>
              </Link>
            </div>
          </section>

          <section className="panel section-gap">
            <div className="section-header">
              <div>
                <p className="eyebrow">ƯU TIÊN XỬ LÝ</p>
                <h2>Công việc cần chú ý ngay</h2>
              </div>
              <Link href="/tasks" className="text-link">Xem tất cả ({tasks.length}) →</Link>
            </div>
            <div className="hub-task-list">
              {blocked.concat(awaitingReview).map((task) => (
                <div className="hub-task-row" key={task.id}>
                  <div className="hub-task-info">
                    <div className="hub-task-top">
                      <span className="font-mono tabular-nums hub-task-id">{task.id}</span>
                      <StatusBadge value={task.status} />
                      <StatusBadge kind="riskLevel" value={task.riskLevel} />
                    </div>
                    <Link href={`/tasks/${task.id}`} className="hub-task-title">
                      {task.title}
                    </Link>
                    <span className="hub-task-meta">
                      Phụ trách: <strong>{task.responsible ?? "Chưa chỉ định"}</strong> · Hạn: {task.deadlineLabel}
                    </span>
                  </div>
                  <Link href={`/tasks/${task.id}`} className="button button-secondary hub-task-btn">
                    Chi tiết
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="hub-side-column">
          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">ĐỘI NGŨ</p>
                <h2>Thành viên dự án</h2>
              </div>
            </div>
            <div className="team-roster-list">
              <div className="team-member-item">
                <div className="member-avatar" style={{ background: "#0866ff" }}>B</div>
                <div className="member-info">
                  <strong>Lê Đình Bảo</strong>
                  <span>Trưởng nhóm (Accountable)</span>
                </div>
                <span className="status-badge status-info">Manager</span>
              </div>
              <div className="team-member-item">
                <div className="member-avatar" style={{ background: "#059669" }}>B</div>
                <div className="member-info">
                  <strong>Nguyễn Bình</strong>
                  <span>Chuyên viên nội dung · Copywriting</span>
                </div>
                <span className="status-badge status-neutral">Member</span>
              </div>
              <div className="team-member-item">
                <div className="member-avatar" style={{ background: "#7c3aed" }}>A</div>
                <div className="member-info">
                  <strong>Trần An</strong>
                  <span>Thiết kế đồ họa · Figma</span>
                </div>
                <span className="status-badge status-neutral">Member</span>
              </div>
            </div>
          </section>

          <section className="panel section-gap">
            <div className="section-header">
              <div>
                <p className="eyebrow">QUY CHUẨN ĐIỀU HÀNH</p>
                <h2>Mô hình RACI</h2>
              </div>
            </div>
            <div className="raci-guide-box">
              <div className="raci-pill raci-pill-a">
                <strong>A — Accountable</strong>
                <span>Duy nhất 1 người chịu trách nhiệm nghiệm thu kết quả công việc.</span>
              </div>
              <div className="raci-pill raci-pill-r">
                <strong>R — Responsible</strong>
                <span>Thành viên trực tiếp thực thi nhiệm vụ đạt tiêu chuẩn.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
