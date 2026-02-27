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

_Mục tiêu: Xây dựng một cơ sở dữ liệu sự nghiệp không giới hạn — user nhập liệu một lần, AI dùng mãi mãi. Khác với tờ A4, The Vault chứa được mọi "vũ khí" của ứng viên._

### Thiết kế phân nhóm Tab (Section Architecture)

Vault được chia làm 3 nhóm theo độ ưu tiên và tần suất sử dụng:

| Nhóm       | Tên                    | Tabs                                                    | Hiển thị                          |
| ---------- | ---------------------- | ------------------------------------------------------- | --------------------------------- |
| **Nhóm 1** | The Big 4 ⭐           | Personal Info, Summary, Experience, Education           | **Mặc định**                      |
| **Nhóm 2** | The Deal-Breakers 🔑   | Skills, Projects, Certifications                        | Mặc định                          |
| **Nhóm 3** | Culture Fit & Niche 🎯 | Awards, Volunteering, Hobbies, References, Publications | **Ẩn** — Chỉ hiện khi user tự add |

**Chiến lược UX (Progressive Disclosure):**

- Màn hình mặc định: nhóm 1 + Skills (tổng 5 tabs), không bị "ngợp".
- Nút **`+ Thêm mục khác`** xổ Dropdown cho phép chọn thêm tab nhóm 2 (Projects, Certifications) và nhóm 3.
- Tab đã chọn sẽ lưu vào `localStorage` hoặc cột `enabled_sections` trong DB để next session nhớ trạng thái.

---

### Story 2.1: The Big 4 — Giao diện nhập liệu cốt lõi ✅

- **Mô tả:** Là một Người dùng, tôi muốn có trang `/dashboard/vault` để nhập 4 loại dữ liệu nền tảng (Personal Info, Summary, Experience, Education) theo dạng từng tab riêng biệt.
- **Tiêu chí hoàn thành (AC):**
  - [x] Tạo UI trang `/dashboard/vault` với tab navigation.
  - [x] **Personal Info:** Form 7+ trường (Họ tên, Email, SĐT, LinkedIn, GitHub, Website, Địa chỉ).
  - [x] **Experience:** Danh sách inline-edit với Add / Edit / Delete từng công ty.
  - [x] **Education:** Danh sách inline-edit với Add / Edit / Delete từng trường.
  - [x] **Skills:** Tag-input cho Hard Skills & Soft Skills, vừa nhập vừa tự lưu.
  - [x] Server Actions `upsertVaultSection` lưu dữ liệu vào `master_profiles` (bảng Supabase V2).
  - [x] Toast notification "Lưu thành công / Lỗi".
  - [x] Server Component fetch dữ liệu vào lại khi user reload trang.

### Story 2.2: Tích hợp Supabase đầy đủ & Test E2E ✅

- **Mô tả:** Là một Hệ thống, toàn bộ dữ liệu từ UI Story 2.1 phải lưu/đọc chính xác từ Supabase dưới dạng JSON.
- **Tiêu chí hoàn thành (AC):**
  - [x] `UNIQUE(user_id, section_type)` constraint đảm bảo upsert không tạo bản ghi trùng.
  - [x] Dữ liệu persist sau khi refresh trình duyệt.
  - [x] Navigation header có link "The Vault".
  - [x] RLS đảm bảo user A không đọc được dữ liệu user B.

### Story 2.3: Tab Summary (Tóm tắt sự nghiệp gốc) ✅

- **Mô tả:** Là một Người dùng, tôi muốn có tab "Summary" để ghi chú định hướng sự nghiệp gốc của mình (AI sẽ dùng đây làm điểm neo khi "thiên biến vạn hóa" cho từng JD).
- **Tiêu chí hoàn thành (AC):**
  - [x] Tab "Tóm tắt" (icon `faFileLines`) xuất hiện ở vị trí thứ 2 trong The Vault.
  - [x] Textarea với đếm ký tự real-time (target 300–600, max 800), hiển thị gợi ý trạng thái màu.
  - [x] Nút "AI gợi ý" gọi `/api/vault/generate-summary`, truyền Experience & Skills đã nhập, điền kết quả vào textarea.
  - [x] Nút "Lưu tóm tắt" gọi `upsertVaultSection('summary', ...)` — Toast "Đã lưu tóm tắt sự nghiệp ✓".
  - [x] Dữ liệu persist sau reload (Server Component fetch + `sectionMap['summary']`).
  - [x] API endpoint riêng `/api/vault/generate-summary` — không phụ thuộc JD/cvId.
  - [x] TypeScript clean (`bun tsc --noEmit` pass 0 lỗi).

