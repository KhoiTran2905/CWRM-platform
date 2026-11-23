import { AuthForm } from "@/components/auth-form";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; expired?: string }>;
}) {
  const params = await searchParams;
  const notice = params.registered === "1" ? "Đăng ký thành công. Hãy đăng nhập." : params.expired === "1" ? "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại." : undefined;
  return <AuthForm mode="login" notice={notice} />;
}
