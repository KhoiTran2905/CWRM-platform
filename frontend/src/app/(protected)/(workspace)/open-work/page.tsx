import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { demoMemberProfile, isDemoWorkspace, missingOpenWorkRequirements } from "@/lib/demo-data";
import { listTasks } from "@/lib/api/client";
import { requireAccount, requireWorkspace } from "@/lib/auth/server";

const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

function CapacitySlots({
  reserved,
  required,
  remaining,
}: {
  reserved: number;
  required: number;
  remaining: number;
}) {
  const slots = Array.from({ length: required }, (_, index) => index);
  return (
    <span className="capacity-slots" style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span
        role="img"
        aria-label={`${reserved}/${required} chỗ đã giữ`}
        style={{ display: "inline-flex", alignItems: "center", gap: 3 }}
      >
        {slots.map((slot) => (
          <span
            key={slot}
            style={
              slot < reserved
                ? { width: 14, height: 5, borderRadius: 3, background: "var(--success-text)" }
                : { width: 14, height: 5, borderRadius: 3, border: "1px dashed var(--border-strong)", background: "transparent" }
            }
          />
        ))}
      </span>
      <span
        className="count-label"
        style={{
          fontFamily: monoFont,
          fontSize: 10.5,
          letterSpacing: ".02em",
          color: remaining > 0 ? "var(--success-text)" : "var(--muted)",
        }}
      >
        Còn {remaining}/{required} chỗ
      </span>
    </span>
  );
}

export default async function OpenWorkPage() {
  const [workspace, account] = await Promise.all([requireWorkspace(), requireAccount()]);
  const isDemo = isDemoWorkspace(workspace.id);
  const tasks = isDemo ? await listTasks() : [];
  const opportunities = tasks
    .filter((task) => {
      const required = task.requiredPeople ?? task.slots ?? 1;
      const reserved = task.reservedPeople ?? 0;
      return (
        task.assignmentMode === "Open Work" &&
        task.status === "To Do" &&
        demoMemberProfile.teams.includes(task.team) &&
        reserved < required
      );
    })
    .map((task) => {
      const required = task.requiredPeople ?? task.slots ?? 1;
      const reserved = task.reservedPeople ?? 0;
      const remainingSlots = Math.max(0, required - reserved);
      return {
        ...task,
        required,
        reserved,
        remainingSlots,
        missingRequirements: missingOpenWorkRequirements(task),
      };
    });

  return (
    <AppShell>
      <PageHeading
        eyebrow="Member / Open Work"
        title="Tìm việc phù hợp năng lực"
        description="Member thuộc team xem việc mở, kiểm tra Role/Skill rồi gửi request; Manager quyết định duyệt khi còn chỗ."
      />
      <div className="profile-badge" style={{ marginBottom: 6, padding: "6px 12px", fontSize: "12px", flexShrink: 0 }}>
        <span>Tài khoản đăng nhập:</span> <strong>{account.displayName}</strong> · <span>{account.email}</span>
      </div>
      {isDemo && (
        <p className="helper-note" style={{ margin: "0 0 10px", fontSize: 11.5, flexShrink: 0 }}>
          Điều kiện nhận việc đang tính theo hồ sơ minh họa <strong>{demoMemberProfile.name}</strong> ({demoMemberProfile.teams.join(", ")} · {demoMemberProfile.role} · {demoMemberProfile.skills.join(", ")}) — dữ liệu mẫu, chưa tích hợp Member API nên không phải danh tính của bạn.
        </p>
      )}
      <section className="panel panel-fill">
        <div className="section-header">
          <h2>Danh sách việc mở ({opportunities.length})</h2>
          <span className="count-label">Chỉ hiển thị công việc Chờ thực hiện phù hợp hồ sơ minh họa</span>
        </div>
        <div className="scroll-container">
          <div className="card-grid" style={{ paddingRight: 4 }}>
            {opportunities.length === 0 ? (
              <p className="helper-note" style={{ margin: 0, padding: "20px 8px" }}>
                Không có công việc Open Work nào đang mở tuyển trong dự án này.
              </p>
            ) : (
              opportunities.map((item) => (
              <article className="panel opportunity-card" key={item.id} style={{ margin: 0 }}>
                <div className="task-card-top">
                  <span className="task-id">{item.id} · {item.team}</span>
                  <CapacitySlots reserved={item.reserved} required={item.required} remaining={item.remainingSlots} />
                </div>
                <h2 style={{ fontSize: 14 }}>{item.title}</h2>
                {item.requestStatus && (
                  <div className="badge-row" style={{ margin: "-2px 0 8px" }}>
                    <StatusBadge kind="requestStatus" value={item.requestStatus} />
                    <span className="count-label" style={{ fontSize: 10.5 }}>Trạng thái yêu cầu nhận việc</span>
                  </div>
                )}
                <div className="requirement-row" style={{ fontSize: 11.5, gap: 10 }}>
                  <span>Vai trò: <strong>{item.requiredRole}</strong></span>
                  <span>Kỹ năng: <strong>{item.requiredSkills?.join(", ")}</strong></span>
                </div>
                {item.missingRequirements.length === 0 ? (
                  <div className="eligibility success" style={{ padding: "8px 10px", fontSize: 11.5 }}>
                    <strong>Đủ điều kiện</strong>
                    <span>
                      {item.requestStatus === "Pending"
                        ? "Yêu cầu đang chờ Trưởng nhóm phê duyệt."
                        : item.requestStatus === "Withdrawn"
                        ? "Bạn đã rút yêu cầu này."
                        : "Đủ vai trò và kỹ năng yêu cầu. Có thể gửi yêu cầu nhận việc."}
                    </span>
                  </div>
                ) : (
                  <div className="eligibility danger" style={{ padding: "8px 10px", fontSize: 11.5 }}>
                    <strong>Chưa đủ điều kiện</strong>
                    <span>{item.missingRequirements.join(" · ")}</span>
                  </div>
                )}
                {item.requestStatus === "Pending" ? (
                  <div className="button-row">
                    <Link className="button button-secondary" href={`/tasks/${item.id}`} style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Chi tiết</Link>
                    <button
                      className="button button-secondary"
                      style={{ background: "transparent", minHeight: 28, fontSize: 11.5, padding: "0 10px" }}
                      disabled
                      title="Rút yêu cầu đã gửi"
                    >
                      Rút yêu cầu
                    </button>
                  </div>
                ) : item.requestStatus === "Withdrawn" ? (
                  <div className="button-row">
                    <Link className="button button-secondary" href={`/tasks/${item.id}`} style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Xem chi tiết</Link>
                    <button className="button button-primary" disabled style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Gửi lại yêu cầu</button>
                  </div>
                ) : item.missingRequirements.length === 0 ? (
                  <div className="button-row">
                    <Link className="button button-secondary" href={`/tasks/${item.id}`} style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Xem chi tiết</Link>
                    <button className="button button-primary" disabled style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Gửi yêu cầu nhận việc</button>
                  </div>
                ) : (
                  <button className="button button-secondary" disabled style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Không đủ điều kiện ứng tuyển</button>
                )}
              </article>
            )))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
