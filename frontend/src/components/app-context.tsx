"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Account, Workspace } from "@/lib/auth/types";

const AppContext = createContext<{ account: Account; workspace: Workspace | null } | null>(null);

export function AppContextProvider({ account, workspace, children }: { account: Account; workspace: Workspace | null; children: ReactNode }) {
  return <AppContext.Provider value={{ account, workspace }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContextProvider is required");
  return context;
}
