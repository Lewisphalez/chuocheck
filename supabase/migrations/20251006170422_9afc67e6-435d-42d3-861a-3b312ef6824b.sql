-- Phase 1: Location Verification & Geofencing
ALTER TABLE attendance_sessions
ADD COLUMN location_required boolean DEFAULT false,
ADD COLUMN classroom_latitude decimal(10, 8),
ADD COLUMN classroom_longitude decimal(11, 8),
ADD COLUMN geofence_radius_meters integer DEFAULT 100,
ADD COLUMN allow_location_override boolean DEFAULT false;

ALTER TABLE attendance_records
ADD COLUMN student_latitude decimal(10, 8),
ADD COLUMN student_longitude decimal(11, 8),
ADD COLUMN distance_from_classroom decimal(10, 2),
ADD COLUMN location_verified boolean DEFAULT false,
ADD COLUMN location_override_by uuid REFERENCES profiles(id),
ADD COLUMN location_override_reason text;

CREATE TABLE classroom_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  default_radius_meters integer DEFAULT 100,
  building text,
  room_number text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Phase 2: Push Notifications System
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL UNIQUE,
  session_reminders boolean DEFAULT true,
  session_starting_minutes integer DEFAULT 5,
  missed_class_alerts boolean DEFAULT true,
  low_attendance_warnings boolean DEFAULT true,
  weekly_summary boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  action_url text,
  session_id uuid REFERENCES attendance_sessions(id),
  class_id uuid REFERENCES classes(id),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  endpoint text UNIQUE NOT NULL,
  keys_p256dh text NOT NULL,
  keys_auth text NOT NULL,
  device_info jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Phase 4: Student Attendance Patterns & Insights
CREATE TABLE attendance_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) NOT NULL,
  class_id uuid REFERENCES classes(id) NOT NULL,
  total_sessions integer DEFAULT 0,
  attended_sessions integer DEFAULT 0,
  attendance_percentage decimal(5, 2) DEFAULT 0,
  streak_current integer DEFAULT 0,
  streak_longest integer DEFAULT 0,
  last_attended timestamp with time zone,
  at_risk boolean DEFAULT false,
  trend text CHECK (trend IN ('improving', 'declining', 'stable')),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, class_id)
);

CREATE TABLE attendance_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) NOT NULL,
  class_id uuid REFERENCES classes(id) NOT NULL,
  streak_start timestamp with time zone NOT NULL,
  streak_end timestamp with time zone,
  streak_length integer NOT NULL,
  is_active boolean DEFAULT true
);

-- Phase 5: Lecturer Attendance Management
CREATE TABLE attendance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid REFERENCES attendance_records(id),
  session_id uuid REFERENCES attendance_sessions(id) NOT NULL,
  student_id uuid REFERENCES profiles(id) NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('manual_add', 'manual_remove', 'late_arrival', 'early_departure')),
  reason text NOT NULL,
  adjusted_by uuid REFERENCES profiles(id) NOT NULL,
  original_status text,
  new_status text NOT NULL,
  adjusted_at timestamp with time zone DEFAULT now(),
  approved boolean DEFAULT true
);

CREATE TABLE attendance_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES attendance_sessions(id) NOT NULL,
  student_id uuid REFERENCES profiles(id) NOT NULL,
  reason text NOT NULL,
  evidence_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone
);

ALTER TABLE attendance_records
ADD COLUMN arrival_status text CHECK (arrival_status IN ('on_time', 'late', 'very_late')),
ADD COLUMN minutes_late integer,
ADD COLUMN manually_added boolean DEFAULT false,
ADD COLUMN notes text;

-- Phase 6: Enhanced Class Management
CREATE TABLE class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) NOT NULL,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  recurring boolean DEFAULT true,
  effective_from date NOT NULL,
  effective_until date
);

CREATE TABLE class_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

CREATE TABLE teaching_assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) NOT NULL,
  assistant_id uuid REFERENCES profiles(id) NOT NULL,
  permissions jsonb DEFAULT '{"canStartSessions": true, "canEditRoster": false, "canViewReports": true}'::jsonb,
  added_by uuid REFERENCES profiles(id) NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(class_id, assistant_id)
);

ALTER TABLE classes
ADD COLUMN capacity integer,
ADD COLUMN location text,
ADD COLUMN schedule_notes text,
ADD COLUMN syllabus_url text;

-- Phase 7: Advanced Reporting & Analytics
CREATE TABLE scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) NOT NULL,
  report_type text NOT NULL,
  class_ids uuid[],
  frequency text CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week integer,
  time time,
  format text CHECK (format IN ('pdf', 'csv', 'excel')),
  email_to text[],
  last_sent timestamp with time zone,
  active boolean DEFAULT true
);

CREATE TABLE report_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id uuid REFERENCES scheduled_reports(id),
  generated_by uuid REFERENCES profiles(id) NOT NULL,
  report_type text NOT NULL,
  file_url text,
  parameters jsonb,
  generated_at timestamp with time zone DEFAULT now()
);

