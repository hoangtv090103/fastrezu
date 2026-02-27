-- Story 5.1: Tailored Resumes
-- Run this migration in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS resumes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_snapshot  JSONB       NOT NULL,
  ats_score_final   INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One tailored resume per job (upsert target)
  CONSTRAINT resumes_job_id_key UNIQUE (job_id)
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resumes"
  ON resumes FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_job_id   ON resumes(job_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id  ON resumes(user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_resumes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resumes_updated_at ON resumes;
CREATE TRIGGER trg_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_resumes_updated_at();
