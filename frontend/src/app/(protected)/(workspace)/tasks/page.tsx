import Link from "next/link";
import { AppShell, PageHeading } from "@/components/app-shell";
import { TaskTable } from "@/components/task-table";
import { listTasks } from "@/lib/api/client";
import { requireWorkspace } from "@/lib/auth/server";

export default async function TasksPage() {
  const workspace = await requireWorkspace();
  const isDemo = workspace.id === "44444444-4444-4444-8444-444444444444" || workspace.name.toLowerCase().includes("marketing");
  const demoTasks = isDemo ? await listTasks() : [];
  return (
    <AppShell>
      <style>{`
        .table-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; flex-shrink: 0; }
        .table-legend { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; color: var(--muted); font-size: 11px; font-weight: 600; }
        .table-legend > span { display: inline-flex; align-items: center; gap: 5px; }
        .legend-avatar { display: inline-grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; color: #ffffff; font-size: 8px; font-weight: 800; }
        .legend-avatar-a { background: #1f3a5f; }
        .legend-avatar-r { background: #0f766e; }
      `}</style>
      <PageHeading
        eyebrow="ĐIỀU HÀNH DỰ ÁN"
        title="Danh sách công việc"
        description="Theo dõi toàn bộ công việc trong dự án, phân công trách nhiệm RACI và tiến độ thực tế."
        action={<Link className="button button-primary" href="/tasks/new">+ Tạo công việc</Link>}
      />
      <section className="panel panel-fill">
        <div className="section-header"><h2>Tất cả task</h2><span className="count-label">{demoTasks.length} công việc</span></div>
        <div className="table-toolbar">
          <div className="table-legend">
            <span><span className="legend-avatar legend-avatar-a">A</span> Accountable · nghiệm thu</span>
            <span><span className="legend-avatar legend-avatar-r">R</span> Responsible · thực hiện</span>
          </div>
          <span className="count-label">Rê chuột lên dòng để mở thao tác nhanh</span>
        </div>
        <TaskTable tasks={demoTasks} />
      </section>
    </AppShell>
  );
}
