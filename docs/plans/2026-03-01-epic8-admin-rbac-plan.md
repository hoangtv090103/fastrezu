# EPIC 8: Admin Panel & RBAC — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Odoo-inspired RBAC system (Groups + implied permissions + per-resource CRUD flags) and an Admin Panel at `/admin` with user management, AI usage monitoring, rate limit config, and dashboard metrics. Apply soft delete across all user data tables.

**Architecture:** No middleware file exists — admin protection is done in `(admin)/layout.tsx` (server component, same pattern as `(authenticated)/layout.tsx`). All admin API routes use a Supabase service role client to bypass RLS. Permission checks use `requirePermission()` utility that resolves implied groups.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL + RLS, TypeScript 5, Tailwind CSS 4, `@supabase/ssr`

**Design Doc:** `docs/plans/2026-03-01-rbac-admin-design.md`

---

## Task 1: Soft Delete Migration (Story 8.1)

**Files:**
- Create: `supabase-sql/epic8-soft-delete.sql`
- Modify: `src/types/database.types.ts`

### Step 1: Write soft delete migration SQL

Create `supabase-sql/epic8-soft-delete.sql`:

```sql
-- ============================================================================
-- EPIC 8 — Soft Delete Migration
-- Adds: active BOOLEAN, deleted_at TIMESTAMPTZ, deleted_by UUID
-- to all user data tables.
-- active = true  → record is alive
-- active = false → record is soft-deleted / account suspended
-- ============================================================================

-- ── user_profiles ───────────────────────────────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles (active);

-- ── master_profiles ──────────────────────────────────────────────────────────
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── jobs ─────────────────────────────────────────────────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs (active);

-- ── job_analyses ──────────────────────────────────────────────────────────────
ALTER TABLE job_analyses
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── resumes ───────────────────────────────────────────────────────────────────
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── cv_scan_history ───────────────────────────────────────────────────────────
ALTER TABLE cv_scan_history
  ADD COLUMN IF NOT EXISTS active     BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── RLS: add active = true filter to existing SELECT policies ────────────────
-- NOTE: Drop and recreate existing SELECT policies to add the active filter.
-- Adjust policy names to match what exists in your Supabase project.
-- You can check exact policy names in: Supabase Dashboard → Authentication → Policies

-- Example pattern (repeat for each table):
-- DROP POLICY IF EXISTS "users_select_own_jobs" ON jobs;
-- CREATE POLICY "users_select_own_jobs" ON jobs
--   FOR SELECT USING (auth.uid() = user_id AND active = true);
--
-- Run: SELECT policyname, tablename FROM pg_policies WHERE schemaname='public';
-- to see all existing policy names before dropping.
```

### Step 2: Run migration in Supabase

Open Supabase Dashboard → SQL Editor → paste and run `epic8-soft-delete.sql`.

Expected: No errors. Each ALTER TABLE succeeds. Indexes created.

### Step 3: Update TypeScript types for soft delete columns

In `src/types/database.types.ts`, find the `user_profiles` table definition and add the 3 new columns to Row, Insert, Update. Do the same for `master_profiles`, `jobs`, `job_analyses`, `resumes`, `cv_scan_history`.

Pattern to add to each table's `Row`:
```typescript
active: boolean
deleted_at: string | null
deleted_by: string | null
```

Pattern for `Insert` and `Update` (all optional):
```typescript
active?: boolean | null
deleted_at?: string | null
deleted_by?: string | null
```

### Step 4: Verify TypeScript compiles

```bash
bun tsc --noEmit
```
Expected: 0 errors.

### Step 5: Commit

```bash
git add supabase-sql/epic8-soft-delete.sql src/types/database.types.ts
git commit -m "feat(db): add soft delete columns (active, deleted_at, deleted_by) to 6 user data tables"
```

---

## Task 2: RBAC Database Schema & Seed (Story 8.2)

**Files:**
- Create: `supabase-sql/epic8-rbac.sql`
- Modify: `src/types/database.types.ts`

### Step 1: Write RBAC migration SQL

Create `supabase-sql/epic8-rbac.sql`:

