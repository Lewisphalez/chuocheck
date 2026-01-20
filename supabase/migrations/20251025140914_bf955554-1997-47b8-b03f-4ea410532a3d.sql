-- Allow users to insert their own activity logs
CREATE POLICY "Users can insert their own activity"
ON public.activity_log
FOR INSERT
WITH CHECK (user_id = auth.uid());