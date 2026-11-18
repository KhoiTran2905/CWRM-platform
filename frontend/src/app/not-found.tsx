import Link from "next/link";

export default function NotFound() {
  return <main className="service-error"><p className="eyebrow">404</p><h1>Không tìm thấy trang</h1><p>Đường dẫn không tồn tại hoặc không còn khả dụng.</p><Link className="button button-primary" href="/workspaces">Về Workspace</Link></main>;
}
