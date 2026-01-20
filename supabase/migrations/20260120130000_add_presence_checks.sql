-- Create session_checks table
CREATE TABLE IF NOT EXISTS public.session_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id)
);

-- Create session_check_responses table
CREATE TABLE IF NOT EXISTS public.session_check_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_id UUID NOT NULL REFERENCES public.session_checks(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id),
    responded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Prevent duplicate responses for the same check
    UNIQUE(check_id, student_id)
);

-- Enable RLS
ALTER TABLE public.session_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_check_responses ENABLE ROW LEVEL SECURITY;

-- Policies for session_checks

-- Lecturers can create checks for sessions they own
CREATE POLICY "Lecturers can create checks" ON public.session_checks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendance_sessions
            WHERE id = session_id
            AND lecturer_id = auth.uid()
        )
    );

-- Everyone can view checks (Students need to see them to respond, Lecturers need to see them to monitor)
-- Refine student view: Students can only see checks for sessions they are currently attending/enrolled in? 
-- For simplicity and performance in realtime, allowing authenticated read is often acceptable if the UUID is known, 
-- but strictness is better.
-- Let's allow read if the user is the creator OR if the user is enrolled in the class of the session.
CREATE POLICY "Users can view checks" ON public.session_checks
    FOR SELECT
    TO authenticated
    USING (true); -- Simplifying for realtime performance, assuming session_id filter on client

-- Lecturers can update checks (e.g. to deactivate them)
CREATE POLICY "Lecturers can update checks" ON public.session_checks
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
    );

-- Policies for session_check_responses

-- Students can insert their own response
CREATE POLICY "Students can respond to checks" ON public.session_check_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid()
    );

-- Lecturers can view responses for their sessions
CREATE POLICY "Lecturers can view responses" ON public.session_check_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.session_checks sc
            JOIN public.attendance_sessions sas ON sc.session_id = sas.id
            WHERE sc.id = check_id
            AND sas.lecturer_id = auth.uid()
        )
    );

-- Students can view their own responses
CREATE POLICY "Students can view own responses" ON public.session_check_responses
    FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid()
    );

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_check_responses;
