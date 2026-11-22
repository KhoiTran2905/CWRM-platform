import { Suspense } from "react";
import { AppShell, PageHeading } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { RiskAdvisorPanel } from "@/components/risk-advisor-panel";
import { getRiskSnapshot, listTasks } from "@/lib/api/client";
import { requireWorkspace } from "@/lib/auth/server";
import { isDemoWorkspace, type RiskSnapshot } from "@/lib/demo-data";

const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

const fieldLabel: Record<string, string> = {
  deadlineAt: "Hạn hoàn thành",
  remainingHours: "Thời gian còn lại",
  progress: "Tiến độ",
  priority: "Độ ưu tiên",
  remainingHoursMinExclusive: "Ngưỡng thời gian dưới (không gồm)",
  remainingHoursMaxInclusive: "Ngưỡng thời gian trên (gồm)",
  progressMaxExclusive: "Ngưỡng tiến độ dưới (không gồm)",
};

const sourceLabel: Record<RiskSnapshot["evidence"][number]["source"], string> = {
  task: "Công việc",
  evaluation: "Lần đánh giá",
  rule: "Quy tắc",
  impact: "Điều kiện nâng mức",
};

const ruleExplanation: Record<RiskSnapshot["triggeredRules"][number], string> = {
  R01: "Đã quá deadline (thời gian còn lại < 0 giờ).",
  R02: "Còn 0–24 giờ và tiến độ dưới 80%.",
  R03: "Còn trên 24 đến 48 giờ và tiến độ dưới 50%.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function formatEvidenceValue(item: RiskSnapshot["evidence"][number]) {
  if (item.value === null) return "Không có";
  if (item.field === "deadlineAt" && typeof item.value === "string") return formatDate(item.value);
  if (item.unit === "hours") return `${item.value} giờ`;
  if (item.unit === "percent") return `${item.value}%`;
  return String(item.value);
}

function isThresholdEvidence(item: RiskSnapshot["evidence"][number]) {
  return item.source === "rule" || /MinExclusive|MaxInclusive|MaxExclusive$/.test(item.field);
}

function MonoTag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "danger" }) {
  return (
    <code
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        border: `1px solid ${tone === "danger" ? "var(--danger-border)" : "var(--border)"}`,
        borderRadius: 6,
        background: tone === "danger" ? "var(--danger-soft-2)" : "var(--card-soft)",
        color: tone === "danger" ? "var(--danger-text)" : "var(--code-text)",
        fontFamily: monoFont,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".02em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </code>
  );
}

