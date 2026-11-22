# CWRM frontend

Next.js UI cho CWRM-27. `/register`, `/login`, `/workspaces`, `/workspace` dùng Auth/Workspace API thật. Các màn `/manager`, `/tasks`, `/tasks/new`, `/tasks/[id]`, `/my-work`, `/open-work`, `/review`, `/risk` vẫn minh họa dữ liệu và chưa ghi nghiệp vụ qua API. [Đối chiếu CWRM-14](../docs/ux/CWRM-14_Acceptance_Criteria_Verification.md) ghi rõ phần đã kiểm tra và bằng chứng còn thiếu.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Chạy backend trên `main` tại `http://localhost:3001`, rồi mở http://localhost:3000 (chuyển đến `/workspaces` và yêu cầu đăng nhập). `CWRM_API_BASE_URL` chỉ được đọc phía server, gồm tiền tố `/api/v1`. Đăng ký rồi đăng nhập; tạo hoặc chọn Workspace. Token nằm trong cookie HttpOnly (`cwrm_access`), không trả về JavaScript trình duyệt. Khi phiên hết hạn, ứng dụng chuyển về `/login`. Dùng `npm run lint` và `npm run build` để kiểm tra. Scripts dùng Webpack vì môi trường Windows hiện tại chặn SWC native của Turbopack.

Sau khi build, chạy `node scripts/smoke-auth-workspace.mjs` để kiểm tra luồng HTTP với backend giả lập cục bộ: bảo vệ trang, đăng ký, đăng nhập, liệt kê/tạo/chọn Workspace và đăng xuất. Kiểm tra này xác nhận giao diện ghép API đúng định dạng; bằng chứng Web–API–DB thật cần chạy thêm với backend (trên `main`) và PostgreSQL.

`src/lib/demo-data.ts` là dữ liệu minh họa theo Scope v0.1. `src/lib/api/client.ts` là đầu mối đọc task/risk, hiện mặc định dùng dữ liệu mẫu vì backend chưa có API nghiệp vụ task/risk. Chỉ bật `NEXT_PUBLIC_TASK_API_ENABLED=true` khi có API Task tương thích và cơ chế xác thực tương ứng. `RiskSnapshot` mẫu bám fixture CWRM-15 của Ban, còn `TaskSummary` là view model đã làm phẳng, **chưa phải Task schema đầy đủ** trong OpenAPI CWRM-11 `0.3.3-draft`. Mọi nút cần backend đều bị khóa hoặc ghi rõ chưa lưu dữ liệu. Không đưa token vào biến `NEXT_PUBLIC`.

## Bàn giao tích hợp Sprint 2

Nhánh CWRM-26 đưa frontend skeleton đã nghiệm thu vào PR hướng `main`. [Bảng kiểm và điểm còn chờ](../docs/integration/CWRM-26_Frontend_Integration_Handoff.md) ghi đúng commit nguồn, kết quả build và xung đột cần xử lý khi ghép backend. Contract mục tiêu hiện là OpenAPI `0.3.3-draft` của CWRM-18; Auth/Workspace API và giao diện dùng API thật được triển khai, kiểm thử ở CWRM-24/CWRM-27. Giao diện và dữ liệu minh họa trong PR này chưa phải bằng chứng Web–API–DB.
