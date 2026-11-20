# Backend CWRM

Khung API NestJS 12 dùng PostgreSQL và Prisma 7 cho nền tảng điều phối công việc và quản trị rủi ro CWRM.

## Yêu cầu máy

- Node.js 22.22.3 trở lên (dòng 22), 24.15 trở lên (dòng 24) hoặc từ 26. Đây là yêu cầu của Nest CLI; bản thấp hơn vẫn cài được nhưng `npm ci` báo `EBADENGINE`. Đã kiểm chứng trên Node 24.22.2; Node 24.13 và 24.14 chạy được kèm cảnh báo.
- Docker Desktop đang chạy.
- npm đi kèm Node.js.

## Chạy lần đầu

Chạy các lệnh theo thứ tự từ thư mục `backend/`.

PowerShell:

```powershell
Copy-Item .env.example .env
npm ci
npm run db:up
npm run db:deploy
npm run db:seed
npm run start:dev
```

macOS/Linux:

```bash
cp .env.example .env
npm ci
npm run db:up
npm run db:deploy
npm run db:seed
npm run start:dev
```

`npm ci` chạy `prisma generate` tự động. Migration deploy áp dụng schema hiện có; seed được chạy riêng và có thể lặp lại. Lệnh seed cần `SEED_DEMO_PASSWORD` trong `.env`.

PostgreSQL chạy trong Docker và chỉ mở trên `127.0.0.1` của máy thật ở cổng **5433** (không phải 5432), để không đụng PostgreSQL khác có sẵn trên máy. Cụm Docker tên `cwrm`, container là `cwrm-db-1`.

Nếu PowerShell báo `npm.ps1 cannot be loaded because running scripts is disabled`, hãy gõ `npm.cmd` thay cho `npm` (ví dụ `npm.cmd ci`), hoặc chạy các lệnh trong Command Prompt hay Git Bash.

Sau khi ứng dụng khởi động, kiểm tra:

- Health API: <http://localhost:3001/api/v1/health>
- Swagger UI: <http://localhost:3001/api/docs>

Health thực hiện truy vấn `SELECT 1` để xác nhận kết nối PostgreSQL. Nếu database chưa sẵn sàng, API trả HTTP 503.

## Lệnh thường dùng

| Lệnh | Tác dụng |
|---|---|
| `npm run start:dev` | Chạy NestJS ở chế độ theo dõi thay đổi |
| `npm run build` | Sinh Prisma Client và build ứng dụng |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | Kiểm tra mã nguồn bằng oxlint |
| `npm test` | Chạy unit test bằng Vitest |
| `npm run test:e2e` | Chạy e2e test bằng Vitest, không cần database |
| `npm run db:up` | Khởi động PostgreSQL bằng Docker Compose |
| `npm run db:down` | Dừng PostgreSQL; giữ nguyên volume dữ liệu |
| `npm run db:generate` | Sinh Prisma Client từ schema |
| `npm run db:migrate` | Tạo và áp dụng migration khi phát triển |
| `npm run db:deploy` | Áp dụng các migration đã có |
| `npm run db:seed` | Tạo hoặc cập nhật dữ liệu demo |

Chạy unit test bằng `npm test` và e2e không cần database bằng `npm run test:e2e`. Test tích hợp dùng PostgreSQL thật qua `npm run test:int`; cần khởi động Docker bằng `npm run db:up` và cấu hình `TEST_DATABASE_URL` trỏ tới database riêng có tên kết thúc bằng `_test`. Bộ test tạo database nếu chưa có, áp dụng migration và xóa các bảng dữ liệu của database đó trước từng test.

## Tài khoản demo

Seed tạo ba tài khoản giả:

- `manager@example.com` — Trưởng nhóm Marketing.
- `content@example.com` — Chuyên viên nội dung.
- `designer@example.com` — Thiết kế đồ họa.

Cả ba dùng mật khẩu được đặt trong `SEED_DEMO_PASSWORD` ở `.env`. README và mã nguồn không chứa mật khẩu thực.

Dữ liệu demo theo kịch bản Marketing: workspace "Marketing Demo", team "Marketing", role Content và Designer, skill Copywriting và Figma, milestone "Campaign Launch" và ba task (viết nội dung, thiết kế poster, chạy quảng cáo).

Mỗi lần chạy lại `npm run db:seed`, ba task demo được đưa về `TO_DO`, progress 0 và hạn được tính lại từ thời điểm chạy (poster còn 40 giờ). Dữ liệu khác bạn tự tạo không bị xóa.

Muốn xóa sạch database để làm lại từ đầu:

```bash
docker compose down -v
npm run db:up
npm run db:deploy
npm run db:seed
```

## Cấu hình môi trường

Sao chép `.env.example` thành `.env` rồi điều chỉnh các giá trị cho máy cá nhân. Các giá trị mẫu trong file chỉ phục vụ phát triển cục bộ. Nếu đổi `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` hoặc `POSTGRES_PORT`, hãy cập nhật `DATABASE_URL` tương ứng.

