"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppContext } from "@/components/app-context";
import {
  LayoutDashboard,
  CheckSquare,
  ClipboardCheck,
  ShieldAlert,
  UserCheck,
  Inbox,
  FolderGit2,
  ChevronDown,
  ChevronRight,
  Search,
  LogOut,
  ArrowLeftRight,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  group: "Manager" | "Member";
  team: string;
  icon: (active: boolean) => ReactNode;
}

const navigation: NavItem[] = [
  {
    href: "/manager",
    label: "Tổng quan điều hành",
    group: "Manager",
    team: "Ban Điều phối",
    icon: (active) => <LayoutDashboard size={18} strokeWidth={active ? 2.2 : 1.8} />,
  },
  {
    href: "/tasks",
    label: "Quản lý công việc",
    group: "Manager",
    team: "Ban Điều phối",
    icon: (active) => <CheckSquare size={18} strokeWidth={active ? 2.2 : 1.8} />,
  },
  {
    href: "/review",
    label: "Kiểm duyệt & Nghiệm thu",
    group: "Manager",
    team: "Ban Điều phối",
    icon: (active) => <ClipboardCheck size={18} strokeWidth={active ? 2.2 : 1.8} />,
  },
  {
    href: "/risk",
    label: "Kiểm soát rủi ro AI",
    group: "Manager",
    team: "Ban Điều phối",
    icon: (active) => <ShieldAlert size={18} strokeWidth={active ? 2.2 : 1.8} />,
  },
  {
    href: "/my-work",
    label: "Nhiệm vụ trực tiếp",
    group: "Member",
    team: "Đội ngũ Thực thi",
    icon: (active) => <UserCheck size={18} strokeWidth={active ? 2.2 : 1.8} />,
  },
  {
    href: "/open-work",
    label: "Hàng đợi nhận việc",
    group: "Member",
    team: "Đội ngũ Thực thi",
    icon: (active) => <Inbox size={18} strokeWidth={active ? 2.2 : 1.8} />,
  },
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
        {/* Brand Header */}
        <Link href="/workspace" className="brand" aria-label="CWRM, về Bàn làm việc dự án">
          <span className="brand-mark">
            C<span className="brand-mark-dot" />
          </span>
          <div className="brand-text-block">
            <strong>CWRM</strong>
            <small>Hệ thống Điều hành</small>
          </div>
        </Link>

        {/* Current Workspace Selector Chip */}
        <Link href="/workspaces" className="workspace-chip" title="Nhấn để đổi Không gian làm việc">
          <div className="workspace-chip-icon">
            <FolderGit2 size={16} />
          </div>
          <div className="workspace-chip-info">
            <small>DỰ ÁN HIỆN TẠI</small>
            <strong>{workspace?.name ?? "Chưa chọn Workspace"}</strong>
          </div>
          <ChevronDown size={14} className="workspace-caret" aria-hidden="true" />
        </Link>

        {/* Sidebar Nav */}
        <nav aria-label="Điều hướng chính" className="sidebar-nav">
          {(["Manager", "Member"] as const).map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-group-title">
                {group === "Manager" ? "ĐIỀU HÀNH DỰ ÁN" : "TÁC NGHIỆP TRỰC TIẾP"}
              </p>
              <ul className="nav-list">
                {navigation
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`nav-link ${active ? "nav-link-active" : ""}`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span className="nav-link-icon">{item.icon(active)}</span>
                          <span className="nav-link-label">{item.label}</span>
                          {active && <span className="nav-active-pill" />}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom User Profile Section */}
        <div className="user-profile-tile">
          <div className="user-profile-avatar" aria-hidden="true">
            {userInitial}
          </div>
          <div className="user-profile-details">
            <span className="user-profile-name" title={account?.displayName ?? "Người dùng"}>
              {account?.displayName ?? "Người dùng"}
            </span>
            <span className="user-profile-role">
              Manager
            </span>
          </div>
          <button
            type="button"
            className="user-logout-btn"
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
            aria-label="Đăng xuất"
          >
            <LogOut size={16} />
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
                <li className="breadcrumb-separator" aria-hidden="true">
                  <ChevronRight size={13} className="text-slate-400" />
                </li>
                <li className="breadcrumb-item">
                  <span className="breadcrumb-team">{team}</span>
                </li>
                <li className="breadcrumb-separator" aria-hidden="true">
                  <ChevronRight size={13} className="text-slate-400" />
                </li>
                <li className="breadcrumb-item breadcrumb-current" aria-current="page">
                  <span className="breadcrumb-current-text">{screen}</span>
                </li>
              </ol>
            </nav>
          </div>

          <div className="topbar-tools">
            <form onSubmit={handleSearchSubmit} className="topbar-search" role="search">
              <Search size={15} className="topbar-search-icon" aria-hidden="true" />
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

            <Link href="/workspaces" className="topbar-ws-switch" title="Chuyển đổi không gian làm việc">
              <ArrowLeftRight size={14} />
              <span>Đổi Workspace</span>
            </Link>

            <ThemeToggle />
          </div>
        </header>

        <main className="page-content">{children}</main>
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