```sql
-- ============================================================================
-- EPIC 8 — RBAC Schema (Odoo-inspired)
-- Tables: groups, group_implied, user_groups, group_permissions
-- ============================================================================

-- ── groups ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        UNIQUE NOT NULL,
  display_name TEXT        NOT NULL,
  description  TEXT,
  category     TEXT        NOT NULL DEFAULT 'custom',
  is_system    BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── group_implied (A implies B → A inherits B's permissions) ─────────────────
CREATE TABLE IF NOT EXISTS group_implied (
  from_group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  to_group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (from_group_id, to_group_id),
  CHECK (from_group_id != to_group_id)
);

-- ── user_groups ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_groups (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id   UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups (user_id);

-- ── group_permissions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_permissions (
  group_id   UUID    NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  resource   TEXT    NOT NULL,
  can_read   BOOLEAN NOT NULL DEFAULT false,
  can_write  BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (group_id, resource)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE groups           ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_implied    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_permissions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read groups (to know what groups exist)
CREATE POLICY "authenticated_read_groups"
  ON groups FOR SELECT TO authenticated USING (true);

-- Authenticated users can read group_implied
CREATE POLICY "authenticated_read_group_implied"
  ON group_implied FOR SELECT TO authenticated USING (true);

-- Users can read their own group memberships
CREATE POLICY "users_read_own_memberships"
  ON user_groups FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can read permissions (for UI rendering)
CREATE POLICY "authenticated_read_permissions"
  ON group_permissions FOR SELECT TO authenticated USING (true);

-- All writes go through service role (admin API routes) — no additional policies needed

-- ── Seed: 3 system groups ────────────────────────────────────────────────────
INSERT INTO groups (name, display_name, description, category, is_system) VALUES
  ('system.administrator', 'Quản trị viên', 'Toàn quyền hệ thống', 'system', true),
  ('system.support',       'Hỗ trợ kỹ thuật', 'Xem và sửa user, xem AI usage', 'system', true),
  ('system.analyst',       'Phân tích dữ liệu', 'Chỉ đọc metrics và AI usage', 'system', true)
ON CONFLICT (name) DO NOTHING;

-- ── Seed: implied groups ──────────────────────────────────────────────────────
-- administrator implies support, support implies analyst
INSERT INTO group_implied (from_group_id, to_group_id)
SELECT a.id, b.id FROM groups a, groups b
WHERE (a.name = 'system.administrator' AND b.name = 'system.support')
   OR (a.name = 'system.support'       AND b.name = 'system.analyst')
ON CONFLICT DO NOTHING;

-- ── Seed: permissions ────────────────────────────────────────────────────────
-- system.analyst: metrics:R, ai_usage:R
INSERT INTO group_permissions (group_id, resource, can_read, can_write, can_create, can_delete)
SELECT id, 'metrics',   true, false, false, false FROM groups WHERE name = 'system.analyst'
UNION ALL
SELECT id, 'ai_usage',  true, false, false, false FROM groups WHERE name = 'system.analyst'
ON CONFLICT DO NOTHING;

-- system.support: users:RW, ai_usage:R, metrics:R, groups:R (+ implied analyst)
INSERT INTO group_permissions (group_id, resource, can_read, can_write, can_create, can_delete)
SELECT id, 'users',     true, true,  false, false FROM groups WHERE name = 'system.support'
UNION ALL
SELECT id, 'ai_usage',  true, false, false, false FROM groups WHERE name = 'system.support'
UNION ALL
SELECT id, 'metrics',   true, false, false, false FROM groups WHERE name = 'system.support'
UNION ALL
SELECT id, 'groups',    true, false, false, false FROM groups WHERE name = 'system.support'
ON CONFLICT DO NOTHING;

-- system.administrator: all resources CRUD (+ implied support)
INSERT INTO group_permissions (group_id, resource, can_read, can_write, can_create, can_delete)
SELECT id, r.resource, true, true, true, true
FROM groups,
     (VALUES ('users'), ('ai_usage'), ('rate_limits'), ('metrics'), ('groups')) AS r(resource)
WHERE name = 'system.administrator'
ON CONFLICT DO NOTHING;
```

### Step 2: Run RBAC migration in Supabase

Paste and run in Supabase SQL Editor. Expected: 4 tables created, 3 groups seeded, implied links seeded, permissions seeded.

Verify:
```sql
SELECT name, is_system FROM groups;
SELECT f.name AS "from", t.name AS "to" FROM group_implied gi
  JOIN groups f ON gi.from_group_id = f.id
  JOIN groups t ON gi.to_group_id = t.id;
SELECT g.name, gp.resource, gp.can_read, gp.can_write FROM group_permissions gp
  JOIN groups g ON gp.group_id = g.id ORDER BY g.name, gp.resource;
```