`DATABASE_URL` và `JWT_SECRET` bắt buộc. `JWT_SECRET` sau khi bỏ khoảng trắng hai đầu phải dài ít nhất 32 ký tự; giá trị mẫu trong `.env.example` chỉ dùng trên máy cá nhân. `JWT_EXPIRES_IN_SECONDS` mặc định là `3600` và nhận số nguyên từ `60` đến `86400`. `BCRYPT_COST` mặc định là `10` và nhận số nguyên từ `4` đến `15`. `PORT` mặc định là `3001`, `CORS_ORIGIN` mặc định là `http://localhost:3000`, và `NODE_ENV` mặc định là `development`. `CORS_ORIGIN` nhận nhiều origin, phân tách bằng dấu phẩy. Mật khẩu demo bắt buộc khi chạy seed.

`TEST_DATABASE_URL` chỉ dùng cho `npm run test:int`. Database trong URL này phải riêng cho kiểm thử và tên phải kết thúc bằng `_test`; ví dụ trong `.env.example` trỏ tới `cwrm_test` trên cổng `5433`.

## Cấu trúc thư mục

```text
backend/
├── prisma/
│   ├── migrations/       # Migration PostgreSQL có phiên bản
│   ├── schema.prisma     # Mô hình dữ liệu và enum
│   └── seed.ts           # Dữ liệu demo có thể chạy lại
├── src/
│   ├── common/           # Phong bì lỗi và bộ lọc lỗi
│   ├── config/           # Kiểm tra biến môi trường
│   ├── health/           # Endpoint kiểm tra API và database
│   ├── prisma/           # PrismaService và module dùng chung
│   ├── generated/        # Prisma Client được sinh tự động
│   ├── app.module.ts
│   ├── app.setup.ts
│   └── main.ts
├── test/                 # E2E test
├── .env.example
└── docker-compose.yml
```

## Phạm vi hiện tại

Backend hiện có đăng ký, đăng nhập, đăng xuất, đọc/cập nhật tài khoản hiện tại, tạo/liệt kê/đọc/cập nhật workspace, health API, Swagger, xử lý lỗi, migration và seed. Mọi route đều cần Bearer token trừ `GET /api/v1/health`, `POST /api/v1/auth/register` và `POST /api/v1/auth/login`. Workspace chỉ cho phép thành viên ACTIVE; đổi tên yêu cầu vai trò MANAGER. Chưa triển khai members, invitations, team, CRUD task, phân công, risk hoặc AI.

Các endpoint đã có:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/me`
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/{workspaceId}`
- `PATCH /api/v1/workspaces/{workspaceId}`
- `GET /api/v1/health`

Thiết kế gốc nằm trong tài liệu CWRM-11: ERD ở `docs/architecture/CWRM-11_ERD.md`, hợp đồng API ở `docs/api/openapi.yaml`, quyết định công nghệ ở `docs/architecture/adr/ADR-001-tech-stack.md`. Khi mã và các tài liệu này khác nhau thì phải nêu ra để thống nhất, không tự sửa một bên.

Khác với hợp đồng hiện tại ở một điểm: khi mất kết nối database, `GET /health` trả 503 với mã lỗi `SERVICE_UNAVAILABLE`; mã này sẽ được bổ sung vào `openapi.yaml` ở lần cập nhật tới.

ERD mô tả các trạng thái bằng `VARCHAR` kèm `CHECK`; schema CWRM-12 dùng enum PostgreSQL của Prisma cho các miền trạng thái, assignment mode, priority và deadline type. Các mã enum vẫn giữ dạng UPPER_SNAKE_CASE. Một số kiểm tra miền số và unique theo tên không phân biệt chữ hoa/thường được bổ sung trực tiếp trong migration SQL.

## Lỗi thường gặp

- Docker chưa bật: mở Docker Desktop rồi chạy lại `npm run db:up`.
- Cổng `3001` đã được dùng: đổi `PORT` trong `.env`.
- `npm run db:up` báo `port is already allocated`: cổng `5433` đã có chương trình khác dùng. Đổi `POSTGRES_PORT` trong `.env` sang cổng khác và sửa cùng số đó trong `DATABASE_URL`.
- Health trả 503 dù container đang chạy: kiểm tra cổng trong `DATABASE_URL` có khớp `POSTGRES_PORT` không.
- Chưa tạo `.env`: sao chép `.env.example` thành `.env` trước khi cài hoặc chạy ứng dụng.
- Seed báo thiếu mật khẩu: đặt `SEED_DEMO_PASSWORD` trong `.env` rồi chạy lại `npm run db:seed`.

## Ghi chú bảo mật

Không commit `.env` hoặc mật khẩu dùng thật. Các giá trị trong `.env.example` chỉ dành cho máy cá nhân; hãy thay chúng trước khi dùng ở môi trường khác. Dữ liệu tài khoản và nội dung seed là dữ liệu giả.
