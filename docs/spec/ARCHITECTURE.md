# System Architecture Document (ARCHITECTURE)

**Project Name:** FastRezu 2.0 - The Career OS
**Document Status:** Approved / V1.1 (Updated: 2026-02)

## 1. Tổng quan Kiến trúc Hệ thống (High-Level Architecture)

Hệ thống FastRezu 2.0 sử dụng kiến trúc **Serverless** và **Edge Computing** để đảm bảo tốc độ phản hồi nhanh, dễ dàng mở rộng và tối ưu chi phí.

- **Frontend/Client:** Next.js 15 (App Router), React 19, Tailwind CSS 4, TypeScript 5. Xử lý UI/UX, State Management và render PDF tại client-side.
- **Backend as a Service (BaaS):** Supabase. Quản lý Authentication, Database (PostgreSQL + RLS), và Storage (File buckets).
- **AI Orchestration & API Layer:** Next.js Route Handlers (`/api/*`). Xử lý logic kết nối với LLM Providers (OpenAI với Gemini fallback qua OpenAI-compatible endpoint).
- **Export Engine:** `@react-pdf/renderer` (Client-side) — render React components trực tiếp ra PDF. Text trong PDF có thể bôi đen/copy được. Hỗ trợ đa template và ảnh đại diện qua `<Image src={url}>`.
- **Rich Text Editor:** BlockNote (outputs Markdown) — dùng trong V1 CV editor, vẫn được giữ lại.

---

## 2. Thiết kế Cơ sở Dữ liệu (Database Schema - Supabase/PostgreSQL)

Lõi của hệ thống dựa trên mô hình dữ liệu lấy **Job (Cơ hội việc làm)** làm trung tâm.

### 2.1. Sơ đồ Quan hệ (ERD)

```
profiles (1) ──────── (1) master_profiles    [The Vault]
profiles (1) ──────── (N) jobs               [The War Room]
jobs     (1) ──────── (1) job_analyses       [The Intel]
jobs     (1) ──────── (1) resumes            [The Tailor — Tailored Snapshot]
profiles (1) ──────── (N) cv_scan_history    [The Scanner]
```

### 2.2. Chi tiết các Bảng cốt lõi

**Bảng `profiles` (Người dùng & Phân quyền)**

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | references auth.users |
| `email` | text | |
| `full_name` | text | |
| `subscription_tier` | enum | 'free', 'sprint_pass' |
| `credits` | int | Cho tác vụ AI nặng |

---

**Bảng `master_profiles` (The Vault — Dữ liệu gốc)**

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `section_type` | text | 'personal', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'volunteering', 'hobbies', 'references', 'publications' |
| `content` | jsonb | Dữ liệu linh hoạt. Với `section_type = 'personal'`, bao gồm trường `photo_url?: string` (URL công khai trong bucket `profile-photos`). |

Constraint: `UNIQUE(user_id, section_type)`

---

**Bảng `jobs` (The War Room — Kanban Tracker)**

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `title`, `company_name`, `job_url` | text | |
| `raw_jd_text` | text | Toàn bộ JD để AI đọc |
| `status` | enum | 'saved' → 'optimized' → 'applied' → 'interviewing' → 'offer' / 'rejected' |
| `created_at` | timestamptz | |

---

**Bảng `job_analyses` (The Intel — Kết quả phân tích)**

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `job_id` | uuid FK | |
| `keywords_required` | text[] | VD: ['React', 'TypeScript', 'Agile'] |
| `match_score` | int | Thang 0–100 |
| `gap_analysis` | text | Lời khuyên AI |

---

**Bảng `resumes` (The Tailor — Bản CV đã được may đo)**

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `job_id` | uuid FK UNIQUE | Mỗi Job có tối đa 1 bản CV may đo (upsert target) |
| `user_id` | uuid FK | |
| `content_snapshot` | jsonb | **Snapshot bất biến.** Lưu toàn bộ CV JSON tại thời điểm AI tạo, kể cả `personal.photo_url`. Thay đổi Vault sau này không ảnh hưởng. |
| `ats_score_final` | int | |
| `template_id` | text DEFAULT 'classic' | Một trong: 'classic', 'modern', 'executive', 'creative', 'minimal' |
| `color_theme` | text DEFAULT 'blue' | Một trong: 'blue', 'slate', 'emerald', 'rose' |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated via trigger |

---

