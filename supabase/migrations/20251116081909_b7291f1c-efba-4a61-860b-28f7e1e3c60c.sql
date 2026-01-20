-- Create enum for assignment types
CREATE TYPE assignment_type AS ENUM ('assignment', 'cat');

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  assignment_type assignment_type NOT NULL DEFAULT 'assignment',
  go_live_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  max_score NUMERIC DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create assignment submissions table
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  submission_file_url TEXT,
  content TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  score NUMERIC,
  feedback TEXT,
  is_late BOOLEAN DEFAULT false,
  auto_submitted BOOLEAN DEFAULT false,
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
CREATE POLICY "Lecturers can create assignments for their classes"
ON public.assignments FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = assignments.class_id AND lecturer_id = auth.uid()
  )
);

CREATE POLICY "Lecturers can view their assignments"
ON public.assignments FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = assignments.class_id AND lecturer_id = auth.uid()
  )
);

CREATE POLICY "Lecturers can update their assignments"
ON public.assignments FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Lecturers can delete their assignments"
ON public.assignments FOR DELETE
USING (created_by = auth.uid());

CREATE POLICY "Students can view live assignments for enrolled classes"
ON public.assignments FOR SELECT
USING (
  go_live_date <= now() AND
  EXISTS (
    SELECT 1 FROM public.student_enrollments
    WHERE class_id = assignments.class_id AND student_id = auth.uid()
  )
);

-- RLS Policies for submissions
CREATE POLICY "Students can create their own submissions"
ON public.assignment_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions before deadline"
ON public.assignment_submissions FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view submissions for their assignments"
ON public.assignment_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id AND a.created_by = auth.uid()
  )
);

CREATE POLICY "Lecturers can update submissions (grading)"
ON public.assignment_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id AND a.created_by = auth.uid()
  )
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignments', 'assignments', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('submissions', 'submissions', false);

-- Storage policies for assignments bucket
CREATE POLICY "Lecturers can upload assignment files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Lecturers can view their assignment files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view assignment files for enrolled classes"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignments');

-- Storage policies for submissions bucket
CREATE POLICY "Students can upload their submission files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Lecturers can view all submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submissions' AND
  has_role(auth.uid(), 'lecturer'::app_role)
);