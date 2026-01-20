-- Create student_enrollments table to track class enrollments
CREATE TABLE public.student_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  enrolled_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Enable RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollments
CREATE POLICY "Students can view their own enrollments"
ON public.student_enrollments
FOR SELECT
TO authenticated
USING (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role));

-- Students can enroll themselves in classes
CREATE POLICY "Students can enroll in classes"
ON public.student_enrollments
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role));

-- Students can unenroll from classes
CREATE POLICY "Students can unenroll from classes"
ON public.student_enrollments
FOR DELETE
TO authenticated
USING (student_id = auth.uid());

-- Lecturers can view enrollments for their classes
CREATE POLICY "Lecturers can view enrollments for their classes"
ON public.student_enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = student_enrollments.class_id
    AND classes.lecturer_id = auth.uid()
  )
);