### Step 3: Assign yourself to administrator group

```sql
-- Replace <your-user-uuid> with your auth.users id (found in Supabase Auth tab)
INSERT INTO user_groups (user_id, group_id)
SELECT '<your-user-uuid>', id FROM groups WHERE name = 'system.administrator';
```

### Step 4: Add RBAC types to database.types.ts

Add 4 new table definitions to the `Tables` object in `src/types/database.types.ts`:

```typescript
groups: {
  Row: {
    id: string
    name: string
    display_name: string
    description: string | null
    category: string
    is_system: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    name: string
    display_name: string
    description?: string | null
    category?: string
    is_system?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    name?: string
    display_name?: string
    description?: string | null
    category?: string
    updated_at?: string
  }
  Relationships: []
}
group_implied: {
  Row: { from_group_id: string; to_group_id: string }
  Insert: { from_group_id: string; to_group_id: string }
  Update: { from_group_id?: string; to_group_id?: string }
  Relationships: []
}
user_groups: {
  Row: {
    user_id: string
    group_id: string
    granted_at: string
    granted_by: string | null
  }
  Insert: {
    user_id: string
    group_id: string
    granted_at?: string
    granted_by?: string | null
  }
  Update: {
    granted_at?: string
    granted_by?: string | null
  }
  Relationships: []
}
group_permissions: {
  Row: {
    group_id: string
    resource: string
    can_read: boolean
    can_write: boolean
    can_create: boolean
    can_delete: boolean
  }
  Insert: {
    group_id: string
    resource: string
    can_read?: boolean
    can_write?: boolean
    can_create?: boolean
    can_delete?: boolean
  }
  Update: {
    can_read?: boolean
    can_write?: boolean
    can_create?: boolean
    can_delete?: boolean
  }
  Relationships: []
}
```

### Step 5: Verify

```bash
bun tsc --noEmit
```
Expected: 0 errors.

### Step 6: Commit

```bash
git add supabase-sql/epic8-rbac.sql src/types/database.types.ts
git commit -m "feat(db): add RBAC tables (groups, group_implied, user_groups, group_permissions) with seed data"
```

---

## Task 3: Admin Auth Utilities & Service Role Client (Story 8.3 — Part A)

**Files:**
- Modify: `src/lib/supabase-server.ts`
- Create: `src/lib/admin-auth.ts`

### Step 1: Add service role client to supabase-server.ts

In `src/lib/supabase-server.ts`, add after the existing `createClient` export:

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Service role client — bypasses RLS. Use ONLY in admin API routes.
 * Never expose to the browser.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
```

### Step 2: Create src/lib/admin-auth.ts

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export type AdminResource = 'users' | 'ai_usage' | 'rate_limits' | 'metrics' | 'groups'
export type AdminAction = 'read' | 'write' | 'create' | 'delete'

/**
 * Resolves all group IDs a user belongs to, including implied (inherited) groups.
 * e.g. if user is in 'administrator' which implies 'support', both IDs are returned.
 */
async function resolveUserGroupIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  // Direct memberships
  const { data: memberships } = await supabase
    .from('user_groups')
    .select('group_id')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return []

  const directIds = memberships.map((m) => m.group_id)

  // Implied groups (one level — administrator → support → analyst)
  // We do two rounds to handle transitive implications (max depth = 2 for current seed)
  const allIds = new Set(directIds)
  let frontier = [...directIds]

  for (let round = 0; round < 3; round++) {
    if (frontier.length === 0) break
    const { data: implied } = await supabase
      .from('group_implied')
      .select('to_group_id')
      .in('from_group_id', frontier)

    if (!implied || implied.length === 0) break
    const newIds = implied
      .map((i) => i.to_group_id)
      .filter((id) => !allIds.has(id))
    newIds.forEach((id) => allIds.add(id))
    frontier = newIds
  }

  return Array.from(allIds)
}

/**
 * Checks if the user has the required permission on the given resource.
 * Throws a Response with status 403 if not permitted.
 * Uses service role supabase to bypass RLS when reading permissions.
 */
export async function requirePermission(
  supabase: SupabaseClient,
  userId: string,
  resource: AdminResource,
  action: AdminAction,
): Promise<void> {
  const groupIds = await resolveUserGroupIds(supabase, userId)

  if (groupIds.length === 0) {
    throw new Response(
      JSON.stringify({ error: 'Access denied: no admin groups assigned' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const actionColumn = `can_${action}` as const

  const { data: permissions } = await supabase
    .from('group_permissions')
    .select(actionColumn)
    .eq('resource', resource)
    .in('group_id', groupIds)
    .eq(actionColumn, true)
    .limit(1)

  if (!permissions || permissions.length === 0) {
    throw new Response(
      JSON.stringify({ error: `Access denied: missing ${resource}:${action} permission` }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

/**
 * Returns true if user has any admin group (for layout-level checks).
 */
export async function hasAnyAdminGroup(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from('user_groups')
    .select('group_id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return (count ?? 0) > 0
}
```

