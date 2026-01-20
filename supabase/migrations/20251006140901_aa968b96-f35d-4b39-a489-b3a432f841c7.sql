-- Allow users to insert their own initial role during signup
CREATE POLICY "Users can insert their own initial role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND role IN ('student', 'lecturer')
  );