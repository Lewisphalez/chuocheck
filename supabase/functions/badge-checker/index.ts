import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { studentId, recordId } = await req.json()

    console.log('Checking badges for student:', studentId)

    // Get student's attendance patterns
    const { data: patterns } = await supabase
      .from('attendance_patterns')
      .select('*')
      .eq('student_id', studentId)

    // Get all badges
    const { data: badges } = await supabase
      .from('badges')
      .select('*')

    // Get already earned badges
    const { data: earnedBadges } = await supabase
      .from('student_badges')
      .select('badge_id')
      .eq('student_id', studentId)

    const earnedBadgeIds = earnedBadges?.map(b => b.badge_id) || []
    const newBadges = []

    if (badges && patterns) {
      for (const badge of badges) {
        if (earnedBadgeIds.includes(badge.id)) continue

        let earned = false

        // Check badge criteria
        const criteria = badge.criteria as any

        switch (badge.badge_key) {
          case 'first_scan':
            earned = true // First scan always earns this
            break

          case 'streak_5':
            earned = patterns.some(p => p.streak_current >= 5)
            break

          case 'streak_10':
            earned = patterns.some(p => p.streak_current >= 10)
            break

          case 'streak_30':
            earned = patterns.some(p => p.streak_current >= 30)
            break

          case 'perfect_week':
            earned = patterns.some(p => p.streak_current >= 7)
            break

          case 'perfect_month':
            earned = patterns.some(p => p.streak_current >= 30 && p.attendance_percentage >= 100)
            break

          case 'ninety_club':
            earned = patterns.some(p => p.attendance_percentage >= 90)
            break

          case 'perfect_semester':
            earned = patterns.some(p => p.attendance_percentage >= 100 && p.total_sessions >= 20)
            break

          case 'centurion':
            const totalSessions = patterns.reduce((sum, p) => sum + p.attended_sessions, 0)
            earned = totalSessions >= 100
            break
        }

        if (earned) {
          // Award badge
          const { error: badgeError } = await supabase
            .from('student_badges')
            .insert({
              student_id: studentId,
              badge_id: badge.id,
            })

          if (!badgeError) {
            newBadges.push(badge)

            // Update gamification points
            await supabase.rpc('increment_points', {
              user_id: studentId,
              points: badge.points,
            })

            // Send notification
            await supabase.functions.invoke('send-notification', {
              body: {
                userId: studentId,
                title: '🏆 New Badge Earned!',
                message: `You've earned the "${badge.name}" badge!`,
                type: 'badge_earned',
                actionUrl: '/student/badges',
              },
            })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, newBadges }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error checking badges:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