### Story 2.4: Tab Projects (Dự án nổi bật) ✅

- **Mô tả:** Là một Người dùng (đặc biệt dân IT/Creative), tôi muốn liệt kê từng dự án đã làm, bao gồm link demo và kết quả đạt được.
- **Tiêu chí hoàn thành (AC):**
  - [x] Tab "Dự án" (icon `faCode`) xuất hiện ở cuối danh sách tab (sau Skills).
  - [x] Mỗi project có 6 trường: Tên dự án, Vai trò, Thời gian (MonthYearPicker), Công nghệ (tag input), Link demo (URL), Mô tả kết quả.
  - [x] Tag input: gõ + Enter/dấu phẩy để thêm tech stack; bấm × để xóa từng tag.
  - [x] Inline-edit + Add / Delete theo đúng pattern của ExperienceSection.
  - [x] Lưu vào `master_profiles` với `section_type = 'projects'`.
  - [x] Dữ liệu persist sau reload (Server Component fetch).
  - [x] TypeScript clean (`bun tsc --noEmit` pass 0 lỗi).
  - [x] SQL migration: `20260227_vault_settings.sql` (bảng `vault_settings` với `enabled_sections` JSON — dùng cho Story 2.6).

### Story 2.5: Tab Certifications (Chứng chỉ & Giấy phép) ✅

- **Mô tả:** Là một Người dùng, tôi muốn nhập danh sách chứng chỉ (IELTS, AWS, ACCA, TOEIC...) để AI có thể tự động đưa vào CV nếu phù hợp JD.
- **Tiêu chí hoàn thành (AC):**
  - [x] Tab "Chứng chỉ" (icon `faCertificate`) xuất hiện sau tab "Dự án".
  - [x] Mỗi cert có 6 trường: Tên chứng chỉ*, Tổ chức cấp*, Ngày cấp (MonthYearPicker), Ngày hết hạn (toggle checkbox "Có hạn sử dụng"), Mã chứng chỉ (optional), Link xác thực (optional).
  - [x] Card display hiển thị icon `faAward` màu amber + link xác thực clickable.
  - [x] Inline-edit + Add / Delete theo đúng pattern ExperienceSection.
  - [x] Lưu vào `master_profiles` với `section_type = 'certifications'`.
  - [x] Dữ liệu persist sau reload (Server Component fetch).
  - [x] TypeScript clean (`bun tsc --noEmit` pass 0 lỗi).

### Story 2.6: Progressive Disclosure — Nút "Add Section" ✅

- **Mô tả:** Là một Người dùng, tôi muốn một điểm duy nhất để khám phá và bật các tab mở rộng (Projects, Certifications) mà không bị "ngợp" từ lúc mới vào.
- **Tiêu chí hoàn thành (AC):**
  - [x] Nút `+ Thêm mục` xuất hiện cuối danh sách tab (chỉ hiện khi còn section chưa bật).
  - [x] Bấm vào mở Dropdown liệt kê tất cả sections chưa kích hoạt, kèm icon và mô tả ngắn.
  - [x] Dropdown đóng khi click ngoài (event listener cleanup).
  - [x] Bấm chọn section → tab xuất hiện ngay lập tức (optimistic) + nhảy đến tab mới.
  - [x] Trạng thái đã bật lưu vào `vault_settings.enabled_sections` (jsonb) qua server action `upsertVaultSettings`.
  - [x] Sau reload, các tab đã bật được khôi phục (page.tsx fetch vault_settings + truyền `initialEnabledSections`).
  - [x] Big 4 tabs (Personal, Summary, Experience, Education, Skills) luôn hiển thị, không bị ẩn.
  - [x] TypeScript clean (`bun tsc --noEmit` pass 0 lỗi).
  - [x] `database.types.ts` đã thêm `vault_settings` table type.

### Story 2.7: Nhóm 3 — Culture Fit Sections (Awards, Volunteering, Hobbies, References, Publications)