### Step 3: Verify

```bash
bun tsc --noEmit
```
Expected: 0 errors.

### Step 4: Commit

```bash
git add src/lib/supabase-server.ts src/lib/admin-auth.ts
git commit -m "feat(admin): add service role client and admin-auth utility (requirePermission, hasAnyAdminGroup)"
```

---

## Task 4: Admin Layout & Static Error Pages (Story 8.3 — Part B)

**Files:**
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/403/page.tsx`
- Create: `src/app/account-suspended/page.tsx`

### Step 1: Create admin layout

Create `src/app/(admin)/layout.tsx`:

```typescript
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { hasAnyAdminGroup } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check account active status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('active')
    .eq('id', user.id)
    .single()

  if (profile && !profile.active) redirect('/account-suspended')

  // Check admin group membership (use service client to bypass RLS on user_groups if needed)
  const serviceClient = createServiceClient()
  const isAdmin = await hasAnyAdminGroup(serviceClient, user.id)
  if (!isAdmin) redirect('/403')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
```

### Step 2: Create AdminSidebar component

Create `src/components/admin/AdminSidebar.tsx`:

```typescript
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin',             label: 'Dashboard' },
  { href: '/admin/users',       label: 'Người dùng' },
  { href: '/admin/groups',      label: 'Phân quyền' },
  { href: '/admin/ai-usage',    label: 'AI Usage' },
  { href: '/admin/rate-limits', label: 'Rate Limits' },
]

export default function AdminSidebar() {
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Admin Panel</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700">
        <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300">
          ← Về trang chính
        </Link>
      </div>
    </aside>
  )
}
```

### Step 3: Create 403 and account-suspended pages

Create `src/app/403/page.tsx`:

```typescript
import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">403</h1>
        <p className="mt-4 text-xl text-gray-600">Bạn không có quyền truy cập trang này.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-blue-600 hover:underline">
          Quay về Dashboard
        </Link>
      </div>
    </div>
  )
}
```

Create `src/app/account-suspended/page.tsx`:

```typescript
import Link from 'next/link'

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-800">Tài khoản bị tạm khóa</h1>
        <p className="mt-4 text-gray-600">
          Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ để biết thêm thông tin.
        </p>
        <a href="mailto:support@fastrezu.com" className="mt-6 inline-block text-blue-600 hover:underline">
          Liên hệ hỗ trợ
        </a>
      </div>
    </div>
  )
}
```

### Step 4: Manual test

Run `bun dev`. Navigate to `/admin`. Verify:
- Without being logged in → redirect to `/login`
- Logged in but no group → redirect to `/403`
- Logged in as administrator → see admin sidebar

### Step 5: Commit

```bash
git add src/app/(admin)/ src/app/403/ src/app/account-suspended/ src/components/admin/AdminSidebar.tsx
git commit -m "feat(admin): add admin layout with auth guard and AdminSidebar component"
```

---

## Task 5: Admin Dashboard (Story 8.4)

**Files:**
- Create: `src/app/(admin)/admin/page.tsx`
- Create: `src/app/api/admin/metrics/route.ts`

### Step 1: Create metrics API route

Create `src/app/api/admin/metrics/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'metrics', 'read')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const day7ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const day30ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // User counts by tier
    const { data: tierCounts } = await service
      .from('user_profiles')
      .select('subscription_tier')
      .eq('active', true)

    const byTier: Record<string, number> = {}
    tierCounts?.forEach((row) => {
      const t = row.subscription_tier ?? 'free'
      byTier[t] = (byTier[t] ?? 0) + 1
    })

    // Suspended count
    const { count: suspendedCount } = await service
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('active', false)

    // AI calls
    const { count: callsToday } = await service
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    const { count: calls7d } = await service
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', day7ago)

    const { count: calls30d } = await service
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', day30ago)

    // Top features (last 30d)
    const { data: featureLogs } = await service
      .from('ai_usage_logs')
      .select('feature')
      .gte('created_at', day30ago)

    const featureCounts: Record<string, number> = {}
    featureLogs?.forEach((row) => {
      featureCounts[row.feature] = (featureCounts[row.feature] ?? 0) + 1
    })
    const topFeatures = Object.entries(featureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([feature, count]) => ({ feature, count }))

    return NextResponse.json({
      byTier,
      suspendedCount: suspendedCount ?? 0,
      callsToday: callsToday ?? 0,
      calls7d: calls7d ?? 0,
      calls30d: calls30d ?? 0,
      topFeatures,
    })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Step 2: Create admin dashboard page

