-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  section TEXT,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_sessions table
CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  lecturer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_code TEXT UNIQUE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB,
  UNIQUE(session_id, student_id)
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Lecturers can view their own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Lecturers can create classes"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (lecturer_id = auth.uid() AND public.has_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can update their own classes"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (lecturer_id = auth.uid());

CREATE POLICY "Lecturers can delete their own classes"
  ON public.classes FOR DELETE
  TO authenticated
  USING (lecturer_id = auth.uid());

CREATE POLICY "Students can view classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'student') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance_sessions
CREATE POLICY "Lecturers can view their own sessions"
  ON public.attendance_sessions FOR SELECT
  TO authenticated
  USING (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Lecturers can create sessions"
  ON public.attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (lecturer_id = auth.uid() AND public.has_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can update their own sessions"
  ON public.attendance_sessions FOR UPDATE
  TO authenticated
  USING (lecturer_id = auth.uid());

CREATE POLICY "Students can view active sessions"
  ON public.attendance_sessions FOR SELECT
  TO authenticated
  USING (is_active = true AND public.has_role(auth.uid(), 'student'));

-- RLS Policies for attendance_records
CREATE POLICY "Students can create their own attendance records"
  ON public.attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can view their own attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view attendance for their sessions"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE attendance_sessions.id = attendance_records.session_id
      AND attendance_sessions.lecturer_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_classes_lecturer_id ON public.classes(lecturer_id);
CREATE INDEX idx_sessions_class_id ON public.attendance_sessions(class_id);
CREATE INDEX idx_sessions_code ON public.attendance_sessions(session_code);
CREATE INDEX idx_sessions_active ON public.attendance_sessions(is_active);
CREATE INDEX idx_records_session_id ON public.attendance_records(session_id);
CREATE INDEX idx_records_student_id ON public.attendance_records(student_id);

-- Create function to auto-deactivate expired sessions
CREATE OR REPLACE FUNCTION public.deactivate_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.attendance_sessions
  SET is_active = false
  WHERE is_active = true
  AND end_time < NOW();
END;
$$;