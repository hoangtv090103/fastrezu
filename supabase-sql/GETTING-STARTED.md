# Getting Started with FastRezu Database

Hướng dẫn nhanh để setup database cho FastRezu.

## 📁 Cấu trúc Folder

```
supabase-sql/
├── v1.0.0-schema.sql              # Schema đầy đủ (khuyên dùng)
├── migrations/                     # Các migration files riêng lẻ
│   ├── 2025-10-29-01-*.sql
│   ├── 2025-10-29-02-*.sql
│   └── 2025-10-29-03-*.sql
├── README.md                       # Tài liệu chính
├── CHANGELOG.md                    # Lịch sử thay đổi
├── QUICK-REFERENCE.md             # Tham khảo nhanh
└── GETTING-STARTED.md             # File này
```

## 🚀 Quick Start

### Option 1: Deploy Full Schema (Khuyên dùng)

**Cho database mới hoặc muốn reset:**

1. Mở [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Tạo query mới
5. Copy toàn bộ nội dung file `v1.0.0-schema.sql`
6. Paste vào editor
7. Click **Run** hoặc nhấn `Ctrl/Cmd + Enter`
8. Đợi ~10-30 giây để hoàn thành

✅ **Done!** Database đã sẵn sàng.

### Option 2: Run Migrations Từng Bước

**Cho database đã có sẵn một phần:**

1. Mở Supabase SQL Editor
2. Chạy từng file trong folder `migrations/` theo thứ tự:
   ```
   2025-10-29-01-add-applied-suggestions-table.sql
   2025-10-29-02-add-is-active-columns.sql
   2025-10-29-03-add-ats-suggestions-table.sql
   ```
3. Verify sau mỗi migration

## ✅ Verification

Sau khi deploy, verify bằng các query sau:

### 1. Check tất cả tables đã được tạo
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected output:** 6 tables
- applied_suggestions
- ats_suggestions
- cv_sections
- cvs
- jd_analyses
- user_profiles

### 2. Check RLS đã được enable
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Expected:** Tất cả tables có `rowsecurity = true`

### 3. Check indexes
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

**Expected:** ~15-20 indexes

### 4. Test insert data
```sql
-- Test insert subscriber (public access)
INSERT INTO subscribers (email, status) 
VALUES ('test@example.com', 'pending');

-- Verify
SELECT * FROM subscribers WHERE email = 'test@example.com';

-- Cleanup
DELETE FROM subscribers WHERE email = 'test@example.com';
```

## 🔧 Configuration

### Enable Realtime (Optional)

Nếu cần realtime updates:

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE ats_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE cvs;
```

### Setup Storage (Optional)

Nếu cần lưu files (CV PDFs, avatars):

1. Vào **Storage** trong Supabase Dashboard
2. Tạo bucket mới: `cv-files`
3. Set policies:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
   ```

## 📊 Sample Data (Optional)

Để test, có thể insert sample data:

```sql
-- Insert test user profile (requires auth user first)
INSERT INTO user_profiles (id, email, full_name, subscription_tier)
VALUES (
  'your-auth-user-id',
  'test@example.com',
  'Test User',
  'beta_free'
);

-- Insert test CV
INSERT INTO cvs (user_id, title, ats_score)
VALUES (
  'your-auth-user-id',
  'My Test CV',
  75
)
RETURNING id;

-- Insert CV section
INSERT INTO cv_sections (cv_id, section_type, data)
VALUES (
  'your-cv-id',
  'personal_info',
  '{"name": "Test User", "email": "test@example.com"}'::jsonb
);
```

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution:** Tables đã tồn tại. Sử dụng migrations thay vì full schema.

### Error: "permission denied"
**Solution:** Check RLS policies. Đảm bảo user đã authenticated.

### Error: "foreign key violation"
**Solution:** Tạo parent records trước (user_profiles → cvs → cv_sections).

### Slow queries
**Solution:** 
1. Check indexes: `SELECT * FROM pg_indexes WHERE schemaname = 'public';`
2. Run ANALYZE: `ANALYZE ats_suggestions;`
3. Use EXPLAIN: `EXPLAIN ANALYZE SELECT ...;`

## 📚 Next Steps

1. **Read Documentation:**
   - [README.md](./README.md) - Tổng quan và best practices
   - [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Common queries
   - [CHANGELOG.md](./CHANGELOG.md) - Version history

2. **Setup Application:**
   - Configure Supabase client trong app
   - Test authentication flow
   - Test CRUD operations

3. **Monitor Performance:**
   - Enable query logging
   - Setup alerts
   - Monitor table sizes

## 🔐 Security Checklist

Before going to production:

- [ ] RLS enabled on all tables
- [ ] Test policies with different user roles
- [ ] Review service_role permissions
- [ ] Enable SSL connections
- [ ] Setup backup schedule
- [ ] Configure rate limiting
- [ ] Review API keys security
- [ ] Enable audit logging

## 📞 Support

Nếu gặp vấn đề:

1. Check [Supabase Logs](https://app.supabase.com/project/_/logs)
2. Review [Supabase Docs](https://supabase.com/docs)
3. Check schema files trong folder này
4. Review QUICK-REFERENCE.md

## 🎉 Success!

Nếu tất cả verification pass, database đã sẵn sàng!

Bạn có thể:
- ✅ Tạo user profiles
- ✅ Tạo và quản lý CVs
- ✅ Phân tích JD
- ✅ Generate ATS suggestions
- ✅ Track applied suggestions
- ✅ Score CVs

Happy coding! 🚀
