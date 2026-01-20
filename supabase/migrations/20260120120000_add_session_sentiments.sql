-- Create sentiment enum type
create type sentiment_type as enum ('understood', 'neutral', 'confused');

-- Create session_sentiments table
create table public.session_sentiments (
    id uuid not null default gen_random_uuid(),
    session_id uuid not null references public.attendance_sessions(id) on delete cascade,
    student_id uuid not null references auth.users(id),
    sentiment sentiment_type not null,
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    constraint session_sentiments_pkey primary key (id)
);

-- Enable RLS
alter table public.session_sentiments enable row level security;

-- Policies
create policy "Students can insert their own sentiment"
    on public.session_sentiments
    for insert
    with check (auth.uid() = student_id);

create policy "Lecturers can view sentiments for their sessions"
    on public.session_sentiments
    for select
    using (
        exists (
            select 1 from public.attendance_sessions
            where id = public.session_sentiments.session_id
            and lecturer_id = auth.uid()
        )
    );

-- Add realtime support
alter publication supabase_realtime add table session_sentiments;