-- Phase 8: Session Enhancements
CREATE TABLE session_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  duration_minutes integer NOT NULL,
  location_required boolean DEFAULT false,
  qr_refresh_seconds integer DEFAULT 0,
  grace_period_minutes integer DEFAULT 0,
  max_scans_per_student integer DEFAULT 1,
  allow_late_entry boolean DEFAULT true,
  late_penalty_percentage integer,
  bonus_points integer,
  settings jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE session_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES attendance_sessions(id) NOT NULL,
  checkpoint_number integer NOT NULL,
  checkpoint_time timestamp with time zone NOT NULL,
  qr_code text NOT NULL,
  scans_count integer DEFAULT 0
);

ALTER TABLE attendance_sessions
ADD COLUMN qr_refresh_interval integer DEFAULT 0,
ADD COLUMN grace_period_minutes integer DEFAULT 0,
ADD COLUMN template_id uuid REFERENCES session_templates(id),
ADD COLUMN multiple_checkpoints boolean DEFAULT false,
ADD COLUMN bonus_attendance boolean DEFAULT false,
ADD COLUMN attendance_value decimal(3, 1) DEFAULT 1.0;

-- Phase 10: Admin Dashboard
CREATE TABLE system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  total_users integer DEFAULT 0,
  active_users_today integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  active_sessions integer DEFAULT 0,
  total_scans_today integer DEFAULT 0,
  avg_session_duration decimal(10, 2),
  system_uptime interval,
  error_count integer DEFAULT 0,
  recorded_at timestamp with time zone DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now()
);

CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  category text CHECK (category IN ('security', 'attendance', 'notifications', 'general')),
  description text,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamp with time zone DEFAULT now()
);

-- Phase 11: Achievement Badges & Study Groups
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  tier text CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  criteria jsonb NOT NULL,
  points integer DEFAULT 0,
  rarity text CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

CREATE TABLE student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) NOT NULL,
  badge_id uuid REFERENCES badges(id) NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  class_id uuid REFERENCES classes(id),
  context jsonb,
  UNIQUE(student_id, badge_id, class_id)
);

CREATE TABLE study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) NOT NULL,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  max_members integer DEFAULT 6,
  meeting_schedule jsonb,
  is_public boolean DEFAULT true,
  attendance_threshold decimal(5, 2),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES study_groups(id) NOT NULL,
  student_id uuid REFERENCES profiles(id) NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at timestamp with time zone DEFAULT now(),
  attendance_rate decimal(5, 2),
  UNIQUE(group_id, student_id)
);

CREATE TABLE gamification_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) NOT NULL UNIQUE,
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  rank text DEFAULT 'Novice',
  last_updated timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE classroom_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classroom_locations
CREATE POLICY "Lecturers can manage their classroom locations"
ON classroom_locations FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Everyone can view classroom locations"
ON classroom_locations FOR SELECT
USING (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences"
ON notification_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
ON push_subscriptions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for attendance_patterns
CREATE POLICY "Students can view their own attendance patterns"
ON attendance_patterns FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view attendance patterns for their classes"
ON attendance_patterns FOR SELECT
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = attendance_patterns.class_id AND classes.lecturer_id = auth.uid()
));

-- RLS Policies for attendance_streaks
CREATE POLICY "Students can view their own streaks"
ON attendance_streaks FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view streaks for their classes"
ON attendance_streaks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = attendance_streaks.class_id AND classes.lecturer_id = auth.uid()
));

-- RLS Policies for attendance_adjustments
CREATE POLICY "Lecturers can manage attendance adjustments for their sessions"
ON attendance_adjustments FOR ALL
USING (EXISTS (
  SELECT 1 FROM attendance_sessions WHERE attendance_sessions.id = attendance_adjustments.session_id AND attendance_sessions.lecturer_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM attendance_sessions WHERE attendance_sessions.id = attendance_adjustments.session_id AND attendance_sessions.lecturer_id = auth.uid()
));

CREATE POLICY "Students can view adjustments for their own attendance"
ON attendance_adjustments FOR SELECT
USING (student_id = auth.uid());

-- RLS Policies for attendance_appeals
CREATE POLICY "Students can create and view their own appeals"
ON attendance_appeals FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Lecturers can view and review appeals for their sessions"
ON attendance_appeals FOR ALL
USING (EXISTS (
  SELECT 1 FROM attendance_sessions WHERE attendance_sessions.id = attendance_appeals.session_id AND attendance_sessions.lecturer_id = auth.uid()
));

-- RLS Policies for class_schedules
CREATE POLICY "Lecturers can manage schedules for their classes"
ON class_schedules FOR ALL
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = class_schedules.class_id AND classes.lecturer_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = class_schedules.class_id AND classes.lecturer_id = auth.uid()
));

CREATE POLICY "Students can view schedules for enrolled classes"
ON class_schedules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_enrollments WHERE student_enrollments.class_id = class_schedules.class_id AND student_enrollments.student_id = auth.uid()
));

