# CWRM-11 — Review Log: API, ERD và kiến trúc

## Mục đích

Ghi nhận các câu hỏi thiết kế cần Frontend (Đặng Văn Hiệp) và Risk/AI/QA (Lê Quốc Ban) xác nhận để tích hợp theo cùng hợp đồng. Đây là đề nghị review, không phải biên bản cuộc họp hoặc phản hồi đã nhận. OpenAPI 0.1.0-draft và ERD chưa được coi là phê duyệt toàn nhóm.

## Câu hỏi gửi Hiệp — Frontend

1. UI có thể ánh xạ enum API UPPER_SNAKE_CASE sang nhãn hiển thị hiện tại không? Ví dụ TO_DO → “To Do”, PENDING_ACCEPTANCE → “Pending Acceptance”, OPEN_WORK → “Open Work”.
2. Các màn TaskSummary/Risk có thể dùng các mảng responsibleUserIds, requiredRoleIds, predecessorIds (và requiredSkillIds/successorIds) thay cho một responsible, requiredRole, predecessorId không? Scope cho phép nhiều R, role yêu cầu và predecessor.
3. Schema Task trả requiredPeople, occupiedSlots (số chỗ đang giữ), openWorkOpen, openBlockerCount, affectedTaskCount, risk (snapshotId, riskLevel, evaluatedAt, isCurrent) và version để gửi lại làm expectedVersion. Các màn SC-01 đến SC-06 còn thiếu trường nào không?
4. Luồng Open Work ở API: GET eligibility trả eligible và reasons; gửi request khi không đủ điều kiện nhận 422 NOT_ELIGIBLE và không tạo request; request PENDING chưa tạo R; approve tạo ngay assignment ACCEPTED, không cần Accept lần hai. SC-04 cần thêm dữ liệu nào không?
5. Start trả 422 PREDECESSOR_NOT_DONE khi predecessor chưa Done; gửi review trả 422 OPEN_BLOCKERS_EXIST khi còn blocker mở; A trả kết quả phải gửi reason và progress mới 0–99. UI chỉ cần xử lý các mã lỗi này, hay muốn Task có sẵn cờ cho biết trước thao tác nào đang bị chặn?
6. RiskSnapshot trong demo-data.ts đang khai báo triggeredRules và ruleId là R01–R03. Contract dùng pattern R01–R12, kèm evidence id/source/field/value/unit, evaluatedAt, ruleVersion, inputFingerprint và isCurrent. UI cần đổi gì để hiển thị đủ?
7. Khi AI lỗi, API trả HTTP 502 hoặc 503 theo phong bì lỗi chung, trong details có retryable, recommendationId và fallbackExplanation (diễn giải theo mẫu của rule); risk/evidence vẫn đọc được. UI xử lý theo cách này được không, hay muốn nhận 200 kèm trạng thái FAILED? Kết quả AI cũ được đánh dấu bằng isCurrent=false.
8. My Work lấy từ ba nguồn: GET /dashboard/my-work (task tôi là R), GET /assignments (đề nghị Direct đang chờ tôi) và GET /open-work-requests (request của tôi); danh sách Open Work của team lấy từ GET /tasks với bộ lọc. Cách chia này có hợp với SC-03 và SC-04 không? Có cần thêm bộ lọc hoặc cách sắp xếp nào cho các danh sách page/pageSize?

## Câu hỏi gửi Ban — Risk/AI/QA

1. Xác nhận Risk Engine thuần nhận RiskTaskContext, thời điểm đánh giá và cấu hình; trả riskLevel/baseLevel, triggeredRules R01–R12, evidence, evaluatedAt, ruleVersion và fingerprint được không?
2. CWRM-15 POC có R01–R03; CWRM-11 mở schema/API pattern R01–R12 theo Scope. Ban có dự kiến shape evidence, field/unit hoặc rule metadata nào khác cần đưa vào contract không?
3. Đề xuất inputFingerprint (Architecture mục 4): SHA-256 trên JSON chuẩn hóa của dữ liệu gốc; không gồm evaluatedAt và các số giờ suy ra từ thời điểm đánh giá, để fingerprint chỉ đổi khi dữ liệu task đổi. Tính hiện hành của kết quả AI so thêm riskLevel, baseLevel và triggeredRules. Ban có cần thay danh sách trường, thứ tự mảng hoặc định dạng digest không?
4. Snapshot lưu trong risk_snapshots bất biến, ruleVersion/context/fingerprint ở snapshot và evidence thành bảng con theo evidence id ổn định trong snapshot có phù hợp không? Ban muốn retention/lịch sử có dạng khác không?
5. Khi thiếu deadline/progress hoặc input sai miền, đề xuất không thay bằng 0 và không tạo snapshot mới; mã RISK_INPUT_INVALID/422. Khi engine lỗi lúc người dùng vừa cập nhật task, đề xuất vẫn giữ thay đổi nghiệp vụ và trả risk.isCurrent=false thay vì rollback (Architecture mục 7A). Ban đồng ý hướng này không, và cần chi tiết lỗi theo trường nào?
6. Đề xuất AIRecommendation gắn riskSnapshotId, trạng thái SUCCESS/FAILED, provider/model, summary, evidence IDs, 2–3 phương án, lỗi an toàn và fingerprint; kết quả FAILED vẫn cho retry. Ban có cần thêm request/usage/latency fields hay cấu trúc lưu khác không? Không ghi usage là yêu cầu đã chốt.
7. AI chỉ nhận snapshot hiện hành của task; snapshot đã cũ trả 409 SNAPSHOT_NOT_CURRENT. Nếu đã có kết quả SUCCESS cho snapshot tương đương thì trả lại kết quả đó (reused=true), không gọi AI. Cách xử lý khi task đổi trong lúc đang gọi AI và thời điểm lưu recommendation như vậy đã đúng nhu cầu CWRM-16 chưa?
8. Fallback theo mẫu rule cho AI lỗi có nên lưu trong recommendation hay chỉ dựng ở response? Bản draft lưu bản ghi FAILED kèm mã lỗi, còn fallbackExplanation được dựng khi trả response. TC-12 cần kiểm tra HTTP 502/503 và các trường trong details như ở câu 7 của phần Frontend.
9. Ban đang thử OpenAI Responses API ở POC CWRM-16; ADR-001 để provider/model ngoài phạm vi. Có yêu cầu nào khiến backend port phải đổi trước khi CWRM-16 chốt provider không?

