# Archive

Folder này chứa các file SQL cũ đã được thay thế bởi schema mới.

## ⚠️ Warning

**Các file trong folder này chỉ để tham khảo. KHÔNG nên sử dụng cho production.**

Sử dụng file `v1.0.0-schema.sql` ở folder cha thay thế.

## Files

### Legacy Schema Files
- `supabase-schema.sql` - Schema cũ cho subscribers
- `supabase-schema-mvp.sql` - Schema MVP cũ
- `schema.sql` - Schema tổng hợp cũ

### Old Migration Files
- `add-ats-analysis-migration.sql` - Migration cũ cho ATS analysis
- `add-language-field-migration.sql` - Migration cũ cho language field
- `feedback-migration.sql` - Migration cũ cho feedback
- `feedback-attachments-migration.sql` - Migration cũ cho feedback attachments
- `setup-storage.sql` - Storage setup cũ

## Migration Path

Nếu bạn đang sử dụng schema cũ:

1. **Backup database hiện tại**
   ```bash
   pg_dump -h host -U user -d database > backup-before-v1.0.0.sql
   ```

2. **Review changes**
   - So sánh schema cũ với `v1.0.0-schema.sql`
   - Identify breaking changes
   - Plan data migration if needed

3. **Test on staging**
   - Deploy v1.0.0 schema on staging
   - Test all features
   - Verify data integrity

4. **Deploy to production**
   - Run `v1.0.0-schema.sql`
   - Verify deployment
   - Monitor for issues

## Why Archived?

Các file này được archive vì:
- ❌ Không có version control rõ ràng
- ❌ Thiếu documentation
- ❌ Không có migration strategy
- ❌ Duplicate/conflicting schemas
- ❌ Không có rollback plan

## New Structure

Schema mới (`v1.0.0-schema.sql`) có:
- ✅ Version control rõ ràng
- ✅ Documentation đầy đủ
- ✅ Migration strategy
- ✅ Consolidated schema
- ✅ Rollback support
- ✅ Best practices

## Need Old Schema?

Nếu cần reference schema cũ:
1. Check files trong folder này
2. Review git history
3. Contact team lead

## Cleanup

Sau khi migrate thành công sang v1.0.0, có thể xóa folder này:

```bash
rm -rf supabase-sql/archive
```

---

**Archived Date:** 2025-10-29  
**Replaced By:** v1.0.0-schema.sql
