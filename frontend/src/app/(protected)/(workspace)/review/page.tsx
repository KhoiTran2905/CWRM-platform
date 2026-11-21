import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { TaskTable } from "@/components/task-table";
import { listTasks } from "@/lib/api/client";
import { requireWorkspace } from "@/lib/auth/server";
import { isDemoWorkspace } from "@/lib/demo-data";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default async function ReviewPage() {
  const workspace = await requireWorkspace();
  const isDemo = isDemoWorkspace(workspace.id);
  const demoTasks = isDemo ? await listTasks() : [];
  const awaitingReview = demoTasks.filter((task) => task.status === "Review" || task.status === "REVIEW");
  const successors = demoTasks.filter((task) => task.predecessorId);

  return (
    <AppShell>
      <div className="review-page" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <style>{`
          .review-split { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 12px; flex: 1; min-height: 0; }
          .review-panel { display: flex; flex-direction: column; min-height: 0; margin-bottom: 0; }
          .review-scroll-area { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
          .ft-dependency-list { display: flex; flex-direction: column; gap: 8px; }
          .ft-flow { display: grid; grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr); align-items: stretch; }
          .ft-node { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--card-soft); transition: border-color .15s ease, background .15s ease; }
          .ft-node:hover { border-color: var(--accent-border); }
          .ft-node-pre { border-left: 3px solid var(--warn-text); }
          .ft-flow-locked .ft-node-target { border-left: 3px solid var(--border-strong); background: var(--card-muted); }
          .ft-flow-open .ft-node-target { border-left: 3px solid var(--accent); }
          .ft-node-kind { color: var(--faint); font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
          .ft-node strong { color: var(--heading); font-size: 12px; line-height: 1.25; }
          .ft-node-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 1px; }
          .ft-code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; font-variant-numeric: tabular-nums; font-size: 9.5px; font-weight: 700; color: var(--faint); }
          .ft-link { position: relative; display: flex; align-items: center; justify-content: center; }
          .ft-link-line { position: relative; width: 100%; height: 1.5px; background: var(--border-strong); }
          .ft-link-line::after { content: ""; position: absolute; top: 50%; right: 4px; width: 5px; height: 5px; border-top: 1.5px solid var(--border-strong); border-right: 1.5px solid var(--border-strong); transform: translateY(-50%) rotate(45deg); }
          .ft-link-type { position: absolute; top: calc(50% - 15px); padding: 1px 4px; border-radius: 3px; background: var(--card); color: var(--faint); font-size: 8px; font-weight: 800; }
          .ft-lock { display: inline-flex; align-items: center; gap: 4px; width: fit-content; margin-top: 2px; padding: 2px 6px; border: 1px solid var(--border); border-radius: 100px; background: var(--card); color: var(--faint); font-size: 9.5px; font-weight: 700; }
          .ft-lock svg { width: 10px; height: 10px; flex-shrink: 0; }
          .ft-lock-open { color: var(--accent-text); border-color: var(--accent-border); background: var(--accent-soft); }
          .dependency-row { padding: 9px 12px; margin-top: 6px; }
          @media (max-width: 900px) {
            .review-split { grid-template-columns: 1fr; }
          }
        `}</style>
        <PageHeading
          eyebrow="Manager / Nghiệm thu và phụ thuộc"
          title="Quyết định Done, mở quyền Start"
          description="R gửi Review khi progress 100%. A nghiệm thu hoặc trả lại có lý do; task kế tiếp chỉ được phép Start sau khi tiền nhiệm Done."
        />

        <div className="review-split">
          <section className="panel review-panel" aria-labelledby="review-queue-heading">
            <div className="section-header">
              <div><p className="eyebrow">Quyết định của A</p><h2 id="review-queue-heading">Hàng chờ Review ({awaitingReview.length})</h2></div>
            </div>
            <div className="review-scroll-area">
              <TaskTable tasks={awaitingReview} />
              {awaitingReview.map((task) => (
                <div className="dependency-row" key={`${task.id}-result`}>
                  <div>
                    <strong>{task.title}</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--muted)" }}>Kết quả nộp: {task.reviewResultText ?? "Chưa có mô tả văn bản"}</p>
                    {task.reviewResultUrl && <a className="text-link" href={task.reviewResultUrl} style={{ fontSize: "11.5px" }}>Mở liên kết kết quả</a>}
                  </div>
                  <Link className="button button-primary" href={`/tasks/${task.id}`} style={{ minHeight: "30px", fontSize: "12px", padding: "0 12px" }}>Nghiệm thu</Link>
                </div>
              ))}
            </div>
          </section>

          <section className="panel review-panel" aria-labelledby="dependency-list-heading">
            <div className="section-header">
              <div><p className="eyebrow">Finish-to-Start</p><h2 id="dependency-list-heading">Task phụ thuộc ({successors.length})</h2></div>
            </div>
            <div className="review-scroll-area">
              <div className="ft-dependency-list">
                {successors.length === 0 ? (
                  <p className="helper-note" style={{ margin: 0, padding: "16px 8px" }}>Chưa có chuỗi phụ thuộc (Finish-to-Start) nào trong dự án này.</p>
                ) : (
                  successors.map((task) => {
                    const predecessor = demoTasks.find((item) => item.id === task.predecessorId);
                    const unlocked = predecessor?.status === "Done";
                    const lockLabel = unlocked
                      ? "Sẵn sàng Start"
                      : `Chờ "${predecessor?.title ?? task.predecessorId}" Done`;
                    return (
                      <div className={`ft-flow ${unlocked ? "ft-flow-open" : "ft-flow-locked"}`} key={task.id}>
                        <Link className="ft-node ft-node-pre" href={`/tasks/${predecessor?.id ?? task.predecessorId}`}>
                          <span className="ft-node-kind">Tiền nhiệm</span>
                          <strong>{predecessor?.title ?? task.predecessorId}</strong>
                          <span className="ft-node-meta">
                            <span className="ft-code">{predecessor?.id ?? task.predecessorId}</span>
                            {predecessor && <StatusBadge value={predecessor.status} />}
                          </span>
                        </Link>
                        <div className="ft-link" aria-hidden="true">
                          <span className="ft-link-line" />
                          <span className="ft-link-type">F→S</span>
                        </div>
                        <Link className="ft-node ft-node-target" href={`/tasks/${task.id}`}>
                          <span className="ft-node-kind">Task kế tiếp</span>
                          <strong>{task.title}</strong>
                          <span className="ft-node-meta">
                            <span className="ft-code">{task.id}</span>
                            <StatusBadge value={unlocked ? "Được phép Start" : "Start bị khóa"} />
                          </span>
                          {!unlocked ? (
                            <span className="ft-lock">
                              <LockIcon />
                              {lockLabel}
                            </span>
                          ) : (
                            <span className="ft-lock ft-lock-open">{lockLabel}</span>
                          )}
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