Create `src/app/(admin)/admin/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { hasAnyAdminGroup } from '@/lib/admin-auth'

async function getMetrics() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    cache: 'no-store',
    headers: { Cookie: '' }, // Server-to-server: auth handled in API route
  })
  if (!res.ok) return null
  return res.json()
}

// Server component — fetch directly from service client instead of own API
export default async function AdminDashboardPage() {
  const service = createServiceClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // User counts by tier
  const { data: profiles } = await service
    .from('user_profiles')
    .select('subscription_tier, active')

  const byTier: Record<string, number> = {}
  let suspendedCount = 0
  profiles?.forEach((p) => {
    if (!p.active) { suspendedCount++; return }
    const t = p.subscription_tier ?? 'free'
    byTier[t] = (byTier[t] ?? 0) + 1
  })

  const day30ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { count: callsToday } = await service
    .from('ai_usage_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  const { data: featureLogs } = await service
    .from('ai_usage_logs')
    .select('feature')
    .gte('created_at', day30ago)

  const featureCounts: Record<string, number> = {}
  featureLogs?.forEach((row) => {
    featureCounts[row.feature] = (featureCounts[row.feature] ?? 0) + 1
  })
  const topFeatures = Object.entries(featureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const TIERS = ['free', 'sprint_pass', 'pro_pass', 'beta_free']

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Tier breakdown */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Người dùng theo gói</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TIERS.map((tier) => (
            <div key={tier} className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-xs text-gray-500 uppercase">{tier}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{byTier[tier] ?? 0}</p>
            </div>
          ))}
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <p className="text-xs text-red-500 uppercase">Suspended</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{suspendedCount}</p>
          </div>
        </div>
      </section>

      {/* AI calls */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">AI Calls</h2>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <p className="text-4xl font-bold text-blue-600">{callsToday}</p>
          <p className="text-sm text-gray-500">hôm nay</p>
        </div>
      </section>

      {/* Top features */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Top features (30 ngày)</h2>
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {topFeatures.map(([feature, count]) => (
            <div key={feature} className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-700 font-mono">{feature}</span>
              <span className="text-sm font-semibold text-gray-900">{count} calls</span>
            </div>
          ))}
          {topFeatures.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">Chưa có dữ liệu</p>
          )}
        </div>
      </section>
    </div>
  )
}
```

### Step 3: Manual test

Navigate to `/admin`. Verify dashboard shows user counts and AI call stats.

### Step 4: Commit

```bash
git add src/app/(admin)/admin/page.tsx src/app/api/admin/metrics/
git commit -m "feat(admin): add dashboard page with tier breakdown and AI usage stats"
```

---

## Task 6: Admin User Management (Story 8.5)

