-- =====================================================================
-- Migration: Story 2.4 + 2.5 + 2.6
-- Thêm cột `enabled_sections` vào master_profiles
-- để lưu danh sách tab ẩn mà user đã kích hoạt (Progressive Disclosure)
-- =====================================================================
-- Ngày: 2026-02-27
-- Chạy tại: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- =====================================================================

-- 1. Thêm cột enabled_sections vào master_profiles
--    Đây là JSON array, ví dụ: ["projects", "certifications", "awards"]
--    Mặc định null → trống (chưa bật section nào)
ALTER TABLE public.master_profiles
ADD COLUMN IF NOT EXISTS enabled_sections jsonb DEFAULT '[]'::jsonb;

-- 2. Tạo bảng vault_settings riêng để lưu cấu hình tab cho mỗi user
--    (thay vì nhồi vào master_profiles vì enabled_sections là dữ liệu
--    global per-user, không gắn với một section_type cụ thể nào)
CREATE TABLE IF NOT EXISTS public.vault_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    enabled_sections jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id)
);

-- 3. Enable RLS
ALTER TABLE public.vault_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: user chỉ đọc/sửa settings của chính mình
CREATE POLICY "Users can manage their vault settings" ON public.vault_settings FOR ALL USING (auth.uid () = user_id);

-- 5. Trigger tự cập nhật updated_at khi có thay đổi
CREATE OR REPLACE FUNCTION public.update_vault_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vault_settings_updated_at ON public.vault_settings;

CREATE TRIGGER vault_settings_updated_at
    BEFORE UPDATE ON public.vault_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vault_settings_updated_at();

-- 6. Kiểm tra kết quả
-- SELECT * FROM public.vault_settings LIMIT 5;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vault_settings';