- **Mô tả:** Là một Người dùng (đặc biệt Fresher hoặc ứng viên khối học thuật), tôi muốn có thêm chỗ để khai các thông tin "làm dày" hồ sơ.
- **Tiêu chí hoàn thành (AC):**
  - [x] **Awards:** Tên giải thưởng, Tổ chức trao, Năm nhận, Mô tả ngắn.
  - [x] **Volunteering / Extracurricular:** Tên hoạt động, Tổ chức, Vai trò, Thời gian, Mô tả.
  - [x] **Hobbies:** Tag input đơn giản (tương tự Skills).
  - [x] **References:** Họ tên, Chức vụ, Công ty, SĐT/Email, Mối quan hệ (Sếp cũ / Giảng viên).
  - [x] **Publications:** Tiêu đề, Tạp chí/Hội nghị, Năm, Link DOI.
  - [x] Tất cả đều ẩn mặc định, kích hoạt qua Story 2.6.
  - [x] Lưu vào `master_profiles` với `section_type` tương ứng.

---

## EPIC 3: The War Room (Quản lý Ứng tuyển - Kanban)

_Mục tiêu: Xây dựng trung tâm theo dõi các Job đang apply._

### Story 3.1: Giao diện Kanban Board

- **Mô tả:** Là một Người tìm việc, tôi muốn trang chủ `/dashboard/jobs` hiển thị dưới dạng bảng Kanban với các cột: Saved, Optimized, Applied, Interviewing, Offer, Rejected.
- **Tiêu chí hoàn thành (AC):**
  - [x] Dựng UI Kanban board.
  - [x] Fetch danh sách `jobs` từ Supabase và phân loại thẻ (Card) vào đúng cột dựa trên trường `status`.

### Story 3.2: Tính năng Thêm Job mới (Modal)

- **Mô tả:** Là một Người tìm việc, tôi muốn bấm nút "Add Job", dán text Mô tả công việc (JD) vào form để lưu vào hệ thống.
- **Tiêu chí hoàn thành (AC):**
  - [x] Tạo Modal "Add Job". Có các trường: Title, Company, Job URL (optional), và Textarea lớn cho Raw JD Text.
  - [x] Submit form lưu vào bảng `jobs` với trạng thái mặc định là `saved`.
  - [x] Kanban board tự động cập nhật thẻ mới.

### Story 3.3: Kéo thả cập nhật trạng thái (Drag & Drop)

- **Mô tả:** Là một Người tìm việc, tôi muốn kéo một thẻ Job từ cột "Saved" sang cột "Applied" để hệ thống tự cập nhật trạng thái.
- **Tiêu chí hoàn thành (AC):**
  - [x] Tích hợp thư viện DnD (ví dụ: `@hello-pangea/dnd` hoặc HTML5 DnD API).
  - [x] Khi thả thẻ vào cột mới, gọi API/Server Action update trường `status` trong Supabase.

### Story 3.4: Sửa, Nhân bản và Xóa Job

- **Mô tả:** Là một Người tìm việc, tôi muốn có thể sửa, nhân bản hoặc xóa job đã lưu một cách tiện lợi thông qua menu ngữ cảnh (context menu) trên thẻ Job.
- **Tiêu chí hoàn thành (AC):**
  - [x] Hover lên thẻ Job → xuất hiện nút 3-dots (⋯) ở góc phải trên của thẻ.
  - [x] Bấm nút 3-dots → dropdown menu hiển thị 3 tùy chọn, mỗi tùy chọn có icon và label:
    - **Sửa** — mở modal pre-filled cho phép cập nhật Title, Company, Job URL, Raw JD Text.
    - **Nhân bản** — tạo bản sao của job với status `saved`, thêm ngay vào board (optimistic).
    - **Xóa** — hiển thị popup xác nhận với tên job + cảnh báo "Không thể hoàn tác".
  - [x] Xác nhận xóa → thẻ biến mất ngay (optimistic update) và bị xóa khỏi Supabase.
  - [x] Dropdown tự đóng khi click ra ngoài hoặc sau khi chọn một tùy chọn.
  - [x] Drag & Drop vẫn hoạt động bình thường (không bị kích hoạt khi click vào 3-dots hoặc menu).

### Story 3.5: Auto-crawl JD từ URL (The Scout)