-- RLS Policies for class_announcements
CREATE POLICY "Lecturers can manage announcements for their classes"
ON class_announcements FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Students can view announcements for enrolled classes"
ON class_announcements FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_enrollments WHERE student_enrollments.class_id = class_announcements.class_id AND student_enrollments.student_id = auth.uid()
));

-- RLS Policies for teaching_assistants
CREATE POLICY "Lecturers can manage TAs for their classes"
ON teaching_assistants FOR ALL
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = teaching_assistants.class_id AND classes.lecturer_id = auth.uid()
));

CREATE POLICY "TAs can view their own assignments"
ON teaching_assistants FOR SELECT
USING (assistant_id = auth.uid());

-- RLS Policies for scheduled_reports
CREATE POLICY "Lecturers can manage their own scheduled reports"
ON scheduled_reports FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- RLS Policies for report_archives
CREATE POLICY "Users can view reports they generated"
ON report_archives FOR SELECT
USING (generated_by = auth.uid());

-- RLS Policies for session_templates
CREATE POLICY "Lecturers can manage their own templates"
ON session_templates FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- RLS Policies for session_checkpoints
CREATE POLICY "Lecturers can manage checkpoints for their sessions"
ON session_checkpoints FOR ALL
USING (EXISTS (
  SELECT 1 FROM attendance_sessions WHERE attendance_sessions.id = session_checkpoints.session_id AND attendance_sessions.lecturer_id = auth.uid()
));

CREATE POLICY "Students can view active session checkpoints"
ON session_checkpoints FOR SELECT
USING (EXISTS (
  SELECT 1 FROM attendance_sessions WHERE attendance_sessions.id = session_checkpoints.session_id AND attendance_sessions.is_active = true
));

-- RLS Policies for admin tables (system_metrics, audit_logs, system_settings)
CREATE POLICY "Admins can manage system metrics"
ON system_metrics FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage system settings"
ON system_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for badges
CREATE POLICY "Everyone can view badges"
ON badges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage badges"
ON badges FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for student_badges
CREATE POLICY "Students can view their own badges"
ON student_badges FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view badges for students in their classes"
ON student_badges FOR SELECT
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = student_badges.class_id AND classes.lecturer_id = auth.uid()
));

-- RLS Policies for study_groups
CREATE POLICY "Students can create and manage their own study groups"
ON study_groups FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Students can view public study groups for their classes"
ON study_groups FOR SELECT
USING (is_public = true OR created_by = auth.uid() OR EXISTS (
  SELECT 1 FROM study_group_members WHERE study_group_members.group_id = study_groups.id AND study_group_members.student_id = auth.uid()
));

-- RLS Policies for study_group_members
CREATE POLICY "Students can join and view study groups they're in"
ON study_group_members FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Group creators can manage members"
ON study_group_members FOR ALL
USING (EXISTS (
  SELECT 1 FROM study_groups WHERE study_groups.id = study_group_members.group_id AND study_groups.created_by = auth.uid()
));

-- RLS Policies for gamification_points
CREATE POLICY "Students can view their own points"
ON gamification_points FOR SELECT
USING (student_id = auth.uid());

-- Insert some default badges
INSERT INTO badges (badge_key, name, description, icon, tier, criteria, points, rarity) VALUES
('first_scan', 'First Scan', 'Successfully scanned your first attendance', '🎉', 'bronze', '{"scans": 1}', 10, 'common'),
('streak_5', '5-Day Streak', 'Attended 5 consecutive classes', '🔥', 'bronze', '{"streak": 5}', 50, 'common'),
('streak_10', '10-Day Streak', 'Attended 10 consecutive classes', '🔥🔥', 'silver', '{"streak": 10}', 100, 'rare'),
('streak_30', '30-Day Streak', 'Attended 30 consecutive classes', '🔥🔥🔥', 'gold', '{"streak": 30}', 300, 'epic'),
('perfect_week', 'Perfect Week', 'Perfect attendance for 7 consecutive days', '⭐', 'silver', '{"perfect_days": 7}', 75, 'rare'),
('perfect_month', 'Perfect Month', 'Perfect attendance for 30 days', '🌟', 'gold', '{"perfect_days": 30}', 250, 'epic'),
('early_bird', 'Early Bird', 'Consistently scan within first 2 minutes', '🐦', 'silver', '{"early_scans": 10}', 80, 'rare'),
('never_late', 'Never Late', 'Zero late arrivals for entire semester', '⏰', 'gold', '{"late_count": 0, "min_sessions": 20}', 200, 'epic'),
('ninety_club', '90% Club', 'Maintain 90%+ attendance', '💯', 'gold', '{"attendance_rate": 90}', 150, 'rare'),
('perfect_semester', 'Perfect Dedication', '100% attendance for entire semester', '🏆', 'platinum', '{"attendance_rate": 100}', 500, 'legendary'),
('centurion', 'Centurion', 'Attended 100 total sessions', '💪', 'platinum', '{"total_sessions": 100}', 400, 'legendary');