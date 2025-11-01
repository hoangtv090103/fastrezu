# Supabase SQL Schemas

Folder này chứa các file SQL schema theo version để dễ dàng quản lý và deploy database.

## Cấu trúc

```
supabase-sql/
├── README.md                 # File này
├── v1.0.0-schema.sql        # Schema đầy đủ version 1.0.0
└── migrations/              # Các migration files (nếu cần)
```

## Versions

### v1.0.0 (2025-10-29)
**File:** `v1.0.0-schema.sql`

Schema đầy đủ bao gồm:

#### Tables:
1. **subscribers** - Email collection cho landing page
2. **user_profiles** - User profiles (extends Supabase Auth)
3. **cvs** - CV documents
4. **cv_sections** - CV sections với JSONB data
5. **jd_analyses** - Job description analyses
6. **ats_suggestions** - ATS optimization suggestions từ AI
7. **applied_suggestions** - Tracking applied suggestions

#### Features:
- ✅ Row Level Security (RLS) cho tất cả tables
- ✅ Indexes được tối ưu cho performance
- ✅ Triggers cho auto-update timestamps
- ✅ Foreign key constraints
- ✅ Check constraints cho data validation
- ✅ Comments cho documentation

#### Key Features:
- **Suggestion Tracking**: Hệ thống tracking suggestions với `is_active` và `is_applied` flags
- **Version Control**: Suggestions cũ được mark inactive khi re-score
- **Applied History**: Track history của suggestions đã apply

## Cách sử dụng

### Deploy Schema mới

1. Mở Supabase SQL Editor
2. Copy toàn bộ nội dung file `v1.0.0-schema.sql`
3. Paste vào SQL Editor
4. Run query

### Kiểm tra Schema

```sql
-- Xem tất cả tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Xem columns của một table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ats_suggestions'
ORDER BY ordinal_position;

-- Xem indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Xem RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Backup Database

```bash
# Backup toàn bộ database
pg_dump -h your-host -U postgres -d your-db > backup.sql

# Backup chỉ schema (không có data)
pg_dump -h your-host -U postgres -d your-db --schema-only > schema-backup.sql
```

## Migration Strategy

Khi cần thay đổi schema:

1. **Tạo migration file mới** trong folder `migrations/`
   - Naming: `YYYY-MM-DD-description.sql`
   - Example: `2025-10-30-add-user-preferences.sql`

2. **Test migration** trên local/staging trước

3. **Update version** - Tạo file schema mới với version tăng
   - Example: `v1.1.0-schema.sql`

4. **Document changes** trong README này

## Best Practices

1. **Luôn sử dụng `IF NOT EXISTS`** khi tạo tables/indexes
2. **Thêm comments** cho tables và columns quan trọng
3. **Test RLS policies** kỹ trước khi deploy
4. **Backup trước khi chạy migration** trên production
5. **Version control** - Commit SQL files vào git

## Rollback

Nếu cần rollback:

```sql
-- Drop tables theo thứ tự ngược lại (child tables trước)
DROP TABLE IF EXISTS applied_suggestions CASCADE;
DROP TABLE IF EXISTS ats_suggestions CASCADE;
DROP TABLE IF EXISTS jd_analyses CASCADE;
DROP TABLE IF EXISTS cv_sections CASCADE;
DROP TABLE IF EXISTS cvs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Support

Nếu có vấn đề với schema:
1. Check Supabase logs
2. Verify RLS policies
3. Check foreign key constraints
4. Review indexes performance

## Notes

- Schema này được thiết kế cho PostgreSQL 14+
- Sử dụng Supabase Auth cho authentication
- RLS được enable cho security
- Indexes được tối ưu cho common queries
