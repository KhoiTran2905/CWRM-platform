import { redirect } from "next/navigation";
import { accessToken } from "@/lib/auth/server";

export default async function Home() {
  const token = await accessToken();
  if (token) {
    redirect("/workspaces");
  } else {
    redirect("/login");
  }
}

