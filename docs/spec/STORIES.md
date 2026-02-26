# User Stories & Development Backlog (STORIES)

**Project Name:** FastRezu 2.0 - The Career OS
**Methodology:** BMAD + Ralph Loop (Strict Sequential Execution)

## Hướng dẫn thực thi (Execution Guidelines dành cho AI/Developer)

1. Bắt đầu từ Story 1.1 và đi tuần tự.
2. **KỶ LUẬT:** Mở một phiên làm việc (context) mới cho mỗi Epic. Không làm gộp nhiều Story trong một lần commit.
3. Trước khi báo cáo hoàn thành một Story, phải tự kiểm tra lại các Tiêu chí hoàn thành (Acceptance Criteria).
4. Viết test cơ bản hoặc tự manual test (console.log) trước khi sang bước tiếp theo.

---

## EPIC 1: Nền tảng & Cơ sở dữ liệu (The Foundation)

_Mục tiêu: Thiết lập xong toàn bộ schema Supabase V2 và các Type definitions._

### Story 1.1: Khởi tạo Database Schema V2 & RLS

- **Mô tả:** Là một Backend Developer, tôi muốn chạy script SQL tạo các bảng `profiles`, `master_profiles`, `jobs`, `job_analyses`, `resumes` trong Supabase và thiết lập Row Level Security (RLS) để đảm bảo dữ liệu user được bảo mật.
- **Tiêu chí hoàn thành (AC):**
  - [x] Chạy thành công SQL Script (từ ARCHITECTURE.md) trong Supabase SQL Editor.
  - [x] Bật RLS cho tất cả 5 bảng.
  - [x] Tạo Policy: User chỉ có thể SELECT/INSERT/UPDATE/DELETE dữ liệu có `user_id` của chính họ.

### Story 1.2: Cập nhật TypeScript Types

- **Mô tả:** Là một Frontend Developer, tôi muốn tự động sinh (hoặc viết tay) file `database.types.ts` khớp 100% với Schema vừa tạo để có Type-safety khi code Next.js.
- **Tiêu chí hoàn thành (AC):**
  - [x] File `src/types/database.types.ts` chứa interface của các bảng mới.
  - [x] Xóa/Comment out các type cũ của V1 (như `cv_sections`) không còn sử dụng.

---

## EPIC 2: The Vault (Kho Dữ Liệu Gốc)

_Mục tiêu: Xây dựng giao diện và logic để user nhập liệu một lần dùng mãi mãi._

### Story 2.1: Giao diện Nhập liệu Master Profile (UI)

- **Mô tả:** Là một Người dùng, tôi muốn có một trang `/dashboard/vault` để nhập các thông tin sự nghiệp thô (Thông tin cá nhân, Học vấn, Kinh nghiệm, Kỹ năng) mà không cần quan tâm đến định dạng in ấn.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Tạo UI cho trang `/dashboard/vault` (sử dụng Shadcn UI/Tailwind).
  - [ ] Có các Form/Modal để thêm/sửa/xóa từng mục (ví dụ: Thêm 1 công ty cũ, thêm 1 kỹ năng).
  - [ ] Giao diện trực quan, lưu state ở Client (useState/useReducer) trước khi bấm Lưu.

### Story 2.2: Tích hợp Supabase cho The Vault (Logic)

- **Mô tả:** Là một Hệ thống, tôi muốn lưu dữ liệu từ UI của Story 2.1 vào bảng `master_profiles` trên Supabase dưới dạng JSON.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Viết Server Actions (hoặc API routes) để thực hiện CRUD cho `master_profiles`.
  - [ ] Khi user vào lại trang `/dashboard/vault`, dữ liệu cũ phải được fetch và hiển thị (Server Components ưu tiên).
  - [ ] Hiển thị Toast notification báo "Lưu thành công".

---

## EPIC 3: The War Room (Quản lý Ứng tuyển - Kanban)

_Mục tiêu: Xây dựng trung tâm theo dõi các Job đang apply._

### Story 3.1: Giao diện Kanban Board

- **Mô tả:** Là một Người tìm việc, tôi muốn trang chủ `/dashboard/jobs` hiển thị dưới dạng bảng Kanban với các cột: Saved, Optimized, Applied, Interviewing, Offer, Rejected.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Dựng UI Kanban board.
  - [ ] Fetch danh sách `jobs` từ Supabase và phân loại thẻ (Card) vào đúng cột dựa trên trường `status`.

### Story 3.2: Tính năng Thêm Job mới (Modal)

- **Mô tả:** Là một Người tìm việc, tôi muốn bấm nút "Add Job", dán text Mô tả công việc (JD) vào form để lưu vào hệ thống.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Tạo Modal "Add Job". Có các trường: Title, Company, Job URL (optional), và Textarea lớn cho Raw JD Text.
  - [ ] Submit form lưu vào bảng `jobs` với trạng thái mặc định là `saved`.
  - [ ] Kanban board tự động cập nhật thẻ mới.

