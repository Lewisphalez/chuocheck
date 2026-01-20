-- Fix Security Definer View issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.student_leaderboard;

CREATE VIEW public.student_leaderboard
WITH (security_invoker = true)
AS
SELECT 
    gp.student_id,
    p.full_name,
    p.avatar_url,
    gp.points,
    gp.level,
    gp.rank,
    count(DISTINCT sb.badge_id) AS badge_count,
    row_number() OVER (ORDER BY gp.points DESC) AS global_rank
FROM gamification_points gp
JOIN profiles p ON p.id = gp.student_id
LEFT JOIN student_badges sb ON sb.student_id = gp.student_id
GROUP BY gp.student_id, p.full_name, p.avatar_url, gp.points, gp.level, gp.rank;

-- Grant access to authenticated users
GRANT SELECT ON public.student_leaderboard TO authenticated;