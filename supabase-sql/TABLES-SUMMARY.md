# FastRezu Database Tables Summary

## Overview
FastRezu database schema v1.0.0 contains **8 core tables** organized into 3 main functional groups.

---

## 📋 Table Groups

### 1. Core CV Management (5 tables)
Tables for managing user profiles and CV documents with ATS optimization.

#### `user_profiles`
- Extends Supabase Auth users
- Stores user profile information
- Subscription tier management
- **Key fields**: `id`, `email`, `full_name`, `subscription_tier`

#### `cvs`
- Stores CV documents
- Links to user profiles
- Tracks ATS score and language
- **Key fields**: `id`, `user_id`, `title`, `language`, `ats_score`, `is_active`

#### `cv_sections`
- Stores CV content sections with flexible JSONB structure
- Supports multiple section types (personal_info, summary, experience, etc.)
- **Key fields**: `id`, `cv_id`, `section_type`, `order_index`, `data`
- **Section types**: 
  - `personal_info`
  - `summary`
  - `experience`
  - `education`
  - `projects`
  - `skills`
  - `certifications`
  - `ats_analysis`

#### `jd_analyses`
- Stores job description analysis results
- Extracted keywords and analysis data
- **Key fields**: `id`, `cv_id`, `jd_text`, `keywords_extracted`, `analysis_result`

#### `ats_suggestions`
- AI-generated suggestions for CV optimization
- Tracks suggestion status (active/applied)
- **Key fields**: `id`, `cv_id`, `suggestion_id`, `suggestion_text`, `suggestion_type`, `priority`, `is_active`, `is_applied`
- **Suggestion types**: `add_keyword`, `improve_bullet`, `add_section`, `enhance_content`
- **Priority levels**: `high`, `medium`, `low`

---

### 2. Landing Page & Marketing (1 table)

#### `subscribers`
- Email collection for landing page
- Subscription status tracking
- **Key fields**: `id`, `email`, `status`, `source`, `metadata`
- **Status values**: `pending`, `confirmed`, `unsubscribed`
- **Sources**: `landing_page`, `footer`, etc.

---

### 3. User Feedback System (2 tables)

#### `feedback`
- User feedback collection (bugs, features, praise)
- Priority and status tracking
- Supports both authenticated and anonymous users
- **Key fields**: `id`, `user_id`, `user_email`, `feedback_type`, `subject`, `message`, `priority`, `status`
- **Feedback types**: `bug_report`, `feature_request`, `general_feedback`, `praise`
- **Priority levels**: `low`, `medium`, `high`, `critical`
- **Status values**: `open`, `in_progress`, `resolved`, `closed`

#### `feedback_attachments`
- Stores screenshots and images for feedback
- Links to feedback records
- **Key fields**: `id`, `feedback_id`, `file_name`, `file_path`, `file_type`, `uploaded_by`
- **Supported file types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

---

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

- **User-scoped access**: Users can only access their own data
- **Public insert**: Subscribers and feedback allow anonymous submissions
- **Service role**: Full access for admin operations

### Key Security Policies

#### CV Management Tables
- Users can CRUD their own CVs and sections
- Users can view/create/update their own JD analyses
- Users can manage their own ATS suggestions

#### Subscribers Table
- Public: INSERT only (for landing page)
- Service role: Full access

#### Feedback Tables
- Public: INSERT (anonymous feedback allowed)
- Users: Can view/update their own feedback
- Users: Can upload/delete their own attachments

---

## 📊 Indexes

### Performance Optimization
Strategic indexes on frequently queried columns:

- Email lookups (user_profiles, subscribers)
- User-CV relationships
- Section type filtering
- Status/priority filtering (feedback)
- Timestamp-based queries
- Composite indexes for suggestion filtering

---

## 🔄 Triggers

### Auto-update Timestamps
Tables with `updated_at` auto-update:
- `user_profiles`
- `cvs`
- `cv_sections`
- `subscribers`
- `feedback`

---

## 📝 Data Types

### JSONB Fields
Flexible schema using JSONB:
- `cv_sections.data` - Section content
- `jd_analyses.analysis_result` - Analysis data
- `ats_suggestions.original_content` - Before state
- `ats_suggestions.suggested_content` - After state
- `subscribers.metadata` - Additional tracking data
- `feedback.metadata` - Browser/page info

### Arrays
- `jd_analyses.keywords_extracted` - TEXT[]

---

## 🌍 Multi-language Support

Language fields support:
- `vi` (Vietnamese)
- `en` (English)

Applied to:
- `cvs.language` - CV language
- All AI-generated content

---

## 📈 Future Enhancements

Planned additions:
- User preferences table
- CV templates table
- Analytics/metrics table
- Notification system
- Team collaboration features

---

## 📚 Documentation

For detailed information:
- See `v1.0.0-schema.sql` for complete SQL definitions
- See `CHANGELOG.md` for version history
- See `README.md` for setup instructions
- See `QUICK-REFERENCE.md` for common queries

---

**Last updated**: 2025-11-07  
**Schema version**: 1.0.0  
**Total tables**: 8
