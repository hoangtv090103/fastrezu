# Quick Reference

Tài liệu tham khảo nhanh cho database schema.

## Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_profiles` | User info | id, email, subscription_tier |
| `cvs` | CV documents | id, user_id, ats_score |
| `cv_sections` | CV content | cv_id, section_type, data |
| `jd_analyses` | JD analysis | cv_id, keywords_extracted |
| `ats_suggestions` | AI suggestions | cv_id, is_active, is_applied |
| `applied_suggestions` | Applied history | cv_id, suggestion_id |

## Common Queries

### Get active suggestions for a CV
```sql
SELECT * FROM ats_suggestions
WHERE cv_id = 'your-cv-id'
  AND is_active = true
ORDER BY priority DESC, created_at ASC;
```

### Get unapplied suggestions
```sql
SELECT * FROM ats_suggestions
WHERE cv_id = 'your-cv-id'
  AND is_active = true
  AND is_applied = false;
```

### Get user's CVs with scores
```sql
SELECT c.id, c.title, c.ats_score, c.created_at
FROM cvs c
JOIN user_profiles u ON c.user_id = u.id
WHERE u.id = auth.uid()
ORDER BY c.created_at DESC;
```

### Get CV with all sections
```sql
SELECT 
  c.id,
  c.title,
  c.ats_score,
  json_object_agg(s.section_type, s.data) as sections
FROM cvs c
LEFT JOIN cv_sections s ON c.cv_id = s.cv_id
WHERE c.id = 'your-cv-id'
GROUP BY c.id;
```

### Count suggestions by status
```sql
SELECT 
  is_active,
  is_applied,
  COUNT(*) as count
FROM ats_suggestions
WHERE cv_id = 'your-cv-id'
GROUP BY is_active, is_applied;
```

## Indexes

### Most Important Indexes
```sql
-- For CV queries
idx_cvs_user_id (user_id)
idx_cvs_created_at (created_at)

-- For suggestions
idx_ats_suggestions_is_active (cv_id, is_active)
idx_ats_suggestions_is_applied (cv_id, is_applied, is_active)

-- For sections
idx_cv_sections_cv_id (cv_id)
```

## RLS Policies

### Check if RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### View policies for a table
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'ats_suggestions';
```

### Test RLS as user
```sql
-- Switch to user role
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';

-- Run query
SELECT * FROM cvs;

-- Reset
RESET ROLE;
```

## Maintenance

### Vacuum tables
```sql
VACUUM ANALYZE ats_suggestions;
VACUUM ANALYZE applied_suggestions;
```

### Check table sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check index usage
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Troubleshooting

### Check for missing indexes
```sql
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan as avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;
```

### Find slow queries
```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Check locks
```sql
SELECT 
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

## Data Cleanup

### Deactivate old suggestions
```sql
UPDATE ats_suggestions
SET is_active = false
WHERE cv_id = 'your-cv-id'
  AND is_active = true;
```

### Delete old inactive suggestions (older than 30 days)
```sql
DELETE FROM ats_suggestions
WHERE is_active = false
  AND created_at < NOW() - INTERVAL '30 days';
```

### Archive old CVs
```sql
UPDATE cvs
SET is_active = false
WHERE updated_at < NOW() - INTERVAL '90 days'
  AND is_active = true;
```

## Performance Tips

1. **Use indexes wisely**
   - Composite indexes for common WHERE clauses
   - Index on foreign keys
   - Index on frequently sorted columns

2. **Optimize JSONB queries**
   ```sql
   -- Use GIN index for JSONB
   CREATE INDEX idx_cv_sections_data ON cv_sections USING GIN (data);
   
   -- Query JSONB efficiently
   SELECT * FROM cv_sections 
   WHERE data @> '{"skills": ["Python"]}';
   ```

3. **Batch operations**
   ```sql
   -- Use COPY for bulk inserts
   COPY ats_suggestions FROM '/path/to/file.csv' CSV HEADER;
   ```

4. **Use EXPLAIN ANALYZE**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM ats_suggestions
   WHERE cv_id = 'your-cv-id' AND is_active = true;
   ```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Policies tested for each role
- [ ] Foreign keys properly set
- [ ] Sensitive data encrypted
- [ ] Service role permissions limited
- [ ] Audit logging enabled (if needed)

## Backup Commands

```bash
# Full backup
pg_dump -h host -U user -d database > backup.sql

# Schema only
pg_dump -h host -U user -d database --schema-only > schema.sql

# Data only
pg_dump -h host -U user -d database --data-only > data.sql

# Specific table
pg_dump -h host -U user -d database -t ats_suggestions > ats_suggestions.sql

# Restore
psql -h host -U user -d database < backup.sql
```
