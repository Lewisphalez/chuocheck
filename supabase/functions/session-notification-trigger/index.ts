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

    const { sessionId, classId, lecturerId } = await req.json()

    console.log('Session started notification trigger:', sessionId)

    // Get enrolled students for this class
    const { data: enrollments } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('class_id', classId)

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No enrolled students' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get class info
    const { data: classData } = await supabase
      .from('classes')
      .select('course_code, course_name')
      .eq('id', classId)
      .single()

    // Send notification to each enrolled student
    const notificationPromises = enrollments.map(async (enrollment) => {
      // Check if student wants session reminders
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('session_reminders, session_starting_minutes')
        .eq('user_id', enrollment.student_id)
        .single()

      if (!prefs || !prefs.session_reminders) {
        return
      }

      // Create notification
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: enrollment.student_id,
          title: '📱 Attendance Session Active',
          message: `${classData?.course_code} - ${classData?.course_name} attendance is now open! Scan the QR code to mark your attendance.`,
          type: 'session_active',
          actionUrl: '/student/scanner',
          sessionId,
          classId,
        },
      })
    })

    await Promise.all(notificationPromises)

    // Notify lecturer
    await supabase.functions.invoke('send-notification', {
      body: {
        userId: lecturerId,
        title: '✅ Session Started',
        message: `Attendance session for ${classData?.course_code} is now active. Students can now scan.`,
        type: 'session_started',
        actionUrl: `/lecturer/active-session/${sessionId}`,
        sessionId,
      },
    })

    return new Response(
      JSON.stringify({ success: true, notified: enrollments.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in session notification trigger:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
