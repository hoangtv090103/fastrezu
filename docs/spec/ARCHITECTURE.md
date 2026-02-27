# System Architecture Document (ARCHITECTURE)

**Project Name:** FastRezu 2.0 - The Career OS
**Document Status:** Approved / V1.0

## 1. Tổng quan Kiến trúc Hệ thống (High-Level Architecture)

Hệ thống FastRezu 2.0 sử dụng kiến trúc **Serverless** và **Edge Computing** để đảm bảo tốc độ phản hồi nhanh, dễ dàng mở rộng và tối ưu chi phí.

- **Frontend/Client:** Next.js 14+ (App Router), React, Tailwind CSS, Shadcn UI. Xử lý UI/UX, State Management và render PDF tại client-side.
- **Backend as a Service (BaaS):** Supabase. Quản lý Authentication (Magic Link), Database (PostgreSQL), và Row Level Security (RLS).
- **AI Orchestration & API Layer:** Next.js Route Handlers (`/api/*`). Xử lý logic kết nối với LLM Providers (OpenAI/Gemini) và thực thi các luồng (workflows) phức tạp.
- **Export Engine:** `html2canvas` + `jsPDF` (Client-side) để giảm tải cho server, hoặc Puppeteer (Server-side) nếu yêu cầu PDF độ phân giải cực cao (MVP ưu tiên Client-side).

---

## 2. Thiết kế Cơ sở Dữ liệu (Database Schema - Supabase/PostgreSQL)

Lõi của hệ thống dựa trên mô hình dữ liệu lấy **Job (Cơ hội việc làm)** làm trung tâm.

### 2.1. Sơ đồ Quan hệ (ERD)

- `profiles` (1) --- (1) `master_profiles` (The Vault)
- `profiles` (1) --- (N) `jobs` (The War Room)
- `jobs` (1) --- (1) `job_analyses` (The Intel)
- `jobs` (1) --- (1) `resumes` (The Tailored Snapshot)

### 2.2. Chi tiết các Bảng cốt lõi

**Bảng `profiles` (Người dùng & Phân quyền)**

- `id` (uuid, PK, references auth.users)
- `email` (text)
- `full_name` (text)
- `subscription_tier` (enum: 'free', 'sprint_pass')
- `credits` (int) - Dành cho các tác vụ AI nặng.

**Bảng `master_profiles` (The Vault - Dữ liệu gốc)**

- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `section_type` (text) - Ví dụ: 'personal', 'experience', 'education', 'skills'.
- `content` (jsonb) - Lưu dữ liệu dạng mảng object linh hoạt (tránh cứng nhắc số lượng cột).

**Bảng `jobs` (The War Room - Kanban Tracker)**

- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `title`, `company_name`, `job_url` (text)
- `raw_jd_text` (text) - Lưu toàn bộ text JD để AI đọc.
- `status` (enum: 'saved', 'analyzing', 'optimized', 'applied', 'interviewing', 'rejected', 'offer')
- `created_at` (timestamp)

**Bảng `job_analyses` (The Intel - Kết quả phân tích)**

- `id` (uuid, PK)
- `job_id` (uuid, FK)
- `keywords_required` (text[]) - VD: ['React', 'TypeScript', 'Agile']
- `match_score` (int) - Thang 0-100.
- `gap_analysis` (text) - Lời khuyên của AI về những điểm thiếu hụt.

**Bảng `resumes` (The Tailor - Bản CV đã được may đo)**

- `id` (uuid, PK)
- `job_id` (uuid, FK) - Link với Job để biết CV này nộp cho ai.
- `content_snapshot` (jsonb) - **ĐIỂM CHỐT:** Lưu cứng nội dung CV ngay tại thời điểm AI tạo ra. Nếu The Vault thay đổi sau này, CV này KHÔNG bị đổi theo (để lưu lịch sử).
- `ats_score_final` (int)

**Bảng `cv_scan_history` (The Scanner - Lịch sử quét CV)**

- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `file_name` (text)
- `overall_score`, `ats_score`, `design_score` (int)
- `evaluation_result` (jsonb) - JSON chứa toàn bộ strengths, improvements, section scores.
- `extracted_profile` (jsonb) - Dữ liệu thô bóc tách được.
- `created_at` (timestamp, default now())

---

## 3. Cấu trúc Thư mục Code (Directory Structure)

Áp dụng Domain-Driven Design (DDD) trong thư mục `src` của Next.js:

