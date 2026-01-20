-- Allow lecturers to view student profiles for attendance tracking
CREATE POLICY "Lecturers can view student profiles for attendance"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'lecturer'::app_role)
);