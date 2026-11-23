import { redirect } from "next/navigation";
import { accessToken } from "@/lib/auth/server";

export const instant = false;

export default async function Home() {
  const token = await accessToken();
  if (token) {
    redirect("/workspaces");
  } else {
    redirect("/login");
  }
}

