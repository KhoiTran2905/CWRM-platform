"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppContext } from "@/components/app-context";

interface NavItem {
  href: string;
  label: string;
  group: "Manager" | "Member";
  team: string;
  icon: (active: boolean) => ReactNode;
}

function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconTasks({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconReview({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function IconRisk({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconMyWork({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconOpenWork({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

const navigation: NavItem[] = [
  { href: "/manager", label: "Tổng quan điều hành", group: "Manager", team: "Ban Điều phối", icon: (active) => <IconDashboard active={active} /> },
  { href: "/tasks", label: "Quản lý công việc", group: "Manager", team: "Ban Điều phối", icon: (active) => <IconTasks active={active} /> },
  { href: "/review", label: "Kiểm duyệt & Nghiệm thu", group: "Manager", team: "Ban Điều phối", icon: (active) => <IconReview active={active} /> },
  { href: "/risk", label: "Kiểm soát rủi ro AI", group: "Manager", team: "Ban Điều phối", icon: (active) => <IconRisk active={active} /> },
  { href: "/my-work", label: "Nhiệm vụ trực tiếp", group: "Member", team: "Đội ngũ Thực thi", icon: (active) => <IconMyWork active={active} /> },
  { href: "/open-work", label: "Hàng đợi nhận việc", group: "Member", team: "Đội ngũ Thực thi", icon: (active) => <IconOpenWork active={active} /> },
];

function resolveScreenInfo(pathname: string): { screen: string; team: string } {
  const matched = navigation.find((item) => item.href === pathname);
  if (matched) {
    return { screen: matched.label, team: matched.team };
  }
  if (pathname === "/tasks/new") {
    return { screen: "Khởi tạo công việc", team: "Ban Điều phối" };
  }
  if (pathname.startsWith("/tasks/")) {
    return { screen: "Chi tiết công việc", team: "Ban Điều phối" };
  }
  return { screen: "Bàn làm việc", team: "Hệ thống" };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { account, workspace } = useAppContext();
  const { screen, team } = resolveScreenInfo(pathname);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (/^TASK-\d+/i.test(q)) {
      router.push(`/tasks/${q.toUpperCase()}`);
    } else {
      router.push(`/tasks`);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  const userInitial = (account?.displayName ?? "U").trim().charAt(0).toUpperCase();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link href="/workspace" className="brand" aria-label="CWRM, về Bàn làm việc dự án">
          <span className="brand-mark">
            C<span className="brand-mark-dot" />
          </span>
          <div className="brand-text-block">
            <strong>CWRM</strong>
            <small>Hệ thống Điều hành</small>
          </div>
        </Link>

        <Link href="/workspaces" className="workspace-chip" title="Nhấn để đổi Không gian làm việc">
          <div className="workspace-chip-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="workspace-chip-info">
            <small>DỰ ÁN HIỆN TẠI</small>
            <strong>{workspace?.name ?? "Chưa chọn Workspace"}</strong>
          </div>
          <span className="workspace-caret" aria-hidden="true">⌄</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="sidebar-nav">
          {(["Manager", "Member"] as const).map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-group-label">
                {group === "Manager" ? "ĐIỀU HÀNH DỰ ÁN" : "TÁC NGHIỆP TRỰC TIẾP"}
              </p>
              {navigation
                .filter((item) => item.group === group)
                .map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href === "/tasks" && pathname.startsWith("/tasks"));
                  return (
                    <Link
                      href={item.href}
                      key={item.href}
                      className={`nav-link ${active ? "active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        {item.icon(active)}
                      </span>
                      <span className="nav-text">{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="sidebar-user-card">
          <div className="user-avatar" aria-hidden="true">
            {userInitial}
          </div>
          <div className="user-info">
            <strong className="user-name">{account?.displayName ?? "Người dùng"}</strong>
            <span className="user-role">{account?.email ?? "Thành viên"}</span>
          </div>
          <button
            type="button"
            className="user-logout-btn"
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
            aria-label="Đăng xuất"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <nav aria-label="Điều hướng phân cấp" className="breadcrumbs">
              <ol className="breadcrumb-list">
                <li className="breadcrumb-item">
                  <Link href="/workspace" className="breadcrumb-link">
                    {workspace?.name ?? "Không gian làm việc"}
                  </Link>
                </li>
                <li className="breadcrumb-separator" aria-hidden="true">/</li>
                <li className="breadcrumb-item">
                  <span className="breadcrumb-team">{team}</span>
                </li>
                <li className="breadcrumb-separator" aria-hidden="true">/</li>
                <li className="breadcrumb-item breadcrumb-current" aria-current="page">
                  <span className="breadcrumb-current-text">{screen}</span>
                </li>
              </ol>
            </nav>
          </div>

          <div className="topbar-tools">
            <form onSubmit={handleSearchSubmit} className="topbar-search" role="search">
              <svg className="topbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                className="topbar-search-input"
                placeholder="Tìm mã task (VD: TASK-103)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Tìm kiếm công việc"
              />
              <kbd className="topbar-search-kbd">Ctrl+K</kbd>
            </form>

            <ThemeToggle />
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}
