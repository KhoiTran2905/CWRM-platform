import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import { requireWorkspace } from "@/lib/auth/server";

export default async function WorkspaceHome() {
  const workspace = await requireWorkspace();
  return <AppShell><PageHeading eyebrow="Workspace" title={workspace.name} description="Workspace này đã được tải từ API CWRM." action={<Link href="/workspaces" className="button button-secondary">Đổi Workspace</Link>} />
    <section className="panel"><h2>Đã sẵn sàng cho Auth & Workspace</h2><p>Đăng nhập, xác thực phiên, tạo, liệt kê và chọn Workspace đang dùng API thật. Các màn Task, Review và Risk trong menu là giao diện minh họa, chưa lưu dữ liệu qua API.</p></section>
  </AppShell>;
}
