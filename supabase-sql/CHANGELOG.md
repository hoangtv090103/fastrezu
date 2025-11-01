# Changelog

All notable changes to the database schema will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-29

### Added
- Initial complete database schema
- **user_profiles** table extending Supabase Auth
- **cvs** table for CV documents
- **cv_sections** table with JSONB structure
- **jd_analyses** table for job description analysis
- **ats_suggestions** table for AI-generated suggestions
- **applied_suggestions** table for tracking applied suggestions
- Row Level Security (RLS) policies for all tables
- Optimized indexes for performance
- Auto-update timestamp triggers
- Foreign key constraints
- Check constraints for data validation
- Comprehensive documentation comments

### Features
- Suggestion tracking system with `is_active` and `is_applied` flags
- Version control for suggestions (old suggestions marked inactive on re-score)
- Applied history tracking
- Multi-language support (vi/en)
- Priority levels for suggestions (high/medium/low)

### Security
- RLS enabled on all tables
- User-scoped policies for data access
- Service role permissions for admin operations

### Performance
- Composite indexes on frequently queried columns
- Optimized indexes for suggestion filtering
- Efficient foreign key relationships

## [Unreleased]

### Planned
- User preferences table
- CV templates table
- Analytics/metrics table
- Notification system
- Team collaboration features

---

## Version History

### v1.0.0 (2025-10-29)
- Initial release with complete schema
- Full ATS suggestion tracking system
- RLS and security policies
- Performance optimizations

---

## Migration Notes

### From Legacy Schema to v1.0.0

If migrating from older schema files:

1. **Backup existing data**
   ```sql
   -- Backup all data
   pg_dump -h your-host -U postgres -d your-db > backup-before-v1.0.0.sql
   ```

2. **Run migration in order**
   - Create new tables (ats_suggestions, applied_suggestions)
   - Add new columns (is_active, is_applied)
   - Create indexes
   - Set up RLS policies

3. **Verify data integrity**
   ```sql
   -- Check all tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Check RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

4. **Test application**
   - Test CV creation
   - Test suggestion generation
   - Test suggestion application
   - Test re-scoring flow

### Breaking Changes
None - this is the initial versioned release.

### Deprecations
None

---

## Support

For issues or questions about schema changes:
1. Check the README.md for usage instructions
2. Review the schema file for table structures
3. Test changes on staging before production
4. Always backup before major changes