export default function RiskPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  return (
    <Suspense fallback={<AppShell><PageHeading eyebrow="Manager / Risk" title="Đang tải báo cáo rủi ro" description="Đang lấy dữ liệu đánh giá và bằng chứng của công việc." /></AppShell>}>
      <RiskContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RiskContent({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const targetId = resolvedParams.taskId;
  const workspace = await requireWorkspace();
  const isDemo = isDemoWorkspace(workspace.id);
  const tasks = isDemo ? await listTasks() : [];
  const task =
    (targetId ? tasks.find((item) => item.id === targetId) : undefined) ??
    tasks.find((item) => item.riskLevel === "High" || item.riskLevel === "HIGH") ??
    tasks.find((item) => item.riskLevel === "Medium" || item.riskLevel === "MEDIUM") ??
    tasks[0];
  const snapshot = task ? await getRiskSnapshot(task.id) : undefined;
  if (!task || !snapshot)
    return (
      <AppShell>
        <PageHeading eyebrow="Manager / Risk diagnostic" title="Chưa có snapshot để chẩn đoán" description="Khi Risk Engine đánh giá task, báo cáo chẩn đoán rủi ro và đề xuất hành động sẽ xuất hiện ở đây." />
      </AppShell>
    );

  const remaining = snapshot.evidence.find((item) => item.field === "remainingHours");
  const progress = snapshot.evidence.find((item) => item.field === "progress");
  const priority = snapshot.evidence.find((item) => item.field === "priority" && item.source === "impact");
  const elevated = snapshot.baseLevel !== snapshot.riskLevel;
  const ruleTag = snapshot.triggeredRules.length
    ? `[${snapshot.triggeredRules.join(" · ")}${priority ? ` · Priority ${priority.value}` : ""}]`
    : priority
      ? `[Priority ${priority.value}]`
      : null;

  const fallbackLine = snapshot.evaluationError
    ? `LỖI ĐÁNH GIÁ · ${snapshot.evaluationError.code ?? "UNKNOWN"}${snapshot.evaluationError.message ? ` — ${snapshot.evaluationError.message}` : ""}`
    : snapshot.isCurrent === false
      ? "Cảnh báo: Dữ liệu snapshot cần được cập nhật lại trước khi ra quyết định can thiệp."
      : "Hệ thống AI Risk Engine đã hoàn thành chẩn đoán dựa trên snapshot dữ liệu mới nhất.";

  return (
    <AppShell>
      <PageHeading
        eyebrow="ĐIỀU HÀNH / CHẨN ĐOÁN RỦI RO"
        title="Báo cáo chẩn đoán rủi ro & Đề xuất hành động (Risk Diagnostic Memo)"
        description="Risk Engine đối chiếu dữ liệu công việc với quy tắc R01–R03 và lưu bằng chứng kiểm toán. Báo cáo này trình bày căn cứ kỹ thuật và phương án can thiệp; Quản lý quyết định."
      />

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">{task.id} · {task.team}</p>
            <h2>{task.title}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{ color: "var(--faint)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Cơ sở <MonoTag>{snapshot.baseLevel}</MonoTag>
            </span>
            {elevated && <span style={{ color: "var(--faint)", fontSize: 13, fontWeight: 700 }}>→</span>}
            <StatusBadge value={snapshot.riskLevel} />
            {ruleTag && <MonoTag tone={snapshot.riskLevel === "HIGH" ? "danger" : "default"}>{ruleTag}</MonoTag>}
          </div>
        </div>
        <p className="risk-summary">
          {remaining && progress
            ? `Tại thời điểm đánh giá: còn ${formatEvidenceValue(remaining)}, tiến độ ${formatEvidenceValue(progress)}.`
            : "Xem bằng chứng của lần đánh giá này."}
          {priority && elevated ? ` Mức cơ sở ${snapshot.baseLevel} được nâng lên ${snapshot.riskLevel} do ưu tiên ${priority.value}.` : ""}
        </p>
        <div className="detail-grid">
          <div><span>Trạng thái công việc</span><StatusBadge value={task.status} /></div>
          <div><span>Trạng thái giao việc</span>{task.assignmentStatus ? <StatusBadge value={task.assignmentStatus} /> : <strong>Chưa có người nhận việc</strong>}</div>
          <div><span>Đánh giá lúc (giờ Việt Nam)</span><strong>{formatDate(snapshot.evaluatedAt)}</strong></div>
          <div><span>Độ mới dữ liệu</span><strong>{snapshot.isCurrent === false ? "Snapshot đã cũ" : snapshot.isCurrent === true ? "Hiện tại" : "Chưa xác minh"}</strong></div>
        </div>
        <div className="rule-callout">
          <strong>Vì sao kích hoạt {snapshot.triggeredRules.join(", ") || "không có rule"}?</strong>
          {snapshot.triggeredRules.length ? snapshot.triggeredRules.map((rule) => (
            <span key={rule}><code style={{ fontFamily: monoFont, color: "var(--callout-strong)", fontWeight: 700 }}>{rule}</code>: {ruleExplanation[rule] ?? "Xem evidence và phiên bản rule để biết điều kiện kích hoạt."}</span>
          )) : <span>Đầu vào hợp lệ nhưng không thỏa điều kiện của R01–R03.</span>}
          {priority && elevated && <span>Độ ưu tiên {priority.value} nâng mức cơ sở {snapshot.baseLevel} lên {snapshot.riskLevel}; mức ưu tiên không tự tạo rủi ro.</span>}
        </div>
        <div className="divider" />
        <div className="rule-callout" style={{ marginTop: 0 }}>
          <strong>Ngữ cảnh cần phân biệt</strong>
          <span>Trở ngại đang mở làm công việc ở trạng thái Bị nghẽn. Trong quy tắc R01–R03, trở ngại chưa tự kích hoạt rủi ro theo thời lượng. Muốn gửi Nghiệm thu phải giải phóng trở ngại trước.</span>
        </div>
        {snapshot.evaluationError && <p className="warning-line">Lần đánh giá mới gặp lỗi: {snapshot.evaluationError.message ?? snapshot.evaluationError.code}. Bằng chứng của snapshot trước vẫn xem được.</p>}
        <p className="meta-line">Bằng chứng chẩn đoán được tổng hợp tự động từ tiến độ, hạn chót và quy tắc rủi ro R01–R03 của dự án.</p>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Biên bản chẩn đoán & Phương án can thiệp</p>
            <h2>Căn cứ kỹ thuật và phương án can thiệp</h2>
          </div>
          <span className="count-label">{snapshot.evidence.length} bằng chứng · {snapshot.ruleVersion}</span>
        </div>
        <div className="two-column-layout">
          <div>
            <h3 style={{ marginBottom: 6 }}>Căn cứ kỹ thuật & Kiểm toán bằng chứng</h3>
            <p className="section-intro">Bằng chứng gốc tạo nên mức rủi ro; mã số, giá trị và ngưỡng rule hiển thị theo dữ liệu snapshot, không qua can thiệp của AI.</p>
            {snapshot.evidence.length ? (
              <div className="table-scroll">
                <table className="data-table evidence-table">
                  <thead><tr><th>Mã</th><th>Nguồn / Quy tắc</th><th>Trường dữ liệu</th><th>Giá trị / Ngưỡng</th></tr></thead>
                  <tbody>
                    {snapshot.evidence.map((item) => (
                      <tr key={item.id}>
                        <td><code>{item.id}</code></td>
                        <td>{sourceLabel[item.source]}{item.ruleId ? <> · <code>{item.ruleId}</code></> : ""}</td>
                        <td>{fieldLabel[item.field] ?? item.field}</td>
                        <td>
                          <code style={{ color: "var(--text)", fontWeight: 700 }}>{formatEvidenceValue(item)}</code>
                          {isThresholdEvidence(item) && <span style={{ display: "block", marginTop: 3, color: "var(--faint)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Ngưỡng {item.ruleId ?? "quy tắc"}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="helper-note">Không có quy tắc nào kích hoạt ở lần đánh giá này.</p>}
          </div>
          <div>
            <h3 style={{ marginBottom: 6 }}>Phương án can thiệp</h3>
            <p className="section-intro">Quản lý chọn một phương án; hệ thống ghi nhận lý do, lưu nhật ký kiểm toán rồi đánh giá lại rủi ro.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="flow-stage-card" style={{ borderTop: "3px solid var(--danger)" }}>
                <span>Phương án 1 · Ưu tiên xử lý trước</span>
                <strong>Tháo gỡ Trở ngại (Blocker)</strong>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.55 }}>
                  <strong style={{ color: "var(--text-2)" }}>Căn cứ:</strong> {remaining && progress ? `còn ${formatEvidenceValue(remaining)}, tiến độ ${formatEvidenceValue(progress)}` : "bằng chứng ev-02, ev-03"}; trở ngại đang mở khiến công việc đứng ở trạng thái Bị nghẽn và không gửi nghiệm thu được.
                </p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.55 }}>
                  <strong style={{ color: "var(--text-2)" }}>Tác động:</strong> khôi phục khả năng hoàn thành và đưa công việc về luồng Đang làm → Nghiệm thu.
                </p>
                <button className="button button-primary" disabled title="Cần quyền Quản lý, ghi lý do kiểm toán trước khi áp dụng">Áp dụng phương án</button>
              </div>
              <div className="flow-stage-card" style={{ borderTop: "3px solid var(--warm)" }}>
                <span>Phương án 2 · Xử lý khi thiếu nguồn lực</span>
                <strong>Điều chỉnh hạn chót</strong>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.55 }}>
                  <strong style={{ color: "var(--text-2)" }}>Căn cứ:</strong> ngưỡng R03 còn hiệu lực (24–48 giờ, tiến độ dưới 50%); tiến độ thực tế không theo kịp hạn hiện tại.
                </p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.55 }}>
                  <strong style={{ color: "var(--text-2)" }}>Tác động:</strong> dời hạn chót làm giảm áp lực quy tắc R03, nhưng các công việc phụ thuộc sẽ dời theo và cần cập nhật lý do kiểm toán.
                </p>
                <button className="button button-secondary" disabled title="Cần quyền Quản lý, ghi lý do kiểm toán trước khi áp dụng">Áp dụng phương án</button>
              </div>
            </div>
            <div className="rule-callout" style={{ borderLeftColor: "var(--info-text)", background: "var(--info-soft)", color: "var(--info-text)" }}>
              <strong style={{ color: "var(--info-text)" }}>Trạng thái kết nối chẩn đoán</strong>
              <span style={{ fontFamily: monoFont, fontSize: 11, lineHeight: 1.6 }}>{fallbackLine}</span>
              {snapshot.evaluationError && <span>Nút áp dụng chỉ mở khi lỗi cho phép thử lại; khi đó chọn Thử lại để đánh giá lại snapshot.</span>}
            </div>
          </div>
        </div>
      </section>

      <RiskAdvisorPanel task={task} snapshot={snapshot} />
    </AppShell>
  );
}
