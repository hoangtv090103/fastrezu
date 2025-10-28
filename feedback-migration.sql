-- Migration: Add feedback table for user feedback system
-- Run this in your Supabase SQL editor

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'praise')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback
-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create feedback (even without being logged in)
CREATE POLICY "Users can create feedback" ON feedback
    FOR INSERT WITH CHECK (true);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON feedback TO authenticated;
GRANT SELECT, INSERT ON feedback TO anon;

-- Service role permissions (for API routes)
GRANT ALL ON feedback TO service_role;

-- Add comment for documentation
COMMENT ON TABLE feedback IS 'Stores user feedback including bug reports, feature requests, and general comments';
COMMENT ON COLUMN feedback.feedback_type IS 'Type of feedback: bug_report, feature_request, general_feedback, praise';
COMMENT ON COLUMN feedback.priority IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN feedback.status IS 'Status: open, in_progress, resolved, closed';
COMMENT ON COLUMN feedback.metadata IS 'Additional metadata like browser info, page URL, etc.';

