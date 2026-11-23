import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getRiskSnapshot, getTask, listTasks } from "@/lib/api/client";

export const instant = false;

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();
  const demoTasks = await listTasks();
  const demoRiskSnapshot = await getRiskSnapshot(id);
  const predecessor = task.predecessorId ? demoTasks.find((item) => item.id === task.predecessorId) : undefined;
  const waitingForDependency = Boolean(predecessor && predecessor.status !== "Done");
  const reviewReady = task.progress === 100 && task.openBlockers === 0;
  const assignments = task.assignments ?? [];
  const requests = task.requests ?? [];
  const requiredPeople = task.requiredPeople ?? task.slots ?? 1;
  const reservedPeople = task.reservedPeople ?? assignments.filter((item) => item.status === "Accepted" || item.status === "ACCEPTED").length;
  const acceptedAssignments = assignments.filter((item) => item.status === "Accepted" || item.status === "ACCEPTED");
  const responsibleName = task.responsible ?? (acceptedAssignments.length > 0 ? acceptedAssignments.map((item) => item.userName).join(", ") : undefined);

  return (
    <AppShell>
      <div className="task-detail-page">
        <style>{`
          .task-detail-page .button { min-height: 36px; padding: 0 13px; border-radius: 7px; font-size: 12px; }
          .task-detail-page .td-code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; font-variant-numeric: tabular-nums; font-size: 11px; font-weight: 700; letter-spacing: .02em; color: var(--code-text); }
          .raci-table { min-width: 620px; }
          .raci-table thead th { padding: 9px 12px; }
          .raci-table tbody td { height: 44px; padding: 8px 12px; font-size: 12px; }
          .raci-table tbody td:first-child { width: 78px; }
          .raci-table strong { color: var(--text); font-size: 12.5px; }
          .raci-role { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: .02em; }
          .raci-a { background: #1f3a5f; }
          .raci-r { background: #0f766e; }
          .raci-c, .raci-i { background: var(--card-muted); color: var(--muted); }
          .raci-scope { color: var(--muted); font-size: 11.5px; }
          @media (max-width: 640px) {
            .task-detail-page .button-row { flex-wrap: wrap; }
            .task-detail-page .button-row .button { flex: 1 1 auto; }
          }
        `}</style>
        <PageHeading
          eyebrow={`${task.team} / ${task.id}`}
          title={task.title}
          description={task.description ?? "Trách nhiệm, trạng thái nhận việc, tiến độ và risk được theo dõi riêng."}
          action={<Link className="button button-secondary" href="/tasks">← Danh sách task</Link>}
        />
        <div className="two-column-layout">
          <section className="panel">
            <div className="section-header"><h2>Thông tin công việc</h2><div className="status-summary"><span>Trạng thái công việc</span><StatusBadge value={task.status} /></div></div>
            <div className="detail-grid">
              <div><span>Mã task</span><strong className="td-code">{task.id}</strong></div>
              <div><span>Hình thức</span><StatusBadge value={task.assignmentMode} /></div>
              <div><span>Mức độ ưu tiên</span><StatusBadge kind="priority" value={task.priority} /></div>
              <div><span>A chịu trách nhiệm</span><strong>{task.accountable}</strong></div>
              <div><span>R thực hiện</span><strong>{responsibleName ?? "Chưa có người nhận việc (R)"}</strong></div>
              {task.assignmentMode === "Direct" ? (
                <div><span>Trạng thái giao việc</span>{task.assignmentStatus ? <StatusBadge value={task.assignmentStatus} /> : <strong>Chưa gửi lời mời</strong>}</div>
              ) : (
                <>
                  <div><span>Trạng thái yêu cầu</span>{task.requestStatus ? <StatusBadge value={task.requestStatus} /> : <strong>Chưa có yêu cầu</strong>}</div>
                  <div><span>Trạng thái giao việc</span>{task.assignmentStatus ? <StatusBadge value={task.assignmentStatus} /> : <strong>Chưa có người nhận việc (R)</strong>}</div>
                </>
              )}
              <div><span>Hạn hoàn thành</span><strong>{task.deadlineLabel}</strong></div>
              <div><span>Trở ngại đang mở</span><strong>{task.openBlockers}</strong></div>
              {predecessor && <div><span>Phụ thuộc</span><Link className="text-link" href={`/tasks/${predecessor.id}`}><span className="td-code">{predecessor.id}</span> · {predecessor.title} · {predecessor.status}</Link></div>}
            </div>
            <div className="divider" />
            <div className="progress-header"><span>Tiến độ thực tế</span><strong>{task.progress}%</strong></div>
            <div className="progress-track"><span style={{ width: `${task.progress}%` }} /></div>
            <p className="helper-note">Đã nhận việc không tự chuyển trạng thái sang Đang làm. Tiến độ 100% không tự chuyển trạng thái sang Hoàn thành.</p>
          </section>
          <section className="panel">
            <div className="section-header"><h2>Rủi ro và hành động</h2><StatusBadge value={task.riskLevel} /></div>
            <p className="page-description">Rủi ro được tính từ dữ liệu công việc. Quản lý không nhập Risk Score thủ công.</p>
            {demoRiskSnapshot ? (
              <Link href={`/risk?taskId=${task.id}`} className="button button-primary" style={{ marginTop: 22 }}>Xem bằng chứng & chẩn đoán rủi ro</Link>
            ) : (
              <p className="helper-note">Công việc này chưa có snapshot rủi ro chi tiết.</p>
            )}
            <div className="divider" />
            <p className="helper-note">Mức rủi ro là kết quả của Risk Engine. Bị nghẽn là trạng thái công việc; hai thông tin không thay thế nhau.</p>
          </section>
        </div>

        <section className="panel section-gap" aria-labelledby="raci-heading">
          <div className="section-header">
            <div><p className="eyebrow">RACI / Trách nhiệm</p><h2 id="raci-heading">Bảng phân bổ RACI</h2></div>
            <span className="td-code">{task.id}</span>
          </div>
          <div className="table-scroll">
            <table className="data-table raci-table">
              <thead>
                <tr>
                  <th>Vai trò</th>
                  <th>Người phụ trách</th>
                  <th>Phạm vi</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="raci-role raci-r">R</span></td>
                  <td><strong>{responsibleName ?? "Chưa có người nhận việc (R)"}</strong></td>
                  <td><span className="raci-scope">Thực hiện công việc và gửi kết quả</span></td>
                  <td>{task.assignmentStatus ? <StatusBadge kind="assignmentStatus" value={task.assignmentStatus} /> : <span className="muted">Chưa gán</span>}</td>
                </tr>
                <tr>
                  <td><span className="raci-role raci-a">A</span></td>
                  <td><strong>{task.accountable}</strong></td>
                  <td><span className="raci-scope">Nghiệm thu, quyết định Hoàn thành hoặc yêu cầu sửa đổi</span></td>
                  <td><span className="status-badge status-info">Duy nhất 1 A</span></td>
                </tr>
                <tr>
                  <td><span className="raci-role raci-c">C</span></td>
                  <td><span className="muted">Chưa chỉ định</span></td>
                  <td><span className="raci-scope">Tham vấn khi cần quyết định</span></td>
                  <td><span className="status-badge status-neutral">Tùy chọn</span></td>
                </tr>
                <tr>
                  <td><span className="raci-role raci-i">I</span></td>
                  <td><strong>{task.team}</strong></td>
                  <td><span className="raci-scope">Nhận thông báo tiến độ</span></td>
                  <td><span className="status-badge status-neutral">Theo đội ngũ</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="helper-note">A là người nghiệm thu duy nhất; R là người trực tiếp thực hiện nhiệm vụ.</p>
        </section>

        <section className="panel section-gap" aria-labelledby="assignment-heading">
          <div className="section-header">
            <div><p className="eyebrow">Luồng nhận việc</p><h2 id="assignment-heading">Phân công và trách nhiệm</h2></div>
            <StatusBadge value={task.assignmentMode} />
          </div>
          {task.assignmentMode === "Direct" ? (
            <div className="flow-stage-grid">
              <div className="flow-stage-card"><span>Người được đề nghị</span><strong>{task.assignee ?? "Chưa chọn"}</strong><small>Chỉ thành viên trong nhóm mới có thể phản hồi.</small></div>
              <div className="flow-stage-card"><span>Trạng thái lời mời</span>{task.assignmentStatus ? <StatusBadge value={task.assignmentStatus} /> : <strong>Chưa gửi</strong>}<small>{task.assignmentStatus === "Accepted" ? "Đã nhận việc xác lập vai trò R; không tự bắt đầu công việc." : "Chưa nhận việc thì chưa tạo vai trò R."}</small></div>
              <div className="flow-stage-card"><span>Người thực hiện (R)</span><strong>{responsibleName ?? "Chưa có người nhận"}</strong><small>Mỗi công việc luôn có duy nhất một A: {task.accountable}.</small></div>
            </div>
          ) : (
            <div className="flow-stage-grid">
              <div className="flow-stage-card"><span>Điều kiện ứng tuyển</span><strong>{task.requiredRole ?? "Không yêu cầu vai trò"} · {task.requiredSkills?.join(", ") ?? "Không yêu cầu kỹ năng"}</strong><small>Số vị trí: {task.slots ?? 1}</small></div>
              <div className="flow-stage-card"><span>Yêu cầu của thành viên</span>{task.requestStatus ? <StatusBadge value={task.requestStatus} /> : <strong>Chưa có yêu cầu</strong>}<small>{task.requestStatus === "Approved" ? "Quản lý đã duyệt yêu cầu." : task.requestStatus === "Pending" ? "Đang chờ duyệt; chưa tạo vai trò R." : "Chưa có thành viên đủ điều kiện gửi yêu cầu."}</small></div>
              <div className="flow-stage-card"><span>Phân công thực hiện (R)</span><strong>{responsibleName ?? "Chưa có người nhận"}</strong><small>{task.assignmentStatus === "Accepted" ? "Đã duyệt và xác lập vai trò R." : "Chỉ duyệt khi còn vị trí trống mới tạo vai trò R."}</small></div>
            </div>
          )}
          <div className="divider" />
          <div className="section-header"><h3>Danh sách theo từng người</h3><span className="count-label">Cần {requiredPeople} · đã giữ {reservedPeople} · còn {Math.max(0, requiredPeople - reservedPeople)}</span></div>
          {assignments.map((item) => (
            <div className="dependency-row" key={item.id}>
              <div><strong>{item.userName}</strong><p>Giao việc trực tiếp · {item.reason ? `Lý do: ${item.reason}` : "Chưa có lý do"}</p></div>
              <div className="button-row"><StatusBadge kind="assignmentStatus" value={item.status} /><button className="button button-secondary" disabled>Kết thúc + lý do</button></div>
            </div>
          ))}
          {requests.map((item) => (
            <div className="dependency-row" key={item.id}>
              <div><strong>{item.userName}</strong><p>Yêu cầu nhận việc tự do · {item.reason ? `Lý do: ${item.reason}` : "Chưa có lý do"}</p></div>
              <div className="button-row"><StatusBadge kind="requestStatus" value={item.status} /><button className="button button-primary" disabled>Duyệt</button><button className="button button-secondary" disabled>Từ chối + lý do</button></div>
            </div>
          ))}
          {assignments.length === 0 && requests.length === 0 && <p className="helper-note">Chưa có đề nghị, yêu cầu hoặc phân công nào.</p>}
          {task.assignmentMode === "Direct" ? (
            <div className="form-grid section-gap">
              <label className="field">Lý do khi từ chối, đóng hoặc kết thúc<input disabled placeholder="Bắt buộc khi thực hiện thao tác" /></label>
              <div className="button-row"><button className="button button-secondary" disabled>Gửi đề nghị trực tiếp</button><button className="button button-secondary" disabled>Đóng đề nghị đang chờ</button></div>
            </div>
          ) : (
            <div className="form-grid section-gap">
              <label className="field">Lý do khi từ chối yêu cầu hoặc đóng nhận việc<input disabled placeholder="Bắt buộc khi thực hiện thao tác" /></label>
              <div className="button-row"><button className="button button-secondary" disabled>Đóng nhận việc tự do</button></div>
            </div>
          )}
          <p className="helper-note">Quản lý kiểm tra lại vai trò, kỹ năng và số vị trí còn trống khi phê duyệt. A là người nghiệm thu, không phải quyền duyệt yêu cầu mặc định.</p>
        </section>
        {waitingForDependency && predecessor && (
          <section className="panel section-gap state-panel" aria-labelledby="dependency-heading">
            <div><p className="eyebrow">Chuỗi phụ thuộc liên hoàn (Finish-to-Start)</p><h2 id="dependency-heading">Chưa thể bắt đầu công việc</h2><p>Công việc tiền nhiệm <Link className="text-link" href={`/tasks/${predecessor.id}`}><span className="td-code">{predecessor.id}</span></Link> đang ở trạng thái <strong>{predecessor.status}</strong>. Chỉ khi tiền nhiệm được A nghiệm thu Hoàn thành thì công việc này mới được phép bắt đầu; hệ thống không tự bắt đầu thay thành viên.</p></div>
            <button className="button button-secondary" disabled>Chưa thể bắt đầu</button>
          </section>
        )}
        {task.status === "Blocked" && (
          <section className="panel section-gap state-panel" aria-labelledby="blocker-heading">
            <div><p className="eyebrow">Trở ngại đang mở</p><h2 id="blocker-heading">Giải quyết trở ngại trước khi gửi Nghiệm thu</h2><p>Công việc có {task.openBlockers} trở ngại đang mở. Thành viên có thể cập nhật tiến độ và báo cáo vấn đề; Quản lý theo dõi bằng chứng và hỗ trợ giải phóng trở ngại.</p></div>
            <button className="button button-secondary" disabled>Chưa thể gửi nghiệm thu</button>
          </section>
        )}
        {task.status === "In Progress" && (
          <section className="panel section-gap state-panel" aria-labelledby="submit-review-heading">
            <div>
              <p className="eyebrow">Thành viên / Gửi nghiệm thu</p>
              <h2 id="submit-review-heading">{reviewReady ? "Đủ điều kiện gửi Nghiệm thu" : "Chưa đủ điều kiện gửi Nghiệm thu"}</h2>
              <p>Tiến độ: <strong>{task.progress}%</strong> (cần 100%) · Trở ngại mở: <strong>{task.openBlockers}</strong> (cần 0). Khi R gửi Nghiệm thu, A mới xem xét và quyết định Hoàn thành hoặc yêu cầu sửa đổi.</p>
            </div>
            <div className="form-grid">
              <label className="field">Kết quả dạng văn bản<textarea rows={3} disabled placeholder="Mô tả kết quả đã hoàn thành" /></label>
              <label className="field">Hoặc liên kết kết quả<input type="url" disabled placeholder="https://..." /></label>
              <div className="action-with-note"><button className="button button-primary" disabled>Gửi nghiệm thu</button><small>{reviewReady ? "Sẵn sàng gửi nghiệm thu" : "Cần hoàn tất điều kiện"}</small></div>
            </div>
          </section>
        )}
        {task.status === "Review" && (
          <section className="panel section-gap state-panel" aria-labelledby="review-heading">
            <div><p className="eyebrow">Nghiệm thu bởi Người phê duyệt (A)</p><h2 id="review-heading">Đã nộp kết quả, chờ quyết định</h2><p>R đã gửi Nghiệm thu khi đạt {task.progress}% và không còn trở ngại. Người phê duyệt (A) là {task.accountable}; A có thể duyệt Hoàn thành hoặc trả về kèm lý do.</p></div>
            <div className="form-grid">
              <div><strong>Kết quả R đã nộp</strong><p>{task.reviewResultText ?? "Không có mô tả văn bản"}</p>{task.reviewResultUrl && <a className="text-link" href={task.reviewResultUrl}>Mở liên kết kết quả</a>}</div>
              <label className="field">Lý do yêu cầu sửa đổi<input disabled placeholder="Bắt buộc khi yêu cầu sửa đổi" /></label>
              <label className="field">Tiến độ cập nhật mới (0–99)<input type="number" min="0" max="99" disabled placeholder="Ví dụ: 80" /></label>
              <div className="button-row"><button className="button button-primary" disabled>Nghiệm thu Đạt (Done)</button><button className="button button-secondary" disabled>Yêu cầu sửa đổi</button></div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