```text
src/
├── app/
│   ├── (auth)/login/             # Luồng Magic Link
│   ├── (dashboard)/
│   │   ├── vault/                # Giao diện The Vault (nhập liệu gốc)
│   │   ├── jobs/                 # The War Room (Kanban Board)
│   │   │   └── [id]/             # Chi tiết 1 Job (The Intel + The Tailor)
│   │   ├── scanner/              # The Scanner (Upload CV & AI Evaluation)
│   │   └── settings/
│   └── api/
│       ├── ai/
│       │   ├── analyze-job/           # So khớp JD vs Master Profile (The Intel) ✅
│       │   ├── evaluate-cv/           # Đánh giá chất lượng CV (The Scanner)
│       │   ├── extract-profile-from-cv/ # Trích xuất profile có cấu trúc từ CV
│       │   └── tailor-resume/         # Viết lại CV theo JD (The Tailor)
│       └── jobs/
│           └── crawl-jd/              # Crawl JD từ URL qua Jina.ai (The Scout) ✅
├── components/
│   ├── vault/                    # Form nhập liệu, list kinh nghiệm
│   ├── jobs/                     # Kanban board, Job cards
│   ├── scanner/                  # ScannerClient — upload, evaluate, vault import
│   ├── tailor/                   # Nút bấm AI, Preview PDF, Gap Analysis
│   └── ui/                       # Shadcn UI (Button, Input, Card...)
├── lib/
│   ├── supabase/                 # Client & Server clients
│   ├── ai/                       # Prompts (.ts), cấu hình OpenAI
│   └── utils.ts
└── types/
    └── database.types.ts         # Sinh tự động từ Supabase CLI
```

## 4. Thiết kế Luồng AI Cốt lõi (AI Workflows)

### 4.0. Luồng "The Scout" (Thu thập JD từ URL)

Người dùng chỉ cần dán `job_url` — hệ thống tự động crawl và điền `raw_jd_text` mà không cần copy-paste thủ công.

- **Trigger:** User bấm nút "Lấy JD từ URL" (trong AddJobModal hoặc trang chi tiết Job).
- **Action:** Client gọi `POST /api/jobs/crawl-jd` với `{ jobId }`.
- **Luồng xử lý (server):**
  1. **SSRF Guard:** Validate `job_url` — chỉ chấp nhận `http://`/`https://`, chặn private IPs (`localhost`, `127.x`, `10.x`, `192.168.x`).
  2. **Crawl via Jina.ai Reader:** `GET https://r.jina.ai/{encoded_url}`
     - Jina.ai xử lý JS-rendered pages, trả về Markdown sạch của toàn trang.
     - Free tier: không cần API key. Paid tier: thêm `Authorization: Bearer {JINA_API_KEY}`.
     - Timeout: 30 giây.
  3. **AI Extract (Light Tier):** Gửi Markdown thô qua model nhẹ để trích xuất chỉ phần JD, loại bỏ nav/footer/quảng cáo. Prompt: _"Trích xuất CHỈ phần Mô tả Công việc từ nội dung này. Loại bỏ header, footer, navigation. Trả về text thuần."_
  4. **Save:** `UPDATE jobs SET raw_jd_text = ? WHERE id = ?`.
- **Response:** `{ raw_jd_text: string }` — client cập nhật state ngay.
- **Error cases:** Job board chặn crawl (403) → trả về lỗi rõ ràng; timeout → báo retry; nội dung không hợp lệ → trả về raw text để user tự xem.

**Env vars (tùy chọn):**

```bash
JINA_API_KEY=<optional>  # Tăng rate limit Jina.ai (free tier: ~10 req/min)
```

**Tech note:** Jina.ai Reader là zero-dependency — chỉ là HTTP GET. Nếu cần swap sang Firecrawl (paid, chất lượng cao hơn) thì chỉ cần đổi URL gọi, không ảnh hưởng interface.

---

### 4.1. Luồng "The Intel" (Phân tích JD)

- **Trigger:** User tạo Job mới và dán link/text JD.
- **Action:** Client gọi POST `/api/ai/analyze-jd`.
- **Payload:** `{ jobId, jdText }`
- **AI Task (GPT-4o-mini / Gemini Flash):**
  1. Trích xuất danh sách Hard Skills, Soft Skills.
  2. Query `master_profiles` của User hiện tại.
  3. So khớp: `match_score = (Số skill User có / Số skill JD yêu cầu) * 100`.
  4. Trả về JSON chứa `keywords`, `match_score`, `gap_analysis`.
