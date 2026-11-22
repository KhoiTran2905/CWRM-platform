"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { useAppContext } from "@/components/app-context";
import { demoDirectMemberProfile, demoTasks, isDemoWorkspace, type TaskSummary } from "@/lib/demo-data";
import { listTasks } from "@/lib/api/client";

interface UpdateDraft {
  progress: number;
  effort: string;
}

const sliderStyle: CSSProperties = { width: "100%", height: 26, accentColor: "var(--accent)" };

const clusterStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "10px 12px",
  marginTop: 10,
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--card-soft)",
};

const sliderRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(90px, 110px) minmax(0, 1fr)",
  gap: 10,
  alignItems: "center",
};

const loadingNote: CSSProperties = { margin: 0 };

export default function MyWorkPage() {
  const { workspace } = useAppContext();
  const isDemo = isDemoWorkspace(workspace?.id);
  const [tasks, setTasks] = useState<TaskSummary[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, UpdateDraft>>({});

  useEffect(() => {
    let active = true;
    if (isDemo) {
      listTasks()
        .then((data) => {
          if (active) setTasks(data);
        })
        .catch(() => {
          if (active) setTasks(demoTasks);
        });
    }
    return () => {
      active = false;
    };
  }, [isDemo]);

  const loaded = isDemo ? tasks !== null : true;
  const list = isDemo ? (tasks ?? []) : [];
  const invitation = list.find(
    (task) =>
      task.assignmentMode === "Direct" &&
      task.assignee === demoDirectMemberProfile.name &&
      task.assignmentStatus === "Pending Acceptance"
  );
  const assigned = list.filter(
    (task) => task.assignmentStatus === "Accepted" && task.responsible === demoDirectMemberProfile.name
  );

  function draftFor(task: TaskSummary): UpdateDraft {
    return drafts[task.id] ?? { progress: task.progress, effort: "" };
  }

  function updateDraft(task: TaskSummary, patch: Partial<UpdateDraft>) {
    setDrafts((prev) => {
      const base = prev[task.id] ?? { progress: task.progress, effort: "" };
      return { ...prev, [task.id]: { ...base, ...patch } };
    });
  }

  return (
    <AppShell>
      <style>{`
        .my-work-grid {
          display: grid;
          grid-template-columns: 380px minmax(0, 1fr);
          gap: 12px;
          flex: 1;
          min-height: 0;
        }
        .my-work-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .my-work-col .panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          margin-bottom: 0;
        }
        .my-work-scroll {
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
        }
        @media (max-width: 1024px) {
          .my-work-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .invitation-panel .button-row { flex-wrap: wrap; }
          .invitation-panel .button-row .button { flex: 1 1 auto; }
        }
      `}</style>
      <PageHeading
        eyebrow="Member / Việc của tôi"
        title="Biết việc nào mình đã nhận"
        description="Lời mời nhận việc và task đang thực hiện được tách riêng, để Accepted không bị hiểu là Task Status."
      />
      <div className="profile-badge" style={{ marginBottom: 10, padding: "6px 12px", fontSize: "12px", flexShrink: 0 }}>
        <span>Tài khoản:</span> <strong>{demoDirectMemberProfile.name}</strong> · <span>Đội ngũ:</span> <strong>{demoDirectMemberProfile.teams.join(", ")}</strong> · <span>Vai trò:</span> <strong>{demoDirectMemberProfile.role}</strong>
      </div>

      <div className="my-work-grid">
        <div className="my-work-col">
          <section className="panel" aria-labelledby="direct-invitation-heading">
            <div className="section-header">
              <div>
                <p className="eyebrow">LỜI MỜI NHẬN VIỆC</p>
                <h2 id="direct-invitation-heading">Lời mời trực tiếp đang chờ</h2>
              </div>
              {invitation && <StatusBadge value="Pending Acceptance" />}
            </div>
            <div className="my-work-scroll">
              {!loaded ? (
                <p className="helper-note" style={loadingNote}>Đang tải lời mời…</p>
              ) : invitation ? (
                <div className="invitation-panel" style={{ padding: 12, borderRadius: 8, background: "var(--card-soft)", border: "1px solid var(--border)" }}>
                  <div className="task-card-top">
                    <span className="task-id">{invitation.id} · {invitation.team}</span>
                    <span className="badge-row">
                      <StatusBadge value="Direct" />
                      <StatusBadge value={invitation.status} />
                    </span>
                  </div>
                  <h3 style={{ margin: "6px 0 8px", fontSize: 13 }}>{invitation.title}</h3>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--muted)" }}>Công việc đang ở trạng thái <strong>Chờ thực hiện</strong>. Nếu chấp nhận, bạn trở thành người thực hiện (R); công việc bắt đầu khi điều kiện tiền nhiệm cho phép.</p>
                  <label className="field" style={{ fontSize: 11.5, marginBottom: 10 }}>
                    Lý do từ chối (bắt buộc khi Từ chối)
                    <textarea rows={2} disabled placeholder="Nhập lý do để Trưởng nhóm có thể giao lại" style={{ fontSize: 12, padding: "6px 10px" }} />
                  </label>
                  <div className="button-row">
                    <Link className="button button-secondary" href={`/tasks/${invitation.id}`} style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Chi tiết</Link>
                    <button className="button button-primary" disabled style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Chấp nhận</button>
                    <button className="button button-secondary" disabled style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>Từ chối</button>
                  </div>
                </div>
              ) : (
                <p className="helper-note" style={loadingNote}>Không có lời mời giao việc nào đang chờ bạn phản hồi.</p>
              )}
            </div>
          </section>
        </div>

        <div className="my-work-col">
          <section className="panel" aria-labelledby="my-tasks-heading">
            <div className="section-header">
              <div>
                <p className="eyebrow">NHIỆM VỤ ĐÃ NHẬN</p>
                <h2 id="my-tasks-heading">Công việc của tôi ({loaded ? assigned.length : "…"})</h2>
              </div>
              <div className="button-row">
                <Link className="text-link" href="/open-work">Xem việc mở →</Link>
              </div>
            </div>
            <div className="my-work-scroll">
              {!loaded ? (
                <p className="helper-note" style={loadingNote}>Đang tải công việc…</p>
              ) : assigned.length === 0 ? (
                <p className="helper-note" style={loadingNote}>Bạn chưa nhận công việc nào. Ghé trang việc mở để gửi yêu cầu.</p>
              ) : (
                assigned.map((task) => {
                  const draft = draftFor(task);
                  const effortValue = Number(draft.effort) || 0;
                  const effortMax = Math.max(40, Math.ceil(effortValue / 10) * 10);
                  return (
                    <article className="task-card" key={task.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-soft)" }}>
                      <div className="task-card-top"><span className="task-id">{task.id} · {task.team}</span><StatusBadge value={task.riskLevel} /></div>
                      <h3 style={{ margin: "4px 0 6px", fontSize: 13.5 }}>{task.title}</h3>
                      <div className="badge-row"><StatusBadge value={task.status} /><StatusBadge value="Accepted" /></div>
                      <p style={{ margin: "4px 0 8px", fontSize: 11.5, color: "var(--muted)" }}>A: {task.accountable} · {task.deadlineLabel}</p>
                      <div className="progress-header" style={{ fontSize: 11.5 }}><span>Tiến độ</span><strong>{draft.progress}%</strong></div>
                      <div className="progress-track" style={{ height: 6 }}><span style={{ width: `${draft.progress}%` }} /></div>
                      {task.openBlockers > 0 && <p className="warning-line" style={{ margin: "6px 0 0", fontSize: 11 }}>{task.openBlockers} trở ngại đang mở — chưa thể gửi nghiệm thu.</p>}
                      {task.predecessorId && list.find((item) => item.id === task.predecessorId)?.status !== "Done" && <p className="warning-line" style={{ margin: "6px 0 0", fontSize: 11 }}>Chờ {task.predecessorId} hoàn thành — chưa thể bắt đầu.</p>}
                      {task.status === "To Do" && <button className="button button-primary" disabled title="Chờ kiểm tra điều kiện liên hoàn" style={{ minHeight: 28, fontSize: 11.5, marginTop: 8 }}>Bắt đầu làm việc</button>}
                      {task.status === "In Progress" && (
                        <div style={clusterStyle}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                            <span className="eyebrow" style={{ margin: 0 }}>Cập nhật của R</span>
                            <span className="count-label" style={{ fontVariantNumeric: "tabular-nums", fontSize: 11 }}>
                              {draft.progress}% · {draft.effort || "0"} giờ
                            </span>
                          </div>
                          <div style={sliderRowStyle}>
                            <label className="field" style={{ gap: 2, fontSize: 11 }}>
                              Tiến độ (%)
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={draft.progress}
                                style={{ minHeight: 28, height: 28, fontSize: 12, padding: "2px 8px" }}
                                onChange={(event) => updateDraft(task, { progress: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })}
                              />
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={draft.progress}
                              style={sliderStyle}
                              aria-label="Thanh trượt tiến độ"
                              onChange={(event) => updateDraft(task, { progress: Number(event.target.value) })}
                            />
                          </div>
                          <div style={sliderRowStyle}>
                            <label className="field" style={{ gap: 2, fontSize: 11 }}>
                              Thời gian thực hiện (giờ)
                              <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={draft.effort}
                                placeholder="0"
                                style={{ minHeight: 28, height: 28, fontSize: 12, padding: "2px 8px" }}
                                onChange={(event) => updateDraft(task, { effort: event.target.value })}
                              />
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={effortMax}
                              step={0.5}
                              value={effortValue}
                              style={sliderStyle}
                              aria-label="Thanh trượt số giờ"
                              onChange={(event) => updateDraft(task, { effort: event.target.value })}
                            />
                          </div>
                          <div className="button-row">
                            <button className="button button-primary" style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }} disabled title="Chờ API cập nhật tiến độ">
                              Lưu tiến độ
                            </button>
                            <span className="count-label" style={{ fontSize: 10.5 }}>Nháp tại phiên — chưa ghi server.</span>
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <Link className="button button-secondary" href={`/tasks/${task.id}`} style={{ minHeight: 28, fontSize: 11.5, padding: "0 10px" }}>{task.status === "Review" ? "Trạng thái nghiệm thu" : "Chi tiết"}</Link>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