**Bảng `cv_scan_history` (The Scanner — Lịch sử quét CV)**

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `file_name` | text | Tên file gốc người dùng upload |
| `file_storage_path` | text nullable | Path trong bucket `cv-scan-files`. NULL nếu upload trước khi tính năng này được bật. |
| `overall_score`, `ats_score`, `design_score` | int nullable | |
| `evaluation` | jsonb | JSON chứa strengths, improvements, section scores, ats_tips |
| `extracted_profile` | jsonb | Dữ liệu thô bóc tách được (khớp schema master_profiles) |
| `scanned_at` | timestamptz | |

---

## 3. Cấu trúc Thư mục Code (Directory Structure)

```
src/
├── app/
│   ├── (authenticated)/
│   │   ├── dashboard/
│   │   │   ├── vault/                 # The Vault (nhập liệu gốc, upload ảnh)
│   │   │   ├── jobs/                  # The War Room (Kanban Board)
│   │   │   │   └── [id]/              # Chi tiết Job (The Intel + The Tailor)
│   │   │   └── scanner/               # The Scanner
│   │   │       └── history/[id]/      # Chi tiết lần scan
│   │   └── editor/[cvId]/             # V1 CV editor (giữ lại)
│   └── api/
│       ├── ai/
│       │   ├── analyze-jd/            # Phân tích JD vs Master Profile
│       │   ├── evaluate-cv/           # Đánh giá chất lượng CV (Scanner)
│       │   ├── extract-profile-from-cv/
│       │   └── tailor-resume/         # May đo CV theo JD
│       ├── cv/
│       │   ├── scan-history/          # GET list / POST save scan
│       │   └── photo-upload/          # POST upload ảnh đại diện → profile-photos bucket
│       ├── jobs/
│       │   └── crawl-jd/              # Crawl JD từ URL qua Jina.ai
│       └── vault/
│           └── generate-summary/
├── components/
│   ├── cv/
│   │   ├── templates/                 # Template Engine (xem Section 5)
│   │   │   ├── shared/
│   │   │   │   ├── types.ts           # TemplateId, ColorTheme, TemplateProps
│   │   │   │   └── utils.ts           # dateRange, parseBullets, SECTION_LABELS
│   │   │   ├── classic/
│   │   │   │   ├── ClassicPreview.tsx
│   │   │   │   └── ClassicPDF.tsx
│   │   │   ├── modern/
│   │   │   │   ├── ModernPreview.tsx
│   │   │   │   └── ModernPDF.tsx
│   │   │   ├── executive/
│   │   │   │   ├── ExecutivePreview.tsx
│   │   │   │   └── ExecutivePDF.tsx
│   │   │   ├── creative/
│   │   │   │   ├── CreativePreview.tsx
│   │   │   │   └── CreativePDF.tsx
│   │   │   ├── minimal/
│   │   │   │   ├── MinimalPreview.tsx
│   │   │   │   └── MinimalPDF.tsx
│   │   │   └── index.ts              # TEMPLATE_REGISTRY
│   │   ├── TemplateSelector.tsx       # UI chọn template + màu
│   │   ├── TailoredCVPreview.tsx      # Routes → template Preview
│   │   └── TailoredCVTemplatePDF.tsx  # Routes → template PDF
│   ├── vault/
│   │   ├── VaultContent.tsx
│   │   ├── PhotoUpload.tsx            # Upload ảnh đại diện trong Personal tab
│   │   └── ...
│   ├── jobs/
│   │   ├── KanbanBoard.tsx
│   │   ├── TailorResumeButton.tsx     # Preview modal + template selector
│   │   └── ...
│   └── scanner/
│       ├── ScannerContent.tsx
│       ├── ScanHistoryPanel.tsx
│       ├── ScanFileViewer.tsx         # Xem file CV gốc (signed URL)
│       └── ...
├── lib/
│   ├── supabase.ts                    # Browser client
│   ├── supabase-server.ts             # Server client
│   ├── openai.ts                      # AI wrapper (heavy/light tier)
│   ├── prompts.ts                     # All AI prompts (VI + EN)
│   └── validation-schemas.ts          # Zod schemas
├── contexts/
│   ├── CVEditorContext.tsx
│   └── LanguageContext.tsx
├── hooks/
│   ├── useTranslation.ts
│   ├── useMediaQuery.ts
│   └── useTypingEffect.ts
├── dictionaries/
│   ├── vi.json
│   └── en.json
└── types/
    └── database.types.ts
```

---

## 4. Thiết kế Luồng AI Cốt lõi (AI Workflows)

### 4.0. Luồng "The Scout" (Thu thập JD từ URL)

