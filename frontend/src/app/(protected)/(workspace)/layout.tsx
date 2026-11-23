import { requireWorkspace } from "@/lib/auth/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireWorkspace();
  return children;
}