## Điểm contract khác bản nháp hiện có

| Nguồn nháp | Khác biệt quan sát được | Cách thể hiện trong CWRM-11 draft | Cần review |
|---|---|---|---|
| Hiệp — frontend/src/lib/demo-data.ts | TaskStatus, AssignmentStatus, RequestStatus, RiskLevel và AssignmentMode dùng nhãn hiển thị như “To Do”, “Pending Acceptance”, “Open Work”; D4 yêu cầu mã UPPER_SNAKE_CASE trong API/DB | Enum API/DB là TO_DO, PENDING_ACCEPTANCE, OPEN_WORK… UI ánh xạ nhãn | Hiệp xác nhận mapping và impact lên fixture/UI |
| Hiệp — TaskSummary | Có một responsible, một requiredRole, một predecessorId; riskLevel là một trường phẳng | Contract trả responsibleUserIds, requiredRoleIds, predecessorIds dạng mảng; thêm requiredSkillIds/successorIds; risk là object tóm tắt có isCurrent | Hiệp xác nhận màn và model cần hiển thị nhiều giá trị |
| Ban — CWRM-15_risk-result.schema.json | triggeredRules và evidence.ruleId khóa enum R01–R03; risk level là Low/Medium/High | OpenAPI pattern cho R01–R12; mã level LOW/MEDIUM/HIGH theo D4/Scope | Ban xác nhận mở pattern và giữ mức risk đúng Scope |
| Ban — CWRM-15 POC | inputFingerprint đang chờ thuật toán; nơi lưu snapshot/ruleVersion chưa chốt; lỗi thiếu/sai input cần rõ | Đề xuất fingerprint SHA-256, risk_snapshots/risk_evidence, mã RISK_INPUT_INVALID; đánh dấu chờ Ban xác nhận | Ban phản hồi các câu 3–5 |
| Ban — CWRM-16_POC_Notes.md và CWRM-16_ai-poc.mjs | POC đã chuẩn bị/kiểm tra cục bộ nhưng chưa có request thật; chưa tích hợp backend; storage và snapshot stale còn cần chốt; OpenAI chỉ là lựa chọn thử | API lưu AIRecommendation theo snapshot, status SUCCESS/FAILED, fingerprint và isCurrent/reuse; provider giữ mở | Ban xác nhận storage, currentness, lỗi và ranh giới provider |
| Hiệp — CWRM-13 user flow/wireframes | Draft đã nêu task status tách assignment/request, R chỉ sau Accept/Approve, Start dependency guard, Review/return và fallback | Contract giữ các hành vi này và tách action endpoint | Hiệp rà lại tên endpoint/response để UI consume |

Các ghi nhận mô tả đúng tài liệu đã đọc, không kết luận người viết nháp sai; Scope v0.1 và các quyết định D1–D6 trong task CWRM-11 là cơ sở contract ưu tiên.

## Bảng ghi nhận phản hồi

Không có phản hồi được điền trước. Người review có thể ghi câu trả lời, ngày, quyết định/đề nghị thay đổi và link Jira/commit sau khi thực sự phản hồi.

| Người review | Vai trò | Ngày nhận phản hồi | Phản hồi / điểm cần sửa | Trạng thái |
|---|---|---|---|---|
| Đặng Văn Hiệp | Frontend/UI/UX |  |  | **CHỜ PHẢN HỒI** |
| Lê Quốc Ban | Risk Engine/AI/QA |  |  | **CHỜ PHẢN HỒI** |

## Trạng thái tổng hợp

- Đã chuẩn bị câu hỏi và contract draft cho review CWRM-11.
- Kiểm tra tự động ngày 11/11/2026: `redocly lint` trên openapi.yaml không báo lỗi, còn 3 cảnh báo (thiếu license, server là localhost, /health không có response 4xx); 7 sơ đồ Mermaid trong Architecture và ERD render được. Đây là kiểm tra cú pháp tài liệu, chưa phải kiểm thử backend.
- Chưa ghi nhận phản hồi của Hiệp hoặc Ban.
- ADR-001 ghi Tech Lead chấp thuận ngày 11/11/2026; chờ phản hồi review của Hiệp và Ban.
- Không ghi nhận cuộc họp, quyết định nhóm hoặc kết quả tích hợp chưa diễn ra.