- **Trigger:** User bấm "Lấy JD từ URL" trong AddJobModal hoặc trang chi tiết Job.
- **Action:** Client → `POST /api/jobs/crawl-jd` với `{ jobId }`.
- **Luồng xử lý (server):**
  1. **SSRF Guard:** Validate `job_url` — chỉ chấp nhận `http://`/`https://`, chặn private IPs.
  2. **Crawl via Jina.ai Reader:** `GET https://r.jina.ai/{encoded_url}` — trả Markdown sạch.
  3. **AI Extract (Light Tier):** Trích xuất chỉ phần JD, bỏ nav/footer/quảng cáo.
  4. **Save:** `UPDATE jobs SET raw_jd_text = ?`.
- **Response:** `{ raw_jd_text: string }`.

**Env vars (tùy chọn):** `JINA_API_KEY` để tăng rate limit.

---

### 4.1. Luồng "The Intel" (Phân tích JD)

- **Trigger:** User bấm "Analyze with AI" trên trang chi tiết Job.
- **Action:** Client → `POST /api/ai/analyze-jd` với `{ jobId }`.
- **AI Task (Light Tier — GPT-4o-mini):**
  1. Đọc `raw_jd_text` + `master_profiles` của user.
  2. Trả về JSON: `{ keywords_required, match_score, gap_analysis }`.
- **Save:** Upsert vào `job_analyses`.

---

### 4.2. Luồng "The Scanner" (Upload CV & AI Evaluation)

- **Trigger:** User truy cập `/dashboard/scanner` hoặc bấm "Import từ CV" trong Vault.
- **Bước 1 — Client-side processing:**
  - **PDF:** `pdfjs-dist` render trang → Base64 JPEG images + `unpdf` extract text.
  - **DOCX:** `mammoth` extract raw text (không có image rendering).
- **Bước 2 — AI Processing (song song):**
  - `POST /api/ai/evaluate-cv` → Heavy tier (GPT-4o Vision). Input: images + text. Output: `overall_score`, `ats_score`, `design_score`, section scores, strengths, improvements, ats_tips.
  - `POST /api/ai/extract-profile-from-cv` → Heavy tier. Output JSON khớp schema `master_profiles`.
- **Bước 3 — Save (non-blocking):** `POST /api/cv/scan-history` với `multipart/form-data` (file + evaluation JSON + extracted_profile JSON). Server upload file → bucket `cv-scan-files`, lưu kết quả vào `cv_scan_history`.
- **Bước 4 — Import Vault:** User xác nhận → `importSectionsFromCV()` Server Action batch upsert.

---

### 4.3. Luồng "The Tailor" (May đo CV)

- **Trigger:** User bấm "Tailor Resume for this Job" trong trang chi tiết Job.
- **Action:** Client → `POST /api/ai/tailor-resume` với `{ jobId, language }`.
- **AI Task (Heavy Tier — GPT-4o):**
  1. Đọc `master_profiles` (bao gồm `personal.photo_url` nếu có).
  2. Đọc `job_analyses` (keywords, gap).
  3. Viết lại CV tích hợp từ khóa JD. **KHÔNG bịa đặt** thông tin.
  4. Trả về JSON hoàn chỉnh theo `TailoredResumeData` schema (bao gồm `personal.photo_url`).
- **Save:** Upsert vào `resumes` (`onConflict: 'job_id'`). Lưu `template_id` và `color_theme` từ lựa chọn user.
- **Template Selection:** User chọn template và màu trong PreviewModal → lưu vào `resumes.template_id` + `resumes.color_theme` sau khi download.

---

## 5. Template Engine (CV Templates)

### 5.1. Kiến trúc tổng thể

Mỗi template có **hai** implementations song song:
- **Preview (HTML/CSS):** React component render trực tiếp trong trình duyệt (trong modal preview).
- **PDF:** `@react-pdf/renderer` Document component export ra file PDF.

Cả hai cùng nhận chung `TemplateProps`:
```typescript
interface TemplateProps {
  data: TailoredResumeData;  // CV data (bao gồm personal.photo_url)
  theme: ColorTheme;          // 'blue' | 'slate' | 'emerald' | 'rose'
  language: 'vi' | 'en';
}
```

### 5.2. Template Registry

File `src/components/cv/templates/index.ts` export một registry:
```typescript
const TEMPLATE_REGISTRY: Record<TemplateId, {
  label: { vi: string; en: string };
  supportsPhoto: boolean;
  layout: 'single-column' | 'two-column';
  atsLevel: 1 | 2 | 3 | 4 | 5;  // 5 = ATS-safe nhất
  Preview: ComponentType<TemplateProps>;
  PDF: ComponentType<TemplateProps>;
}>
```

### 5.3. Danh sách 5 Templates

