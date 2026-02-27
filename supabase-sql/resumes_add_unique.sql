-- If the resumes table already exists but is missing the unique constraint on job_id,
-- run this instead of resumes.sql.

ALTER TABLE resumes
  ADD CONSTRAINT resumes_job_id_key UNIQUE (job_id);
