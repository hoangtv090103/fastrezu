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