| ID | Tên | Layout | Ảnh | ATS | Phù hợp |
|----|-----|--------|-----|-----|---------|
| `classic` | Classic | 1 cột, header căn giữa | Không | ★★★★★ | Ngân hàng, Hành chính, Tập đoàn |
| `modern` | Modern | 2 cột (sidebar 30% + main 70%) | Có (sidebar) | ★★★☆☆ | IT, Startup, Product |
| `executive` | Executive | 1 cột, header band màu đầy | Tùy chọn | ★★★★☆ | Senior, Quản lý, Giám đốc |
| `creative` | Creative | 1 cột, hero gradient + icon contact | Có (tròn, hero) | ★★☆☆☆ | Design, Marketing, UX |
| `minimal` | Minimal | 1 cột, ultra-clean, thin dividers | Không | ★★★★★ | Tư vấn, Tài chính, Nghiên cứu |

> ⚠️ **ATS Warning:** Templates `creative` và `modern` có thể bị ATS parse không chính xác. Hiển thị cảnh báo trong `TemplateSelector` để người dùng chọn có thông tin.

### 5.4. Color Themes

```typescript
const COLOR_THEMES = {
  blue:    { primary: '#2563eb', dark: '#1d4ed8', light: '#dbeafe' },
  slate:   { primary: '#475569', dark: '#334155', light: '#f1f5f9' },
  emerald: { primary: '#059669', dark: '#047857', light: '#d1fae5' },
  rose:    { primary: '#e11d48', dark: '#be123c', light: '#ffe4e6' },
};
```

### 5.5. Font Registration (`@react-pdf/renderer`)

```typescript
// Roboto (hiện tại) — dùng cho tất cả templates
Font.register({ family: 'Roboto', fonts: [...] })

// Inter (thêm mới) — dùng cho Modern, Minimal
Font.register({ family: 'Inter', fonts: [...] })

// Montserrat (thêm mới) — dùng cho Executive, Creative
Font.register({ family: 'Montserrat', fonts: [...] })
```

### 5.6. Profile Photo trong PDF

- Template `modern`, `executive`, `creative`: Render `<Image src={data.personal.photo_url} />` từ `@react-pdf/renderer`.
- Sử dụng **HTTPS URL công khai** (từ Supabase Storage bucket `profile-photos`) — **không dùng base64** để tránh lỗi biết của react-pdf.
- Template `classic`, `minimal`: Không render ảnh (ưu tiên ATS).

---

## 6. Supabase Storage Buckets

| Bucket | Quyền | Max Size | Mục đích |
|--------|-------|----------|---------|
| `cv-uploads` | Private | 10MB | File CV upload qua `/api/cv/upload-check` (V1 flow) |
| `cv-scan-files` | Private | 10MB | File CV gốc từ Scanner (signed URL 1h để xem lại) |
| `profile-photos` | **Public** | 5MB | Ảnh đại diện trong Vault → xuất hiện trong CV templates |

### RLS Storage Policies (chuẩn cho cả 3 buckets)

```sql
-- INSERT: user chỉ upload vào folder có tên là uid của họ
CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = '<bucket>' AND (storage.foldername(name))[1] = auth.uid()::text);

-- SELECT: user chỉ đọc được file của mình
CREATE POLICY "Users read own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = '<bucket>' AND (storage.foldername(name))[1] = auth.uid()::text);
```

> `profile-photos` là bucket **public** — images được truy cập qua URL công khai không cần auth (cần thiết để `@react-pdf/renderer` load ảnh khi generate PDF phía client).

---

## 7. Quản lý State (State Management)

- **Tránh Over-engineering:** Không dùng Redux.
- **Server State:** React Server Components fetch data ban đầu. Client mutation dùng Server Actions + `revalidatePath()`.
- **Client State:** `useState` / `useReducer` cho form phức tạp, template selection, color picker.
- **Language:** `LanguageContext` (React Context) + `useTranslation` hook → đọc từ `vi.json` / `en.json`.

---

## 8. Bảo mật (Security & Privacy)

- **Supabase RLS:** Bật Row Level Security cho **tất cả** bảng và storage buckets.
- **Policy chuẩn:** `(auth.uid() = user_id)`. User A không thể truy cập dữ liệu User B.
- **API Protection:** Các route `/api/ai/*` và `/api/cv/*` bắt buộc check `auth.getUser()` trước khi thực thi.
- **SSRF Protection:** Route crawl-jd chặn private IPs và non-HTTP schemes.
- **File Validation:** Kiểm tra MIME type và file size phía server trước khi upload Storage.
