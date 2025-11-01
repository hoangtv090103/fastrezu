# Database Migrations

Folder này chứa các migration files theo thứ tự thời gian.

## Naming Convention

```
YYYY-MM-DD-NN-description.sql
```

- **YYYY-MM-DD**: Ngày tạo migration
- **NN**: Số thứ tự trong ngày (01, 02, 03...)
- **description**: Mô tả ngắn gọn về migration

## Migration Files

### 2025-10-29-01-add-applied-suggestions-table.sql
**Mục đích:** Tạo bảng `applied_suggestions` để track suggestions đã apply

**Changes:**
- Tạo table `applied_suggestions`
- Thêm indexes
- Setup RLS policies
- Thêm comments

**Dependencies:** Requires `cvs` table

### 2025-10-29-02-add-is-active-columns.sql
**Mục đích:** Thêm columns để track trạng thái suggestions

**Changes:**
- Thêm column `is_active` vào `applied_suggestions`
- Thêm column `is_applied` vào `applied_suggestions`
- Tạo indexes mới
- Thêm comments

**Dependencies:** Requires `applied_suggestions` table

### 2025-10-29-03-add-ats-suggestions-table.sql
**Mục đích:** Tạo bảng riêng cho ATS suggestions từ AI

**Changes:**
- Tạo table `ats_suggestions`
- Thêm indexes
- Setup RLS policies
- Thêm comments

**Dependencies:** Requires `cvs` table

## Cách chạy Migrations

### Option 1: Chạy từng file
```sql
-- Trong Supabase SQL Editor, chạy từng file theo thứ tự:
-- 1. 2025-10-29-01-add-applied-suggestions-table.sql
-- 2. 2025-10-29-02-add-is-active-columns.sql
-- 3. 2025-10-29-03-add-ats-suggestions-table.sql
```

### Option 2: Chạy full schema
```sql
-- Hoặc chạy file v1.0.0-schema.sql để có đầy đủ schema
-- File này đã bao gồm tất cả migrations
```

## Testing Migrations

Trước khi chạy trên production:

1. **Test trên local/staging**
   ```sql
   -- Chạy migration
   \i 2025-10-29-01-add-applied-suggestions-table.sql
   
   -- Verify table created
   \d applied_suggestions
   
   -- Test insert
   INSERT INTO applied_suggestions (...) VALUES (...);
   ```

2. **Verify RLS policies**
   ```sql
   -- Check policies
   SELECT * FROM pg_policies WHERE tablename = 'applied_suggestions';
   
   -- Test as user
   SET ROLE authenticated;
   SELECT * FROM applied_suggestions;
   ```

3. **Check indexes**
   ```sql
   -- Verify indexes created
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'applied_suggestions';
   ```

## Rollback

Mỗi migration nên có rollback script:

### Rollback 2025-10-29-03
```sql
DROP TABLE IF EXISTS ats_suggestions CASCADE;
```

### Rollback 2025-10-29-02
```sql
DROP INDEX IF EXISTS idx_applied_suggestions_is_active;
DROP INDEX IF EXISTS idx_applied_suggestions_is_applied;
ALTER TABLE applied_suggestions DROP COLUMN IF EXISTS is_active;
ALTER TABLE applied_suggestions DROP COLUMN IF EXISTS is_applied;
```

### Rollback 2025-10-29-01
```sql
DROP TABLE IF EXISTS applied_suggestions CASCADE;
```

## Best Practices

1. **Luôn backup trước khi chạy migration**
2. **Test trên staging trước**
3. **Chạy migrations theo thứ tự**
4. **Verify sau mỗi migration**
5. **Document breaking changes**
6. **Keep migrations idempotent** (sử dụng IF NOT EXISTS)

## Notes

- Migrations được thiết kế để chạy độc lập
- Sử dụng `IF NOT EXISTS` để tránh lỗi khi chạy lại
- Mỗi migration có thể rollback được
- Test kỹ trước khi deploy production
