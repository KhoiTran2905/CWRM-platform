import type { AssignmentStatus, RequestStatus, RiskLevel, SnapshotRiskLevel, TaskStatus } from "@/lib/demo-data";

export type BadgeKind =
  | "taskStatus"
  | "assignmentStatus"
  | "requestStatus"
  | "riskLevel"
  | "priority"
  | "assignmentMode"
  | "actionGuard";

export type BadgeValue =
  | TaskStatus
  | AssignmentStatus
  | RequestStatus
  | RiskLevel
  | SnapshotRiskLevel
  | "Direct"
  | "Open Work"
  | "Được phép Start"
  | "Start bị khóa"
  | "TO_DO"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "REVIEW"
  | "DONE"
  | "PENDING_ACCEPTANCE"
  | "ACCEPTED"
  | "DECLINED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "DIRECT"
  | "OPEN_WORK"
  | "CRITICAL"
  | "FIXED"
  | "FLEXIBLE"
  | "CAN_START"
  | "START_BLOCKED"
  | string;

interface BadgeConfig {
  label: string;
  tone: "neutral" | "info" | "warning" | "danger" | "success" | "violet";
}

const taskStatusMap: Record<string, BadgeConfig> = {
  TO_DO: { label: "Chờ thực hiện", tone: "neutral" },
  "To Do": { label: "Chờ thực hiện", tone: "neutral" },
  IN_PROGRESS: { label: "Đang làm", tone: "info" },
  "In Progress": { label: "Đang làm", tone: "info" },
  BLOCKED: { label: "Bị nghẽn", tone: "danger" },
  Blocked: { label: "Bị nghẽn", tone: "danger" },
  REVIEW: { label: "Chờ duyệt", tone: "warning" },
  Review: { label: "Chờ duyệt", tone: "warning" },
  DONE: { label: "Hoàn thành", tone: "success" },
  Done: { label: "Hoàn thành", tone: "success" },
};

const assignmentStatusMap: Record<string, BadgeConfig> = {
  PENDING_ACCEPTANCE: { label: "Chờ nhận việc", tone: "warning" },
  "Pending Acceptance": { label: "Chờ nhận việc", tone: "warning" },
  ACCEPTED: { label: "Đã nhận việc", tone: "success" },
  Accepted: { label: "Đã nhận việc", tone: "success" },
  DECLINED: { label: "Đã từ chối", tone: "neutral" },
  Declined: { label: "Đã từ chối", tone: "neutral" },
};

const requestStatusMap: Record<string, BadgeConfig> = {
  PENDING: { label: "Chờ duyệt", tone: "warning" },
  Pending: { label: "Chờ duyệt", tone: "warning" },
  APPROVED: { label: "Đã duyệt", tone: "success" },
  Approved: { label: "Đã duyệt", tone: "success" },
  REJECTED: { label: "Từ chối", tone: "danger" },
  Rejected: { label: "Từ chối", tone: "danger" },
  WITHDRAWN: { label: "Đã rút lại", tone: "neutral" },
  Withdrawn: { label: "Đã rút lại", tone: "neutral" },
};

const riskLevelMap: Record<string, BadgeConfig> = {
  LOW: { label: "Rủi ro thấp", tone: "success" },
  Low: { label: "Rủi ro thấp", tone: "success" },
  MEDIUM: { label: "Rủi ro trung bình", tone: "warning" },
  Medium: { label: "Rủi ro trung bình", tone: "warning" },
  HIGH: { label: "Rủi ro cao", tone: "danger" },
  High: { label: "Rủi ro cao", tone: "danger" },
};

const priorityMap: Record<string, BadgeConfig> = {
  LOW: { label: "Thấp", tone: "neutral" },
  Low: { label: "Thấp", tone: "neutral" },
  MEDIUM: { label: "Trung bình", tone: "info" },
  Medium: { label: "Trung bình", tone: "info" },
  HIGH: { label: "Cao", tone: "warning" },
  High: { label: "Cao", tone: "warning" },
  CRITICAL: { label: "Khẩn cấp", tone: "danger" },
  Critical: { label: "Khẩn cấp", tone: "danger" },
};

