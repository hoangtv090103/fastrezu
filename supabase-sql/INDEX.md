# FastRezu Database Documentation Index

Chỉ mục tài liệu database cho FastRezu.

## 📖 Documentation Files

### 🚀 Getting Started
- **[GETTING-STARTED.md](./GETTING-STARTED.md)** - Bắt đầu nhanh, setup database
  - Quick start guide
  - Verification steps
  - Troubleshooting
  - Security checklist

### 📘 Main Documentation
- **[README.md](./README.md)** - Tài liệu chính
  - Cấu trúc folder
  - Version history
  - Migration strategy
  - Best practices
  - Backup instructions

### 📝 Reference
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Tham khảo nhanh
  - Tables overview
  - Common queries
  - Indexes list
  - RLS policies
  - Maintenance commands
  - Performance tips

### 📋 Changelog
- **[CHANGELOG.md](./CHANGELOG.md)** - Lịch sử thay đổi
  - Version history
  - Breaking changes
  - Migration notes
  - Deprecations

## 📁 Schema Files

### Current Version
- **[v1.0.0-schema.sql](./v1.0.0-schema.sql)** - Schema đầy đủ version 1.0.0
  - 7 tables
  - All indexes
  - RLS policies
  - Triggers
  - Comments

### Migrations
- **[migrations/](./migrations/)** - Folder chứa migration files
  - [2025-10-29-01-add-applied-suggestions-table.sql](./migrations/2025-10-29-01-add-applied-suggestions-table.sql)
  - [2025-10-29-02-add-is-active-columns.sql](./migrations/2025-10-29-02-add-is-active-columns.sql)
  - [2025-10-29-03-add-ats-suggestions-table.sql](./migrations/2025-10-29-03-add-ats-suggestions-table.sql)
  - [migrations/README.md](./migrations/README.md) - Migration guide

## 🗂️ Database Structure

### Tables (6)
1. **user_profiles** - User information
2. **cvs** - CV documents
3. **cv_sections** - CV content (JSONB)
4. **jd_analyses** - Job description analysis
5. **ats_suggestions** - AI-generated suggestions
6. **applied_suggestions** - Applied suggestions tracking

### Key Features
- ✅ Row Level Security (RLS)
- ✅ Optimized indexes
- ✅ Auto-update timestamps
- ✅ Foreign key constraints
- ✅ Check constraints
- ✅ Comprehensive documentation

## 🎯 Quick Links

### For Developers
- [Setup Database](./GETTING-STARTED.md#-quick-start)
- [Common Queries](./QUICK-REFERENCE.md#common-queries)
- [Troubleshooting](./GETTING-STARTED.md#-troubleshooting)

### For DBAs
- [Migration Strategy](./README.md#migration-strategy)
- [Backup Instructions](./README.md#backup-database)
- [Performance Tips](./QUICK-REFERENCE.md#performance-tips)
- [Maintenance](./QUICK-REFERENCE.md#maintenance)

### For DevOps
- [Deploy Schema](./GETTING-STARTED.md#option-1-deploy-full-schema-khuyên-dùng)
- [Rollback](./README.md#rollback)
- [Security Checklist](./GETTING-STARTED.md#-security-checklist)

## 📊 Version Information

**Current Version:** v1.0.0  
**Release Date:** 2025-10-29  
**Status:** Stable  

**Compatibility:**
- PostgreSQL: 14+
- Supabase: Latest
- Node.js: 18+

## 🔍 Search Guide

### Tìm thông tin về...

**Tables:**
- Structure → [v1.0.0-schema.sql](./v1.0.0-schema.sql)
- Overview → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md#tables-overview)

**Queries:**
- Common queries → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md#common-queries)
- Performance → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md#performance-tips)

**Security:**
- RLS Policies → [v1.0.0-schema.sql](./v1.0.0-schema.sql) (search "RLS")
- Checklist → [GETTING-STARTED.md](./GETTING-STARTED.md#-security-checklist)

**Migrations:**
- How to run → [migrations/README.md](./migrations/README.md)
- History → [CHANGELOG.md](./CHANGELOG.md)

**Troubleshooting:**
- Common issues → [GETTING-STARTED.md](./GETTING-STARTED.md#-troubleshooting)
- Maintenance → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md#maintenance)

## 📞 Support

Nếu không tìm thấy thông tin cần thiết:

1. Check [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) cho queries
2. Review [GETTING-STARTED.md](./GETTING-STARTED.md) cho setup
3. Read [README.md](./README.md) cho best practices
4. Check [CHANGELOG.md](./CHANGELOG.md) cho version history

## 🔄 Updates

Khi có version mới:
1. Check [CHANGELOG.md](./CHANGELOG.md) cho changes
2. Review migration files trong [migrations/](./migrations/)
3. Follow [README.md](./README.md#migration-strategy)

---

**Last Updated:** 2025-10-29  
**Version:** 1.0.0  
**Maintainer:** FastRezu Team
