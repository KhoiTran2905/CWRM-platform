# CWRM-26 — Bàn giao PR tích hợp frontend Sprint 2

**Phạm vi:** Chuẩn bị PR đưa frontend skeleton CWRM-14 vào `main` để Khôi review và tích hợp theo GH-INT-01 / CWRM-23. Nhánh nguồn của CWRM-26 tạo từ commit CWRM-14 đã nghiệm thu `b99950a`, không lấy commit tài liệu local chưa push `819caa8` hoặc thư mục backend chưa theo dõi trong checkout cũ.

**Căn cứ:** Project Scope v0.2 Final và FINAL-01–08; OpenAPI CWRM-18 `0.3.2-draft` ở commit `d583949` còn trong quá trình review. Ban đã xác nhận phần Risk/AI/QA trên commit này; Hiệp cần chốt bốn điểm frontend theo phản hồi của Khôi ở CWRM-18. CWRM-25 đang chốt danh sách ảnh hưởng frontend; PR này bàn giao nền frontend, không nhận công việc Auth/Workspace web/API của CWRM-27.

## Kiểm tra trước PR

| Hạng mục | Kết quả |
|---|---|
| So sánh với `origin/main` | `main` chưa có frontend; PR bổ sung frontend skeleton, docs UX và README từ nhánh CWRM-14. |
| Đối chiếu PR contract CWRM-18 | Không có file trùng với thay đổi của frontend. Contract `0.3.2-draft` chưa được merge vào `main`; chỉ dùng để xác định impact. |
| Đối chiếu PR backend CWRM-12 | Cả hai nhánh thêm `.gitignore` ở root. Đây là xung đột add/add khi merge; cần hợp nhất các rule ignore của cả backend và frontend, giữ `!.env.example`, rồi kiểm lại các file được track. Không lấy thư mục backend local chưa theo dõi làm đầu vào PR này. |
| `npm.cmd ci` trong `frontend` | Thành công từ lockfile, 359 packages được cài. |
| `npm.cmd run lint` | Exit 0, không có lỗi hoặc cảnh báo lint. |
| `npm.cmd run build` | Exit 0; Next.js 16.4.6 biên dịch, kiểm TypeScript và tạo 13 route. |

`npm ci` báo 7 advisory mức moderate từ dependency hiện tại; không tự nâng phiên bản trong PR tích hợp này. Theo dõi việc rà dependency ở bước hardening nếu PM/Tech Lead yêu cầu.

## Việc Khôi cần review trong PR

1. Kiểm nguồn frontend từ CWRM-14 `b99950a`, không nhập nhầm dữ liệu local hoặc mã backend vào PR.
2. Xác nhận thứ tự merge với PR backend và contract. Khi ghép backend, xử lý xung đột `.gitignore` bằng cách giữ đủ rule từ cả hai nhánh; chạy lại lint/build sau merge.
3. Kiểm cấu hình API base URL, `src/lib/api/client.ts` và layout ở mức skeleton. Client hiện đọc Task/Risk khi có URL API; chưa có Auth/Workspace client, session hoặc route protection thật. Các phần này thuộc CWRM-27 sau khi CWRM-24 bàn giao API.
4. Ghi commit/PR merge thật và kiểm tra lại main trong CWRM-23. Build ở nhánh PR không chứng minh backend API hay Web–API–DB đã hoạt động.

## Việc còn chờ

- CWRM-23: Khôi review PR, xử lý xung đột và tích hợp vào `main`.
- CWRM-18: Hiệp xác nhận bốn điểm frontend; Khôi cập nhật Review Log theo xác nhận của Ban và chốt contract với PM.
- CWRM-24 và CWRM-27: backend Auth/Workspace và frontend dùng API thật.
- CWRM-31: Ban chạy kiểm thử Auth/Workspace khi build và môi trường test sẵn sàng.

Khi PR được review và merge, cần ghi link PR, merge commit, lệnh/kết quả kiểm tra trên main và các hạn chế còn mở vào Jira CWRM-26. Không ghi `Done` cho Auth UI hoặc E2E từ kết quả lint/build ở đây.
