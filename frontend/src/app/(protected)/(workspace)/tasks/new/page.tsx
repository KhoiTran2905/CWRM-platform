"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import {
  CheckSquare,
  Users,
  ShieldAlert,
  Plus,
  Info,
} from "lucide-react";

const priorityOptions = [
  { code: "LOW", label: "Thấp", color: "#64748b" },
  { code: "MEDIUM", label: "Trung bình", color: "#0284c7" },
  { code: "HIGH", label: "Cao", color: "#f59e0b" },
  { code: "CRITICAL", label: "Khẩn cấp", color: "#ef4444" },
] as const;

const deadlineTypeOptions = [
  { code: "FLEXIBLE", label: "Linh hoạt", desc: "Có thể điều chỉnh theo tiến độ thực tế" },
  { code: "FIXED", label: "Cố định", desc: "Mốc hạn chót nghiêm ngặt không thay đổi" },
] as const;

export default function NewTaskPage() {
  const [mode, setMode] = useState<"DIRECT" | "OPEN_WORK">("DIRECT");
  const [priority, setPriority] = useState<(typeof priorityOptions)[number]["code"]>("MEDIUM");
  const [deadlineType, setDeadlineType] = useState<(typeof deadlineTypeOptions)[number]["code"]>("FLEXIBLE");
  const [taskTitle, setTaskTitle] = useState("");

  return (
    <AppShell>
      <PageHeading
        eyebrow="ĐIỀU HÀNH / KHỞI TẠO CÔNG VIỆC"
        title="Giao việc & Phân công trách nhiệm"
        description="Mỗi công việc có duy nhất một người phê duyệt (A) và phương thức nhận việc rõ ràng theo quy chuẩn RACI."
        action={
          <Link className="button button-secondary" href="/tasks">
            ← Danh sách công việc
          </Link>
        }
      />

      <div className="two-column-layout">
        {/* Form bên trái */}
        <form className="panel task-form" onSubmit={(event) => event.preventDefault()}>
          <div className="auth-alert alert-notice mb-4" role="status">
            <Info size={16} />
            <span>
              Giao diện minh họa: chưa có API tạo Task trong Sprint 2 nên biểu mẫu <strong>chưa lưu dữ liệu</strong>. Nút khởi tạo bị khóa cho đến khi WP-017 cung cấp API Task.
            </span>
          </div>

          <div className="form-section-heading">
            <span className="step-number">1</span>
            <div>
              <h2>Thông tin cốt lõi</h2>
              <p>Công việc mới bắt đầu ở trạng thái Chờ thực hiện, tiến độ 0% và có đúng 1 Người phê duyệt (A).</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field field-wide">
              Tiêu đề công việc
              <input
                name="title"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ví dụ: Thiết kế banner quảng bá chiến dịch Q4"
              />
            </label>

            <label className="field">
              Nhóm phụ trách
              <select name="teamId" required defaultValue="team-marketing">
                <option value="team-marketing">Nhóm Marketing</option>
                <option value="team-dev">Nhóm Phát triển phần mềm</option>
                <option value="team-design">Nhóm Thiết kế</option>
              </select>
            </label>

            <label className="field">
              Người phê duyệt (A - Accountable)
              <select name="accountableUserId" required defaultValue="manager-1">
                <option value="manager-1">Trưởng nhóm Marketing (manager@example.com)</option>
              </select>
            </label>

            <label className="field">
              Hạn hoàn thành (Deadline)
              <input name="deadline" type="datetime-local" required />
            </label>

            <div className="field">
              <span>Loại hạn</span>
              <div className="segmented-group-2" role="radiogroup" aria-label="Loại hạn">
                {deadlineTypeOptions.map((option) => {
                  const active = deadlineType === option.code;
                  return (
                    <label key={option.code} className={`segmented-chip ${active ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="deadlineType"
                        value={option.code}
                        checked={active}
                        onChange={() => setDeadlineType(option.code)}
                      />
                      <span className="chip-dot" aria-hidden="true" />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="field">
              Số lượng nhân sự thực hiện
              <input name="requiredPeople" type="number" min="1" defaultValue="1" required />
            </label>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Mức độ ưu tiên</span>
              <div className="segmented-group-4" role="radiogroup" aria-label="Mức độ ưu tiên">
                {priorityOptions.map((option) => {
                  const active = priority === option.code;
                  return (
                    <label key={option.code} className={`segmented-chip ${active ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="priority"
                        value={option.code}
                        checked={active}
                        onChange={() => setPriority(option.code)}
                      />
                      <span className="chip-dot" aria-hidden="true" />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="form-section-heading">
            <span className="step-number">2</span>
            <div>
              <h2>Hình thức nhận việc</h2>
              <p>Phân định phương thức giao việc theo yêu cầu phân công hoặc nhận việc tự nguyện.</p>
            </div>
          </div>

          <div className="mode-options" role="radiogroup" aria-label="Hình thức nhận việc">
            {[
              {
                code: "DIRECT" as const,
                label: "Giao việc trực tiếp (Direct)",
                desc: "Gửi đề nghị trực tiếp cho một thành viên trong nhóm; thành viên có quyền Chấp nhận hoặc Từ chối kèm lý do.",
              },
              {
                code: "OPEN_WORK" as const,
                label: "Đăng việc tự do (Open Work)",
                desc: "Mở công việc lên chợ việc chung; thành viên đủ điều kiện vai trò và kỹ năng gửi yêu cầu để Quản lý duyệt.",
              },
            ].map(({ code, label, desc }) => (
              <label className={`mode-card ${mode === code ? "selected" : ""}`} key={code}>
                <input
                  type="radio"
                  name="assignmentMode"
                  value={code}
                  checked={mode === code}
                  onChange={() => setMode(code)}
                />
                <strong>{label}</strong>
                <span>{desc}</span>
              </label>
            ))}
          </div>

          <div className="form-grid conditional-fields">
            {mode === "DIRECT" ? (
              <label className="field field-wide">
                Chỉ định thành viên nhận việc
                <select name="assigneeUserId" required defaultValue="member-content">
                  <option value="member-content">Chuyên viên nội dung (content@example.com)</option>
                  <option value="member-designer">Thiết kế đồ họa (designer@example.com)</option>
                </select>
              </label>
            ) : (
              <>
                <label className="field">
                  Vai trò chuyên môn yêu cầu
                  <select name="requiredRoleId" defaultValue="role-designer">
                    <option value="">Không bắt buộc</option>
                    <option value="role-designer">Thiết kế đồ họa (Designer)</option>
                    <option value="role-content">Sáng tạo nội dung (Content)</option>
                  </select>
                </label>
                <label className="field">
                  Kỹ năng chuyên môn yêu cầu
                  <select name="requiredSkillId" defaultValue="skill-figma">
                    <option value="">Không bắt buộc</option>
                    <option value="skill-figma">Figma / UI Design</option>
                    <option value="skill-writing">Biên tập nội dung (Copywriting)</option>
                  </select>
                </label>
              </>
            )}
          </div>

          <details className="advanced-fields">
            <summary>Thêm mô tả chi tiết và ước lượng thời gian</summary>
            <div className="form-grid conditional-fields">
              <label className="field field-wide">
                Mô tả công việc và tiêu chí nghiệm thu
                <textarea rows={3} placeholder="Mô tả cụ thể kết quả đầu ra cần đạt để người phê duyệt (A) nghiệm thu hoàn thành..." />
              </label>
              <label className="field">
                Ước lượng thời gian hoàn thành (giờ)
                <input name="estimate" type="number" min="0" step="0.5" placeholder="Ví dụ: 8" />
              </label>
            </div>
          </details>

          <div className="form-footer">
            <span className="text-xs text-slate-500">
              Chức năng tạo Task chưa kết nối API: biểu mẫu chỉ minh họa quy trình RACI, dữ liệu nhập không được gửi đi hay lưu lại.
            </span>
            <button
              className="button button-primary flex items-center gap-1.5"
              type="submit"
              disabled
              title="Chưa có API tạo Task trong Sprint 2 — thao tác lưu bị khóa, chưa lưu dữ liệu"
            >
              <Plus size={16} />
              <span>Khởi tạo công việc</span>
            </button>
          </div>
        </form>

        {/* Cột hướng dẫn & tóm tắt bên phải (Thay thế ô API Preview thừa thãi) */}
        <aside className="panel new-task-guide-aside" aria-label="Tóm tắt công việc">
          <div className="section-header" style={{ marginBottom: 14 }}>
            <div>
              <p className="eyebrow">HƯỚNG DẪN & QUY CHUẨN</p>
              <h2>Tóm tắt phân công RACI</h2>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 mb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-bold mb-1">
                <CheckSquare size={15} />
                <span>Quy tắc 01 Người phê duyệt (A)</span>
              </div>
              <p className="m-0">
                Mỗi công việc trong CWRM luôn có duy nhất một <strong>Accountable (A)</strong> chịu trách nhiệm cao nhất và có quyền nghiệm thu hoặc trả lại kết quả.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold mb-1">
                <Users size={15} />
                <span>Quyền thực hiện (R) phát sinh</span>
              </div>
              <p className="m-0">
                Vai trò <strong>Responsible (R)</strong> chỉ được xác lập khi thành viên được giao việc chính thức <strong>Chấp nhận (Accepted)</strong> đề nghị hoặc được duyệt nhận việc.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold mb-1">
                <ShieldAlert size={15} />
                <span>Giám sát rủi ro tự động (AI Risk)</span>
              </div>
              <p className="m-0">
                Hệ thống theo dõi thời gian còn lại so với hạn chót để kích hoạt các quy tắc rủi ro <strong>R01–R03</strong> khi có nguy cơ trễ hạn.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <p className="m-0">
              💡 <em>Mẹo:</em> Bạn có thể liên kết các công việc có tính phụ thuộc tuần tự (Finish-to-Start) tại trang <strong>Kiểm duyệt & Nghiệm thu</strong>.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
