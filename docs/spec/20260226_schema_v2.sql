-- EPIC 1: Nền tảng & Cơ sở dữ liệu (The Foundation)
-- Khởi tạo Database Schema V2 & RLS cho FastRezu

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    subscription_tier text DEFAULT 'free' CHECK (
        subscription_tier IN ('free', 'sprint_pass')
    ),
    credits integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Create master_profiles table (The Vault)
CREATE TABLE IF NOT EXISTS public.master_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    section_type text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create jobs table (The War Room)
CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    title text NOT NULL,
    company_name text NOT NULL,
    job_url text,
    raw_jd_text text,
    status text DEFAULT 'saved' CHECK (
        status IN (
            'saved',
            'analyzing',
            'optimized',
            'applied',
            'interviewing',
            'rejected',
            'offer'
        )
    ),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Create job_analyses table (The Intel)
CREATE TABLE IF NOT EXISTS public.job_analyses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    job_id uuid NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE UNIQUE,
    keywords_required text [] DEFAULT '{}',
    match_score integer DEFAULT 0 CHECK (
        match_score >= 0
        AND match_score <= 100
    ),
    gap_analysis text,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Create resumes table (The Tailor)
CREATE TABLE IF NOT EXISTS public.resumes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    job_id uuid NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
    content_snapshot jsonb DEFAULT '{}'::jsonb,
    ats_score_final integer,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.master_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
    USING (auth.uid () = id);

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
WITH
    CHECK (auth.uid () = id);

-- master_profiles
CREATE POLICY "Users can manage their master profiles" ON public.master_profiles FOR ALL USING (auth.uid () = user_id);

-- jobs
CREATE POLICY "Users can manage their jobs" ON public.jobs FOR ALL USING (auth.uid () = user_id);

-- job_analyses
CREATE POLICY "Users can manage analyses for their jobs" ON public.job_analyses FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.jobs j
        WHERE
            j.id = public.job_analyses.job_id
            AND j.user_id = auth.uid ()
    )
);

-- resumes
CREATE POLICY "Users can manage resumes for their jobs" ON public.resumes FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.jobs j
        WHERE
            j.id = public.resumes.job_id
            AND j.user_id = auth.uid ()
    )
);