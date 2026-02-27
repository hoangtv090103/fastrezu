# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use **Bun** (preferred over npm):

```bash
bun dev        # Development server with Turbopack
bun run build  # Production build
bun run lint   # ESLint
bun run start  # Production server
```

No automated test suite — validation is manual/E2E.

## Tech Stack

- **Next.js 15** with App Router, React 19, TypeScript 5, Tailwind CSS 4
- **Supabase** (PostgreSQL + Auth + RLS + Storage)
- **OpenAI API** for AI features (with Gemini fallback via OpenAI-compatible endpoint)
- **BlockNote** rich-text editor (outputs Markdown for ATS analysis)
- **Resend** for email, **Vercel Analytics** for usage tracking

## Architecture

### App Router Layout

```
src/app/
├── (authenticated)/        # Route group — all routes require auth
│   ├── dashboard/          # CV list dashboard
│   ├── dashboard/vault/    # The Vault (EPIC 2): reusable career data
│   └── editor/[cvId]/      # CV editor
├── api/                    # API Routes
│   ├── ai/                 # AI endpoints (analyze-jd, improve-bullet, score-cv, etc.)
│   ├── cv/                 # CV CRUD + apply-suggestion
│   ├── vault/              # Vault-specific APIs
│   └── jd/                 # Job Description analysis
└── auth/                   # Supabase auth callback/confirm routes
```

### Key Source Directories

| Path | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Browser Supabase client |
| `src/lib/supabase-server.ts` | Server Supabase client |
| `src/lib/openai.ts` | OpenAI API wrapper |
| `src/lib/prompts.ts` | All AI system prompts (bilingual VI/EN) |
| `src/lib/validation-schemas.ts` | Zod schemas for request validation |
| `src/contexts/` | CVEditorContext (CV editor state), LanguageContext (i18n) |
| `src/hooks/` | Custom hooks: useTranslation, useMediaQuery, useTypingEffect |
| `src/dictionaries/` | i18n JSON files: `vi.json`, `en.json` |
| `src/types/database.types.ts` | Generated Supabase types |
| `supabase-sql/` | Schema + migration SQL files |
| `docs/spec/STORIES.md` | Detailed user stories and acceptance criteria |

### Data Flow Pattern

Server Actions are used for The Vault writes (avoids API routes for form submissions):

```
Client Component → Server Action (actions.ts) → Supabase → revalidatePath()
```

API Routes are used for AI operations (longer-running, need streaming/error handling):

```
Client → fetch('/api/ai/...') → OpenAI API → JSON response
```

## Supabase Auth — Critical Rules

**ALWAYS** use `@supabase/ssr` with `getAll`/`setAll`. **NEVER** use `@supabase/auth-helpers-nextjs` or individual `get`/`set`/`remove` cookie methods.

**Browser client** (`src/lib/supabase.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server client** (`src/lib/supabase-server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* ignore in Server Components */ }
        },
      },
    }
  )
}
```

## Database Schema

Core tables and their purposes:

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `user_profiles` | id, email, subscription_tier | Extends Supabase auth.users |
| `cvs` | id, user_id, title, language, ats_score | CV metadata |
| `cv_sections` | cv_id, section_type, order_index, data (JSONB) | Flexible CV content |
| `master_profiles` | user_id, section_type, content (JSONB) | **The Vault** — UNIQUE(user_id, section_type) |
| `vault_settings` | user_id, enabled_sections (JSON) | UNIQUE(user_id) |
| `jd_analyses` | cv_id, jd_text, keywords_extracted | Job description analysis results |
| `ats_suggestions` | cv_id, suggestion_type, target_section, is_applied | ATS improvement suggestions |

RLS is enabled on all user-data tables. Use `upsert` with conflict targets for `master_profiles` and `vault_settings`.

## The Vault Feature (EPIC 2)

The Vault (`/dashboard/vault`) is a reusable career database — users enter career data once and reuse it across CVs.

**Always-visible sections:** personal, summary, experience, education, skills

**Optional sections** (toggled via AddSectionDropdown): projects, certifications

Each section maps to a row in `master_profiles` with `section_type` as the discriminator. The `vault_settings` table tracks which optional sections are enabled per user.

## Internationalization

The app supports Vietnamese and English. UI language is controlled by `LanguageContext`. Use the `useTranslation` hook to get translated strings from `src/dictionaries/`. AI prompts in `src/lib/prompts.ts` include bilingual system prompts.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_SITE_URL
```

## Next.js Config Notes

- React Strict Mode is **disabled** (BlockNote compatibility requirement)
- `reactStrictMode: false` in `next.config.ts` — do not re-enable without testing BlockNote
