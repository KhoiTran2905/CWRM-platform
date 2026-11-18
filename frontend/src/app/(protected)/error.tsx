"use client";

export default function ProtectedError({ reset }: { error: Error; reset: () => void }) {
  return <main className="service-error"><h1>Chưa tải được dữ liệu</h1><p>Không kết nối được API hoặc dữ liệu tạm thời không khả dụng. Hãy kiểm tra backend rồi thử lại.</p><button className="button button-primary" onClick={reset}>Thử lại</button></main>;
}