const assignmentModeMap: Record<string, BadgeConfig> = {
  DIRECT: { label: "Giao trực tiếp", tone: "info" },
  Direct: { label: "Giao trực tiếp", tone: "info" },
  OPEN_WORK: { label: "Nhận việc tự do", tone: "violet" },
  "Open Work": { label: "Nhận việc tự do", tone: "violet" },
};

const actionGuardMap: Record<string, BadgeConfig> = {
  CAN_START: { label: "Được phép bắt đầu", tone: "success" },
  "Được phép Start": { label: "Được phép bắt đầu", tone: "success" },
  "Được phép bắt đầu": { label: "Được phép bắt đầu", tone: "success" },
  START_BLOCKED: { label: "Bị khóa bắt đầu", tone: "warning" },
  "Start bị khóa": { label: "Bị khóa bắt đầu", tone: "warning" },
  "Bị khóa bắt đầu": { label: "Bị khóa bắt đầu", tone: "warning" },
};

const kindMaps: Record<BadgeKind, Record<string, BadgeConfig>> = {
  taskStatus: taskStatusMap,
  assignmentStatus: assignmentStatusMap,
  requestStatus: requestStatusMap,
  riskLevel: riskLevelMap,
  priority: priorityMap,
  assignmentMode: assignmentModeMap,
  actionGuard: actionGuardMap,
};

function resolveConfig(value: BadgeValue, kind?: BadgeKind): BadgeConfig {
  const key = String(value);
  if (kind && kindMaps[kind]?.[key]) {
    return kindMaps[kind][key];
  }
  return (
    taskStatusMap[key] ??
    riskLevelMap[key] ??
    assignmentStatusMap[key] ??
    requestStatusMap[key] ??
    assignmentModeMap[key] ??
    actionGuardMap[key] ??
    priorityMap[key] ?? { label: key, tone: "neutral" }
  );
}

type DotTone = "danger" | "warning" | "success" | "info" | "violet" | "neutral";

function resolveDotTone(tone: BadgeConfig["tone"], rawValue: string): DotTone {
  const normalized = rawValue.toUpperCase().trim();
  // Đỏ: High / Blocked, Critical, Rejected
  if (
    tone === "danger" ||
    normalized === "HIGH" ||
    normalized === "BLOCKED" ||
    normalized === "CRITICAL" ||
    normalized === "REJECTED"
  ) {
    return "danger";
  }
  // Vàng: Medium / Warning, Review, Pending, Start bị khóa
  if (
    tone === "warning" ||
    normalized === "MEDIUM" ||
    normalized === "WARNING" ||
    normalized === "REVIEW" ||
    normalized.includes("PENDING") ||
    normalized.includes("START BỊ KHÓA") ||
    normalized === "START_BLOCKED"
  ) {
    return "warning";
  }
  // Xanh: Done / Accepted / Low, Approved, Được phép Start
  if (
    tone === "success" ||
    normalized === "DONE" ||
    normalized === "ACCEPTED" ||
    normalized === "LOW" ||
    normalized === "APPROVED" ||
    normalized.includes("ĐƯỢC PHÉP START") ||
    normalized === "CAN_START"
  ) {
    return "success";
  }
  if (tone === "info") {
    return "info";
  }
  if (tone === "violet") {
    return "violet";
  }
  return "neutral";
}

const dotColorClasses: Record<DotTone, string> = {
  danger: "status-badge-dot-danger bg-red-500",
  warning: "status-badge-dot-warning bg-amber-500",
  success: "status-badge-dot-success bg-emerald-500",
  info: "status-badge-dot-info bg-sky-500",
  violet: "status-badge-dot-violet bg-purple-500",
  neutral: "status-badge-dot-neutral bg-slate-400",
};

export function StatusBadge({
  value,
  kind,
  label,
  className = "",
}: {
  value: BadgeValue;
  kind?: BadgeKind;
  label?: string;
  className?: string;
}) {
  const config = resolveConfig(value, kind);
  const dotTone = resolveDotTone(config.tone, String(value));
  const dotClass = dotColorClasses[dotTone];
  const displayLabel = label ?? config.label;

  return (
    <span
      className={`status-badge status-${config.tone} px-2 py-0.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 ${className}`.trim()}
    >
      <span className={`status-badge-dot ${dotClass}`} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}