### Story 3.3: Kéo thả cập nhật trạng thái (Drag & Drop)

- **Mô tả:** Là một Người tìm việc, tôi muốn kéo một thẻ Job từ cột "Saved" sang cột "Applied" để hệ thống tự cập nhật trạng thái.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Tích hợp thư viện DnD (ví dụ: `@hello-pangea/dnd` hoặc HTML5 DnD API).
  - [ ] Khi thả thẻ vào cột mới, gọi API/Server Action update trường `status` trong Supabase.

---

## EPIC 4: The Intel (Trinh sát AI - Job Analysis)

_Mục tiêu: Dùng AI chấm điểm và phân tích lỗ hổng CV._

### Story 4.1: API Phân tích JD bằng OpenAI

- **Mô tả:** Là một Hệ thống, tôi cần một endpoint `/api/ai/analyze-jd` nhận vào `job_id`, dùng AI để chấm điểm độ khớp so với `master_profiles` của user đó.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Lấy `raw_jd_text` từ bảng `jobs`.
  - [ ] Lấy `content` từ bảng `master_profiles`.
  - [ ] Gọi OpenAI API (System Prompt: So sánh JD và Profile, trả về JSON chứa `keywords`, `match_score`, `gap_analysis`).
  - [ ] Lưu kết quả trả về vào bảng `job_analyses`.

### Story 4.2: Giao diện Job Detail & Gap Analysis

- **Mô tả:** Là Người dùng, khi tôi click vào 1 thẻ Job trên Kanban, tôi được chuyển đến trang `/dashboard/jobs/[id]`. Tại đây tôi có nút "Analyze Job" và xem được kết quả phân tích.
- **Tiêu chí hoàn thành (AC):**
  - [ ] UI trang chi tiết Job.
  - [ ] Nút "Analyze with AI" (gọi API ở Story 4.1, có loading state).
  - [ ] Hiển thị biểu đồ tròn/thanh ngang cho `match_score` và danh sách text `gap_analysis`, `keywords`.

---

## EPIC 5: The Tailor (May đo CV tự động)

_Mục tiêu: "Phép màu" của FastRezu - đẻ ra CV khớp 90% JD trong 1 click._

### Story 5.1: API AI Tailoring (Contextual Rewrite)

- **Mô tả:** Là một Hệ thống, tôi cần endpoint `/api/ai/tailor-resume` để AI viết lại Master Profile sao cho chứa nhiều từ khóa của JD nhất một cách tự nhiên.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Kéo dữ liệu từ `master_profiles` và `job_analyses` (hoặc `raw_jd_text`).
  - [ ] Gọi OpenAI API (Model lớn: GPT-4o). System Prompt: Bắt buộc giữ sự thật, nhưng viết lại bullet points dùng từ khóa JD. Giới hạn độ dài để vừa 1 trang A4.
  - [ ] Trả về cấu trúc JSON CV và lưu vào bảng `resumes` cột `content_snapshot`.

### Story 5.2: Giao diện Tailor & Preview PDF

- **Mô tả:** Là Người dùng, ở trang chi tiết Job, tôi bấm nút "Tailor Resume for this Job". Sau đó tôi thấy bản Preview CV của mình.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Nút bấm gọi API Story 5.1 (Có hiệu ứng loading báo hiệu AI đang nghĩ).
  - [ ] Fetch dữ liệu từ bảng `resumes` render lên giao diện HTML/CSS mô phỏng tờ giấy A4.
  - [ ] (Tận dụng code V1): Cung cấp 1-2 UI template cơ bản (Minimalist).

### Story 5.3: Xuất file PDF (Export)

- **Mô tả:** Là Người dùng, tôi muốn bấm nút "Download PDF" bản CV đã được Tailor để đi nộp.
- **Tiêu chí hoàn thành (AC):**
  - [ ] Tái sử dụng logic `html2canvas` + `jsPDF` từ codebase cũ.
  - [ ] File xuất ra rõ nét, text có thể bôi đen/copy được (nếu cấu hình jsPDF hỗ trợ, hoặc render text over canvas).

---

## EPIC 6: Dọn dẹp & Tối ưu (Cleanup)

### Story 6.1: Gỡ bỏ mã nguồn V1 không cần thiết

- **Mô tả:** Là một Developer, tôi muốn xóa bỏ các luồng Wizard cũ, các API route AI cũ không còn hợp với luồng Career OS để giảm nợ kỹ thuật (Technical Debt).
- **Tiêu chí hoàn thành (AC):**
  - [ ] Codebase sạch sẽ, không còn cảnh báo lỗi (linting/type errors).
  - [ ] Xóa các bảng `cvs`, `cv_sections` (nếu có) trên Supabase.
