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

    const { studentId, classId, sessionId } = await req.json()

    console.log('Updating attendance patterns for student:', studentId, 'class:', classId)

    // Get all sessions for this class
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('id, start_time')
      .eq('class_id', classId)
      .order('start_time', { ascending: false })

    const totalSessions = sessions?.length || 0

    // Get student's attendance records for this class
    const { data: records } = await supabase
      .from('attendance_records')
      .select('id, scanned_at, session_id')
      .in('session_id', sessions?.map(s => s.id) || [])
      .eq('student_id', studentId)
      .order('scanned_at', { ascending: false })

    const attendedSessions = records?.length || 0
    const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0

    // Calculate current streak
    let currentStreak = 0
    if (records && sessions) {
      const sortedSessions = sessions.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      )
      const attendedSessionIds = records.map(r => r.session_id)

      for (const session of sortedSessions) {
        if (attendedSessionIds.includes(session.id)) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Get previous pattern to calculate trend
    const { data: existingPattern } = await supabase
      .from('attendance_patterns')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single()

    let trend = 'stable'
    if (existingPattern) {
      if (attendancePercentage > existingPattern.attendance_percentage + 5) {
        trend = 'improving'
      } else if (attendancePercentage < existingPattern.attendance_percentage - 5) {
        trend = 'declining'
      }
    }

    const longestStreak = Math.max(existingPattern?.streak_longest || 0, currentStreak)

    // Upsert attendance pattern
    const { error: patternError } = await supabase
      .from('attendance_patterns')
      .upsert({
        student_id: studentId,
        class_id: classId,
        total_sessions: totalSessions,
        attended_sessions: attendedSessions,
        attendance_percentage: attendancePercentage,
        streak_current: currentStreak,
        streak_longest: longestStreak,
        last_attended: records?.[0]?.scanned_at || new Date().toISOString(),
        at_risk: attendancePercentage < 70,
        trend,
        updated_at: new Date().toISOString(),
      })

    if (patternError) throw patternError

    // Update streak record
    if (currentStreak > 0) {
      const { error: streakError } = await supabase
        .from('attendance_streaks')
        .upsert({
          student_id: studentId,
          class_id: classId,
          streak_start: records?.[currentStreak - 1]?.scanned_at || new Date().toISOString(),
          streak_length: currentStreak,
          is_active: true,
        })

      if (streakError) console.error('Streak error:', streakError)
    }

    // Initialize gamification points if needed
    const { data: points } = await supabase
      .from('gamification_points')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (!points) {
      await supabase
        .from('gamification_points')
        .insert({
          student_id: studentId,
          points: 10, // First attendance
          level: 1,
          rank: 'Novice',
        })
    }

    // Trigger badge check
    await supabase.functions.invoke('badge-checker', {
      body: {
        studentId,
        recordId: sessionId,
      },
    })

    // Send low attendance warning if at risk
    if (attendancePercentage < 70 && attendancePercentage > 0) {
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: studentId,
          title: '⚠️ Low Attendance Warning',
          message: `Your attendance in this class is ${attendancePercentage.toFixed(1)}%. Please improve to stay on track.`,
          type: 'low_attendance',
          classId,
        },
      })
    }

    return new Response(
      JSON.stringify({ success: true, pattern: { attendancePercentage, currentStreak } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating patterns:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
