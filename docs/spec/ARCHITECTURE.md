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
│   │   └── settings/
│   └── api/
│       ├── ai/
│       │   ├── parse-cv/         # Trích xuất PDF cũ -> JSON (The Vault)
│       │   ├── analyze-jd/       # Phân tích JD (The Intel)
│       │   └── tailor-resume/    # Cốt lõi: Viết lại CV (The Tailor)
│       └── jobs/                 # CRUD cho Jobs
├── components/
│   ├── vault/                    # Form nhập liệu, list kinh nghiệm
│   ├── jobs/                     # Kanban board, Job cards
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

### 4.2. Luồng "The Tailor" (May đo CV - Kỹ thuật Contextual Rewrite)

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
