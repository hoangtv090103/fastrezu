# Design Document: Admin Panel & RBAC System

**Date:** 2026-03-01
**Status:** Approved
**Author:** Claude Code (brainstorming session)

---

## 1. Tổng quan

Mục tiêu: Xây dựng hệ thống phân quyền RBAC theo phong cách Odoo và trang Admin tại `/admin` để quản lý user, monitoring AI usage, cấu hình rate limits và xem dashboard metrics.

**4 nhóm tính năng Admin cần thiết:**
1. Quản lý User (list, đổi tier, gán group, suspend/restore)
2. Monitoring AI Usage (`ai_usage_logs`)
3. Cấu hình Rate Limits (`ai_rate_limit_config`)
4. Dashboard Metrics (tổng quan hệ thống)

---

## 2. RBAC Schema (Odoo-inspired)

### 2.1. Triết lý thiết kế

Học theo Odoo: dùng **Groups** thay vì Roles đơn giản.

- **User có thể thuộc nhiều Group đồng thời** (M2M)
- **Group có thể kế thừa (imply) Group khác** — Administrator kế thừa Support kế thừa Analyst
- **Permissions được định nghĩa per-Group per-Resource** (CRUD flags) — lưu trong DB, admin tự chỉnh từ UI
- **Không cần redeploy** khi thêm group mới hoặc điều chỉnh permissions

### 2.2. Database Tables

#### Bảng `groups`

```sql
CREATE TABLE IF NOT EXISTS groups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        UNIQUE NOT NULL,          -- e.g. 'system.administrator'
  display_name TEXT        NOT NULL,                 -- e.g. 'Quản trị viên hệ thống'
  description  TEXT,
  category     TEXT        NOT NULL DEFAULT 'custom', -- 'system' | 'custom'
  is_system    BOOLEAN     NOT NULL DEFAULT false,    -- system groups cannot be deleted
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Bảng `group_implied` (kế thừa quyền)

```sql
CREATE TABLE IF NOT EXISTS group_implied (
  from_group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  to_group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (from_group_id, to_group_id),
  CHECK (from_group_id != to_group_id)
);
```

#### Bảng `user_groups` (M2M membership + audit)

```sql
CREATE TABLE IF NOT EXISTS user_groups (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id   UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, group_id)
);
```

#### Bảng `group_permissions` (CRUD per resource per group)

```sql
CREATE TABLE IF NOT EXISTS group_permissions (
  group_id   UUID    NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  resource   TEXT    NOT NULL,    -- 'users' | 'ai_usage' | 'rate_limits' | 'metrics' | 'groups'
  can_read   BOOLEAN NOT NULL DEFAULT false,
  can_write  BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (group_id, resource)
);
```

### 2.3. System Groups (Seed Data)

| Group | display_name | is_system | Implied |
|-------|-------------|-----------|---------|
| `system.administrator` | Quản trị viên | true | implies `system.support` |
| `system.support` | Hỗ trợ kỹ thuật | true | implies `system.analyst` |
| `system.analyst` | Phân tích dữ liệu | true | — |

**Permissions matrix:**

| Resource | Administrator | Support | Analyst |
|----------|:---:|:---:|:---:|
| `users` | CRUD | R+W | — |
| `ai_usage` | CRUD | R | R |
| `rate_limits` | CRUD | R | — |
| `metrics` | CRUD | R | R |
| `groups` | CRUD | R | — |

> Implied groups: Administrator kế thừa tất cả permissions của Support, Support kế thừa Analyst.

### 2.4. RLS Policies

- `groups`: authenticated users read (xem group nào tồn tại), only service role write
- `user_groups`: user đọc group của mình; service role insert/delete
- `group_permissions`: authenticated users read; service role write

---

## 3. Soft Delete

### 3.1. Nguyên tắc

**Không bao giờ hard-delete dữ liệu user.** Mọi xóa đều là soft delete.

### 3.2. Columns thêm vào (6 bảng)

```sql
active      BOOLEAN      NOT NULL DEFAULT true,   -- true = active; false = soft-deleted/suspended
deleted_at  TIMESTAMPTZ,                           -- audit: thời điểm soft-delete
deleted_by  UUID REFERENCES auth.users(id)         -- audit: ai thực hiện
```

**Bảng áp dụng:** `user_profiles` · `master_profiles` · `jobs` · `job_analyses` · `resumes` · `cv_scan_history`

### 3.3. Hành vi

| Actor | Hành động | Kết quả |
|-------|-----------|---------|
| User tự xóa job | DELETE | `active=false`, `deleted_at=NOW()`, `deleted_by=NULL` |
| Admin suspend account | PATCH user | `user_profiles.active=false`, `deleted_at=NOW()`, `deleted_by=admin_id` |
| Admin restore | PATCH user | `active=true`, `deleted_at=NULL`, `deleted_by=NULL` |
| Admin purge | DELETE (chỉ administrator) | Hard delete vĩnh viễn |

### 3.4. RLS updates

```sql
-- Regular users: chỉ thấy active records
CREATE POLICY "users_see_active_only" ON jobs
  FOR SELECT USING (auth.uid() = user_id AND active = true);

