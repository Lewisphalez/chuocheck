-- ============================================
-- PHASE 1: Profile Picture Upload Support
-- ============================================

-- Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatar storage
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- PHASE 2: Class Archive Feature
-- ============================================

-- Add archived columns to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for archived classes
CREATE INDEX IF NOT EXISTS idx_classes_archived ON classes(archived, lecturer_id);

-- ============================================
-- PHASE 2: Manual Attendance Override Enhancement
-- ============================================

-- Add index for attendance_adjustments (table already exists)
CREATE INDEX IF NOT EXISTS idx_attendance_adjustments_session ON attendance_adjustments(session_id);

-- ============================================
-- PHASE 3: Attendance Goals
-- ============================================

-- Create attendance_goals table
CREATE TABLE IF NOT EXISTS attendance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  target_percentage NUMERIC NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('overall', 'class')),
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_id, goal_type)
);

-- RLS policies for attendance_goals
ALTER TABLE attendance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own goals"
ON attendance_goals FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_goals_student ON attendance_goals(student_id, achieved);

-- ============================================
-- PHASE 3: Activity Log / Recent Activity Feed
-- ============================================

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policy for activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
ON activity_log FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log(user_id, created_at DESC);

-- ============================================
-- PHASE 3: Student Leaderboard
-- ============================================

-- Create leaderboard view for better performance
CREATE OR REPLACE VIEW student_leaderboard AS
SELECT 
  gp.student_id,
  p.full_name,
  p.avatar_url,
  gp.points,
  gp.level,
  gp.rank,
  COUNT(DISTINCT sb.badge_id) as badge_count,
  ROW_NUMBER() OVER (ORDER BY gp.points DESC) as global_rank
FROM gamification_points gp
JOIN profiles p ON p.id = gp.student_id
LEFT JOIN student_badges sb ON sb.student_id = gp.student_id
GROUP BY gp.student_id, p.full_name, p.avatar_url, gp.points, gp.level, gp.rank;

-- Grant select permission on view
GRANT SELECT ON student_leaderboard TO authenticated;