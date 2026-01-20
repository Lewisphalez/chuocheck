-- Fix study group RLS policies to remove infinite recursion
DROP POLICY IF EXISTS "Students can join and view study groups they're in" ON study_group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON study_group_members;
DROP POLICY IF EXISTS "Creators can add members to their groups" ON study_group_members;
DROP POLICY IF EXISTS "Creators can view members of their groups" ON study_group_members;
DROP POLICY IF EXISTS "Students can create and manage their own study groups" ON study_groups;
DROP POLICY IF EXISTS "Students can view public study groups for their classes" ON study_groups;

-- Create security definer function to check group ownership
CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_groups
    WHERE id = _group_id AND created_by = _user_id
  )
$$;

-- Create security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE group_id = _group_id AND student_id = _user_id
  )
$$;

-- Recreate study_groups policies without circular references
CREATE POLICY "Students can create and manage their own study groups"
ON study_groups
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Students can view public or member groups"
ON study_groups
FOR SELECT
USING (
  is_public = true 
  OR created_by = auth.uid()
  OR public.is_group_member(id, auth.uid())
);

-- Recreate study_group_members policies without circular references
CREATE POLICY "Group creators can manage members"
ON study_group_members
FOR ALL
USING (public.is_group_creator(group_id, auth.uid()));

CREATE POLICY "Students can view and manage their own memberships"
ON study_group_members
FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Create function to calculate lecturer average attendance efficiently
CREATE OR REPLACE FUNCTION public.calculate_lecturer_avg_attendance(lecturer_uuid UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    AVG(
      CASE 
        WHEN enrolled.count > 0 
        THEN (attended.count::NUMERIC / enrolled.count::NUMERIC) * 100
        ELSE 0
      END
    ), 0
  )
  FROM attendance_sessions s
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM attendance_records
    WHERE session_id = s.id
  ) attended ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count
    FROM student_enrollments
    WHERE class_id = s.class_id
  ) enrolled ON true
  WHERE s.lecturer_id = lecturer_uuid 
    AND s.is_active = false
$$;