-- Admin: thấy tất cả (kể cả deleted)
-- Implemented via service role trong admin API routes
```

### 3.5. Suspended Account Flow

Khi `user_profiles.active = true`: Middleware redirect user về trang `/account-suspended` thay vì dashboard.

---

## 4. Admin Panel

### 4.1. Route Structure

```
src/app/
├── (admin)/
│   ├── layout.tsx              # Admin shell: sidebar nav + permission context
│   └── admin/
│       ├── page.tsx            # /admin — Dashboard metrics
│       ├── users/
│       │   ├── page.tsx        # /admin/users — Danh sách user
│       │   └── [id]/page.tsx   # /admin/users/[id] — Chi tiết user
│       ├── groups/
│       │   └── page.tsx        # /admin/groups — CRUD groups + permissions
│       ├── ai-usage/
│       │   └── page.tsx        # /admin/ai-usage — Usage monitoring
│       └── rate-limits/
│           └── page.tsx        # /admin/rate-limits — Edit rate config
```

### 4.2. Admin Pages

#### `/admin` — Dashboard
- Số user theo từng tier (free / sprint_pass / pro_pass / beta_free)
- Tổng AI calls hôm nay, 7 ngày, 30 ngày
- Top 10 features được gọi nhiều nhất
- Số account bị suspend

#### `/admin/users` — Danh sách User
- Table: avatar, email, full_name, subscription_tier, groups, created_at, active
- Filter: tier, group, status (active / suspended)
- Search: email, full_name
- Actions inline: đổi tier, gán group, suspend/restore

#### `/admin/users/[id]` — Chi tiết User
- Full profile info
- AI usage history (chart 30 ngày)
- Lịch sử thay đổi tier + group (audit log)
- Actions: đổi tier, manage groups, suspend, purge (chỉ administrator)

#### `/admin/groups` — Quản lý Groups
- List groups + số users trong mỗi group
- Permission matrix UI (checkbox CRUD per resource)
- Tạo group mới, thêm/xóa members
- Implied groups management
- System groups: disable delete button

#### `/admin/ai-usage` — AI Usage Monitor
- Aggregated table: user, feature, calls (24h / 7d / 30d)
- Filter by feature name, tier, date range
- Highlight super-users (vượt limit nhưng vẫn được bypass do tier)
- Export CSV

#### `/admin/rate-limits` — Rate Limit Config
- Hiển thị `ai_rate_limit_config` dưới dạng inline-edit table
- Tier × Feature matrix, mỗi ô là input số (`-1` = unlimited)
- Save button gọi API PATCH
- Thay đổi có hiệu lực ngay (không cần redeploy)

### 4.3. Admin API Routes

```
/api/admin/
├── users/              GET (list, search, filter, pagination)
├── users/[id]/         GET (detail), PATCH (tier, groups, active), DELETE (hard purge)
├── groups/             GET (list), POST (create)
├── groups/[id]/        PATCH (display_name, description, implied), DELETE
├── groups/[id]/members/ GET, POST (add user), DELETE (remove user)
├── groups/[id]/permissions/ GET, PATCH (update CRUD matrix)
├── ai-usage/           GET (aggregated, filterable)
└── rate-limits/        GET, PATCH (bulk update)
```

**Permission enforcement trong API routes:**

```typescript
// src/lib/admin-auth.ts
export async function requirePermission(
  supabase: SupabaseClient,
  userId: string,
  resource: string,
  action: 'read' | 'write' | 'create' | 'delete'
): Promise<void | never>  // throws 403 if not permitted
```

---

## 5. Middleware Protection

```typescript
// src/middleware.ts — thêm vào matcher
export const config = { matcher: ['/admin/:path*', '/(authenticated)/:path*'] }

// Logic:
// 1. Check session
// 2. If /admin/*: query user_groups — nếu không có group nào → redirect /403
// 3. If user_profiles.active=true → redirect /account-suspended
// 4. Permission chi tiết được check trong từng Server Component / API route
```

---

## 6. Implementation Notes

- **Admin UI:** Dùng cùng Tailwind CSS 4 stack, không import thêm UI library
- **Data fetching:** Admin pages dùng Server Components fetch qua service role client (bypass RLS)
- **Pagination:** Tất cả list pages dùng cursor-based pagination (không offset — performance tốt hơn với large datasets)
- **Audit logging:** Mọi action trong admin panel log vào `admin_audit_logs` table (future)

---

## 7. Out of Scope (Future)

- `admin_audit_logs` table — log chi tiết từng action của admin
- Email notification khi account bị suspend
- 2FA requirement cho admin accounts
- Admin API rate limiting riêng