- **Save:** Lưu vào bảng `job_analyses`.

### 4.2. Luồng "The Scanner" (Upload CV & AI Evaluation)

Người dùng upload CV sẵn có → AI đánh giá chất lượng + trích xuất profile → (tùy chọn) điền vào The Vault.

- **Trigger:** User truy cập `/dashboard/scanner` (nav header hoặc nút "Import từ CV" trong Vault).
- **Bước 1 — Upload & Extract:** Client upload file → `POST /api/cv/upload-check` (tái dùng, đã có) → trả về `raw_text`.
- **Bước 2 — AI Processing (chạy song song):**
  - `POST /api/ai/evaluate-cv` — Heavy tier. Input: raw text (cắt 15.000 ký tự). Output:
    ```json
    {
      "overall_score": 72, "ats_score": 68,
      "sections": { "contact": { "score": 90, "feedback": "..." }, ... },
      "strengths": [...], "improvements": [...], "ats_tips": [...]
    }
    ```
  - `POST /api/ai/extract-profile-from-cv` — Heavy tier. Output JSON khớp schema `master_profiles`:
    ```json
    { "personal": {...}, "summary": {...}, "experience": {"items":[...]}, "education": {"items":[...]}, "skills": {...}, "certifications": {"items":[...]} }
    ```
    Trả `null` cho section không tìm thấy trong CV.
- **Bước 3 — Hiển thị & Import:**
  - Panel trái: evaluation results (SVG gauge, section scores, strengths/improvements/ATS tips).
  - Panel phải: VaultImportPanel — checkbox per section (empty vault sections + có data → checked; sections đã có data → disabled). Confirm → gọi Server Action `importSectionsFromCV()` batch upsert.
- **Save (History):** Hệ thống gom `evaluation_result` và `extracted_profile` để insert vào bảng `cv_scan_history`. Result UI được load từ DB để tiện xem lại sau này.

**Reuse:**

- `FileUploadZone` component + `unpdf`/`mammoth` libs (đã có).
- `upsertVaultSection` → wrap thành `importSectionsFromCV(sections)` batch action.

---

### 4.3. Luồng "The Tailor" (May đo CV - Kỹ thuật Contextual Rewrite)

- **Trigger:** User bấm nút "Tối ưu CV cho Job này".
- **Action:** Client gọi POST `/api/ai/tailor-resume`.
- **Payload:** `{ jobId, userId }`
- **AI Task (GPT-4o - Model cao cấp):**
  - Kéo dữ liệu `job_analyses` (để lấy Keywords).
  - Kéo dữ liệu `master_profiles` (Lấy toàn bộ kinh nghiệm thô).
  - **Prompt Kỹ thuật (System):** "Bạn là một AI Headhunter. Dựa trên JD này (A) và Kinh nghiệm gốc này (B), hãy chọn lọc tối đa 4 bullet points cho mỗi kinh nghiệm. Viết lại các bullet points đó sao cho tự nhiên chứa các từ khóa của JD. Không bịa đặt kinh nghiệm. Giữ nguyên những kinh nghiệm không liên quan nhưng có giá trị."
  - Trả về một cấu trúc JSON CV hoàn chỉnh (`content_snapshot`).
- **Save:** Lưu JSON vào bảng `resumes`. Cập nhật trạng thái Job thành `optimized`.

## 5. Quản lý State (State Management)

- **Tránh Over-engineering:** Không dùng Redux.
- **Server State:** Dùng React Server Components (RSC) để fetch data ban đầu (như list Jobs, The Vault) nhằm tối ưu SEO và tốc độ load. Client mutation dùng Server Actions hoặc SWR/React Query để revalidate data.
- **Client State (Cục bộ):** Dùng `useState` và `useReducer` cho các form nhập liệu phức tạp trong The Vault trước khi submit lên server.

## 6. Bảo mật (Security & Privacy)

- **Supabase RLS:** Bật Row Level Security cho TẤT CẢ các bảng.
- **Policy chuẩn:** `(auth.uid() = user_id)`. Không ai được phép select/update dữ liệu của người khác.
- **API Protection:** Các route `/api/ai/*` phải check `auth.getUser()` trước khi thực thi để tránh việc user gọi API qua Postman làm cạn kiệt API Quota.

---

```

```