- **Mô tả:** Là một Người tìm việc, khi tôi dán link tuyển dụng vào trường "Job URL", tôi muốn hệ thống tự động lấy nội dung JD về thay vì phải copy-paste thủ công.
- **Kỹ thuật:** Backend gọi [Jina.ai Reader API](https://jina.ai/reader/) (`GET https://r.jina.ai/{url}`) để crawl trang, sau đó dùng AI (light tier) trích xuất chỉ phần JD, bỏ nav/footer/quảng cáo. Cập nhật `jobs.raw_jd_text`.
- **Tiêu chí hoàn thành (AC):**
  - [x] Endpoint `POST /api/jobs/crawl-jd` nhận `{ jobId }`, fetch `job_url` từ DB, crawl qua Jina.ai, AI-extract JD, lưu vào `raw_jd_text`.
  - [x] SSRF protection: chặn `localhost`, IP nội bộ (`10.x`, `192.168.x`, `127.x`), non-HTTP schemes.
  - [x] Nút "Lấy JD từ URL" hiện trong `AddJobModal` (bên cạnh textarea JD) khi đã có `job_url`.
  - [x] Nút tương tự hiện trong `JobDetailModal` / trang chi tiết khi job có URL nhưng chưa có JD text.
  - [x] Loading state khi đang crawl. Kết quả điền tự động vào textarea/field (user có thể sửa trước khi save).
  - [x] Xử lý lỗi: job board chặn (403) → thông báo rõ; timeout 30s → báo retry; URL không hợp lệ → validate ngay phía client.
  - [x] Env var `JINA_API_KEY` (optional) để tăng rate limit Jina.ai.

---

## EPIC 4: The Intel (Trinh sát AI - Job Analysis)

_Mục tiêu: Dùng AI chấm điểm và phân tích lỗ hổng CV._

### Story 4.1: API Phân tích JD bằng OpenAI

- **Mô tả:** Là một Hệ thống, tôi cần một endpoint `/api/ai/analyze-jd` nhận vào `job_id`, dùng AI để chấm điểm độ khớp so với `master_profiles` của user đó.
- **Tiêu chí hoàn thành (AC):**
  - [x] Lấy `raw_jd_text` từ bảng `jobs`.
  - [x] Lấy `content` từ bảng `master_profiles`.
  - [x] Gọi OpenAI API (System Prompt: So sánh JD và Profile, trả về JSON chứa `keywords`, `match_score`, `gap_analysis`).
  - [x] Lưu kết quả trả về vào bảng `job_analyses`.

### Story 4.2: Giao diện Job Detail & Gap Analysis

- **Mô tả:** Là Người dùng, khi tôi click vào 1 thẻ Job trên Kanban, tôi được chuyển đến trang `/dashboard/jobs/[id]`. Tại đây tôi có nút "Analyze Job" và xem được kết quả phân tích.
- **Tiêu chí hoàn thành (AC):**
  - [x] UI trang chi tiết Job (modal inline + full page `/dashboard/jobs/[id]` với nút "Mở rộng" kiểu Notion).
  - [x] Nút "Analyze with AI" (gọi API ở Story 4.1, có loading state).
  - [x] Hiển thị biểu đồ tròn/thanh ngang cho `match_score` và danh sách text `gap_analysis`, `keywords`.

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

## EPIC 6: The Scanner (Upload CV & AI Evaluation)

_Mục tiêu: Người dùng upload CV sẵn có → AI có tầm nhìn (Vision) để nhận diện cả text, hình thức, bố cục → tự động điền vào The Vault và phản hồi chất lượng thiết kế._

### Story 6.1: Upload CV & Trích xuất nội dung (Bao gồm Image Rendering)

- **Mô tả:** Là một Người tìm việc, tôi muốn upload file CV (PDF hoặc DOCX) để hệ thống đọc không chỉ nội dung mà còn chụp lại "ngoại hình" (layout) của CV để AI đánh giá.
- **Kỹ thuật:** Trang `/dashboard/scanner`. Tái dụng `FileUploadZone` component.
  - **Với PDF:** Sử dụng `pdfjs-dist` ở Client để render các trang thành mảng hình ảnh Base64 (giữ nguyên layout, format), đồng thời trích xuất text (qua `unpdf`).
  - **Với DOCX:** Trích xuất raw text thông qua `mammoth` (không hỗ trợ đánh giá layout với DOCX).
- **Tiêu chí hoàn thành (AC):**
  - [x] Trang `/dashboard/scanner` accessible từ nav header "The Scanner" và từ nút "Import từ CV" trong trang Vault.
  - [x] Hỗ trợ PDF và DOCX, tối đa 10MB. Validate file type và size phía client trước khi upload.
  - [x] Sau khi upload thành công: Render PDF ra mảng Base64 JPEGs (hiển thị loading state "Đang phân tích cấu trúc...").

### Story 6.2: AI Đánh giá chất lượng CV (Nội dung + Layout)

- **Mô tả:** Là một Người tìm việc, tôi muốn nhận phản hồi chi tiết về chất lượng CV không chỉ về mặt từ ngữ mà còn về thiết kế, spacing, màu sắc và format.
- **Kỹ thuật:** Endpoint `POST /api/ai/evaluate-cv`. OpenAI model heavy tier (Vision - `gpt-4o`). Input payload: Mảng Base64 Images kết hợp Raw Text. AI sẽ prompt để đánh giá trực quan hình ảnh được upload.
- **Tiêu chí hoàn thành (AC):**
  - [x] Endpoint phân tích cả nội dung chữ và hình dáng thiết kế của CV, trả về `overall_score`, `ats_score`, `design_score`, điểm từng section (`contact`, `summary`, `experience`, `skills`, `education`) kèm `feedback` text.
  - [x] Trả về `strengths` (mảng chuỗi), `improvements` (mảng chuỗi - bao gồm cảnh báo về font, màu, căn lề nếu có), `ats_tips` (mảng chuỗi).
  - [x] UI hiển thị: SVG circular gauge cho overall/design score, progress bars cho từng section, badges/bullets cho strengths/improvements/tips.

### Story 6.3: AI Trích xuất Profile có cấu trúc & Import vào Vault

- **Mô tả:** Là một Người tìm việc, sau khi xem kết quả đánh giá, tôi muốn import dữ liệu CV vào The Vault để không phải nhập tay lại từ đầu.
- **Kỹ thuật:** Endpoint `POST /api/ai/extract-profile-from-cv`. AI model heavy tier. Input: Mảng Base64 Images + Raw Text. Output JSON khớp với schema `master_profiles`. Chạy song song với 6.2 qua Promise.all.
- **Tiêu chí hoàn thành (AC):**
  - [x] Endpoint trích xuất đầy đủ sections của Vault: `personal`, `summary`, `experience`, `education`, `skills`, `certifications`, `projects`, `awards`, `volunteering`, `hobbies`, `references`, `publications` (trả `null` cho sections không tìm thấy trong CV).
  - [x] UI hiển thị VaultImportPanel: checkbox per section — sections trống + có data extracted → checked mặc định; sections đã có data trong Vault → disabled + label "Đã có dữ liệu".
  - [x] User xác nhận → import → toast thành công → link navigate đến `/dashboard/vault`.
  - [x] Vault page sau import hiển thị đúng data đã extract.

### Story 6.4: Lịch sử phân tích CV (Scan History)

- **Mô tả:** Là một Người tìm việc, tôi muốn xem lại danh sách các CV tôi đã từng upload và kết quả phân tích AI trước đó (để xem chi tiết hoặc import Vault lại nếu cần).
- **Kỹ thuật:** DB table `cv_scan_history`. API route `GET /api/cv/history`. Giao diện History Panel.
- **Tiêu chí hoàn thành (AC):**
  - [x] Hệ thống tự động đẩy kết quả đánh giá (sau Story 6.2 và 6.3) vào bảng `cv_scan_history`.
  - [x] UI cung cấp màn hình/dialog liệt kê các lịch sử scan trước đó: Ngày scan, Tên file CV, Điểm (Overall, ATS, Design).
  - [x] Bấm vào xem chi tiết sẽ hiển thị lại giao diện kết quả đánh giá giống hệt như lúc vừa upload xong.

---

## EPIC 7: Dọn dẹp & Tối ưu (Cleanup)

### Story 7.1: Gỡ bỏ mã nguồn V1 không cần thiết

- **Mô tả:** Là một Developer, tôi muốn xóa bỏ các luồng Wizard cũ, các API route AI cũ không còn hợp với luồng Career OS để giảm nợ kỹ thuật (Technical Debt).
- **Tiêu chí hoàn thành (AC):**
  - [ ] Codebase sạch sẽ, không còn cảnh báo lỗi (linting/type errors).
  - [ ] Xóa các bảng `cvs`, `cv_sections` (nếu có) trên Supabase.
