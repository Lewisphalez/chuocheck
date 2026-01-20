-- Fix 1: Device Fingerprint Validation (move from localStorage to database)
-- Create device_fingerprints table for server-side validation
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, fingerprint)
);

-- Enable RLS on device_fingerprints
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Students can only read their own device records
CREATE POLICY "Students can view their own devices"
ON public.device_fingerprints FOR SELECT
USING (student_id = auth.uid());

-- Create RPC function to upsert device fingerprints (bypass RLS for system operations)
CREATE OR REPLACE FUNCTION public.upsert_device_fingerprint(
  p_student_id UUID,
  p_fingerprint TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.device_fingerprints (student_id, fingerprint, first_seen, last_seen)
  VALUES (p_student_id, p_fingerprint, now(), now())
  ON CONFLICT (student_id, fingerprint) 
  DO UPDATE SET last_seen = now();
END;
$$;

-- Fix 2: Restrict lecturer profile access to only their enrolled students
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Lecturers can view student profiles for attendance" ON public.profiles;

-- Create restricted policy: lecturers can only view profiles of students in their classes
CREATE POLICY "Lecturers can view enrolled students profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'lecturer'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.student_enrollments se ON se.class_id = c.id
    WHERE c.lecturer_id = auth.uid()
    AND se.student_id = profiles.id
  )
);