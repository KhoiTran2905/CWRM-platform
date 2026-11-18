import { AppContextProvider } from "@/components/app-context";
import { getSelectedWorkspace, requireAccount } from "@/lib/auth/server";

export const instant = false;

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();
  const workspace = await getSelectedWorkspace();
  return <AppContextProvider account={account} workspace={workspace}>{children}</AppContextProvider>;
}
