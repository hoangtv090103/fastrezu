-- Story 6.4: CV Scan History
-- Run this migration in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS cv_scan_history (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name        TEXT        NOT NULL,
  overall_score    INT,
  ats_score        INT,
  design_score     INT,
  evaluation       JSONB       NOT NULL,
  extracted_profile JSONB      NOT NULL,
  scanned_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cv_scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scan history"
  ON cv_scan_history FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_cv_scan_history_user_scanned
  ON cv_scan_history(user_id, scanned_at DESC);