**Files:**
- Create: `src/app/(admin)/admin/users/page.tsx`
- Create: `src/app/(admin)/admin/users/[id]/page.tsx`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`

### Step 1: Create users list API route

Create `src/app/api/admin/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'users', 'read')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const tier = searchParams.get('tier')
    const status = searchParams.get('status') // 'active' | 'suspended'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    let query = service
      .from('user_profiles')
      .select('id, email, full_name, subscription_tier, active, deleted_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    if (tier) query = query.eq('subscription_tier', tier)
    if (status === 'active') query = query.eq('active', true)
    if (status === 'suspended') query = query.eq('active', false)

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({ users: data, total: count ?? 0 })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Step 2: Create user detail + PATCH API route

Create `src/app/api/admin/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'users', 'read')

    const { data: profile } = await service
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    const { data: groups } = await service
      .from('user_groups')
      .select('group_id, granted_at, granted_by, groups(name, display_name)')
      .eq('user_id', id)

    // AI usage last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: usage } = await service
      .from('ai_usage_logs')
      .select('feature, created_at')
      .eq('user_id', id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    return NextResponse.json({ profile, groups, usage })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'users', 'write')

    const body = await request.json()
    const { subscription_tier, active, add_group, remove_group } = body

    // Update profile
    if (subscription_tier !== undefined || active !== undefined) {
      const update: Record<string, unknown> = {}
      if (subscription_tier !== undefined) update.subscription_tier = subscription_tier
      if (active !== undefined) {
        update.active = active
        update.deleted_at = active ? null : new Date().toISOString()
        update.deleted_by = active ? null : user.id
      }
      await service.from('user_profiles').update(update).eq('id', id)
    }

    // Add group
    if (add_group) {
      await service.from('user_groups').insert({
        user_id: id,
        group_id: add_group,
        granted_by: user.id,
      }).onConflict('user_id, group_id').ignore()
    }

    // Remove group
    if (remove_group) {
      await service.from('user_groups')
        .delete()
        .eq('user_id', id)
        .eq('group_id', remove_group)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Step 3: Create users list page (Server Component)

Create `src/app/(admin)/admin/users/page.tsx` — server component that renders user list with inline actions via client component.

```typescript
import { createServiceClient } from '@/lib/supabase-server'
import UsersTable from '@/components/admin/UsersTable'

export default async function AdminUsersPage() {
  const service = createServiceClient()
  const { data: users } = await service
    .from('user_profiles')
    .select('id, email, full_name, subscription_tier, active, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: groups } = await service
    .from('groups')
    .select('id, name, display_name')
    .order('display_name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Người dùng</h1>
      <UsersTable initialUsers={users ?? []} groups={groups ?? []} />
    </div>
  )
}
```

### Step 4: Create UsersTable client component

Create `src/components/admin/UsersTable.tsx` — a Client Component with search, filter, and actions.

Key features:
- Search input (debounced, calls `/api/admin/users?search=`)
- Tier filter dropdown
- Status filter (active/suspended)
- Actions: Tier dropdown (onChange → PATCH), Suspend/Restore button, Link to detail
- Use `useState` for local state, `fetch` for mutations

> **Note:** This is a larger component. Implement it with functional inline editing using `fetch('/api/admin/users/[id]', { method: 'PATCH' })` for tier changes and suspend/restore.

### Step 5: Manual test

Navigate to `/admin/users`. Verify user list loads. Change a user's tier → verify DB update.

### Step 6: Commit

```bash
git add src/app/(admin)/admin/users/ src/app/api/admin/users/ src/components/admin/UsersTable.tsx
git commit -m "feat(admin): add user management pages and API routes (list, detail, PATCH tier/group/suspend)"
```

---

## Task 7: Admin Group Management (Story 8.6)

**Files:**
- Create: `src/app/(admin)/admin/groups/page.tsx`
- Create: `src/app/api/admin/groups/route.ts`
- Create: `src/app/api/admin/groups/[id]/route.ts`
- Create: `src/app/api/admin/groups/[id]/permissions/route.ts`
- Create: `src/app/api/admin/groups/[id]/members/route.ts`

### Step 1: Create groups API routes

**`/api/admin/groups/route.ts`** — GET list, POST create:

```typescript
// GET: return all groups with member counts
// POST: create new group { name, display_name, description }
// requirePermission(service, user.id, 'groups', 'read'/'create')
```

**`/api/admin/groups/[id]/route.ts`** — PATCH, DELETE:

```typescript
// PATCH: update display_name, description, implied groups
// DELETE: only if !is_system
// requirePermission(service, user.id, 'groups', 'write'/'delete')
```

**`/api/admin/groups/[id]/permissions/route.ts`** — GET, PATCH:

```typescript
// GET: return all permission rows for this group
// PATCH: bulk update { resource: string, can_read, can_write, can_create, can_delete }[]
// requirePermission(service, user.id, 'groups', 'write')
```

**`/api/admin/groups/[id]/members/route.ts`** — GET, POST (add), DELETE:

```typescript
// GET: list members (user_id, email, granted_at)
// POST: { user_id } to add member
// DELETE: { user_id } to remove member
// requirePermission(service, user.id, 'groups', 'write')
```

### Step 2: Create groups page with permission matrix UI

Create `src/app/(admin)/admin/groups/page.tsx` — server component.

Key UI elements:
- List of groups with member count
- Click group → expand permission matrix (5 resources × 4 actions = 20 checkboxes)
- "Tạo group mới" modal with form
- System groups: grayed-out delete button

### Step 3: Manual test

Navigate to `/admin/groups`. Verify groups list. Toggle a permission checkbox → save → verify DB.

### Step 4: Commit

```bash
git add src/app/(admin)/admin/groups/ src/app/api/admin/groups/
git commit -m "feat(admin): add group management with permission matrix UI"
```

---

## Task 8: Admin AI Usage Monitor & Rate Limits (Stories 8.7, 8.8)

**Files:**
- Create: `src/app/(admin)/admin/ai-usage/page.tsx`
- Create: `src/app/(admin)/admin/rate-limits/page.tsx`
- Create: `src/app/api/admin/ai-usage/route.ts`
- Create: `src/app/api/admin/rate-limits/route.ts`

### Step 1: Create AI usage API route

Create `src/app/api/admin/ai-usage/route.ts`:

```typescript
// GET /api/admin/ai-usage?days=7&feature=&tier=
// Aggregates ai_usage_logs by user, feature, day
// Returns: [{ user_id, email, feature, count }]
// requirePermission(service, user.id, 'ai_usage', 'read')
```

Implementation pattern:
```typescript
const { data: logs } = await service
  .from('ai_usage_logs')
  .select('user_id, feature, created_at')
  .gte('created_at', since)

// Join with user_profiles for email
const userIds = [...new Set(logs?.map(l => l.user_id) ?? [])]
const { data: profiles } = await service
  .from('user_profiles')
  .select('id, email, subscription_tier')
  .in('id', userIds)

// Aggregate in JS
```

### Step 2: Create AI usage page

Create `src/app/(admin)/admin/ai-usage/page.tsx` — server component rendering aggregated table. Highlight rows where user is on `free` tier with high call count (> 8 in 24h).

### Step 3: Create rate limits API route

Create `src/app/api/admin/rate-limits/route.ts`:

```typescript
// GET: return all ai_rate_limit_config rows
// PATCH: bulk update { rows: { tier, feature, daily_limit }[] }
// requirePermission(service, user.id, 'rate_limits', 'write')

// PATCH handler:
const { rows } = await request.json()
for (const row of rows) {
  await service
    .from('ai_rate_limit_config')
    .upsert({ tier: row.tier, feature: row.feature, daily_limit: row.daily_limit, updated_at: new Date().toISOString() })
    .onConflict('tier, feature')
}
```

### Step 4: Create rate limits page

Create `src/app/(admin)/admin/rate-limits/page.tsx` — Client Component with inline-edit number inputs.

Key UI:
- Table: rows = tiers (free, sprint_pass, pro_pass, beta_free), columns = features + 'default'
- Each cell: `<input type="number" defaultValue={config.daily_limit} />`
- `-1` displayed as "∞"
- "Lưu thay đổi" button → PATCH all changed cells

### Step 5: Manual test

Navigate to `/admin/rate-limits`. Change `free / default` limit from 10 to 5 → save → verify `ai_rate_limit_config` in Supabase.

### Step 6: Final lint + type check

```bash
bun run lint && bun tsc --noEmit
```
Expected: 0 errors, ≤5 pre-existing warnings.

### Step 7: Commit

```bash
git add src/app/(admin)/admin/ai-usage/ src/app/(admin)/admin/rate-limits/ \
        src/app/api/admin/ai-usage/ src/app/api/admin/rate-limits/
git commit -m "feat(admin): add AI usage monitor and rate limits config pages"
```

---

## Final Checklist

- [ ] `bun tsc --noEmit` passes (0 errors)
- [ ] `bun run lint` passes (0 errors)
- [ ] `/admin` protected: unauthenticated → `/login`, no-group → `/403`, suspended → `/account-suspended`
- [ ] `/admin` dashboard shows user counts by tier
- [ ] `/admin/users` list loads, tier change and suspend/restore work
- [ ] `/admin/groups` shows permission matrix, checkboxes save correctly
- [ ] `/admin/ai-usage` shows aggregated usage logs
- [ ] `/admin/rate-limits` inline-edit saves to DB immediately
- [ ] SQL migration: 6 tables have `active`, `deleted_at`, `deleted_by` columns
- [ ] RBAC tables exist with 3 system groups seeded
- [ ] Administrator implies Support implies Analyst (test via requirePermission)
