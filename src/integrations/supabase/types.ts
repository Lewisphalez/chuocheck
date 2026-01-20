export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_description: string
          activity_type: string
          created_at: string | null
          id: string
          related_id: string | null
          related_type: string | null
          user_id: string
        }
        Insert: {
          activity_description: string
          activity_type: string
          created_at?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          user_id: string
        }
        Update: {
          activity_description?: string
          activity_type?: string
          created_at?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          auto_submitted: boolean | null
          content: string | null
          feedback: string | null
          id: string
          is_late: boolean | null
          score: number | null
          student_id: string
          submission_file_url: string | null
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          auto_submitted?: boolean | null
          content?: string | null
          feedback?: string | null
          id?: string
          is_late?: boolean | null
          score?: number | null
          student_id: string
          submission_file_url?: string | null
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          auto_submitted?: boolean | null
          content?: string | null
          feedback?: string | null
          id?: string
          is_late?: boolean | null
          score?: number | null
          student_id?: string
          submission_file_url?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: Database["public"]["Enums"]["assignment_type"]
          class_id: string
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string
          duration_minutes: number | null
          file_url: string | null
          go_live_date: string
          id: string
          max_score: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          class_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date: string
          duration_minutes?: number | null
          file_url?: string | null
          go_live_date: string
          id?: string
          max_score?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          class_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string
          duration_minutes?: number | null
          file_url?: string | null
          go_live_date?: string
          id?: string
          max_score?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_adjustments: {
        Row: {
          adjusted_at: string | null
          adjusted_by: string
          adjustment_type: string
          approved: boolean | null
          id: string
          new_status: string
          original_status: string | null
          reason: string
          record_id: string | null
          session_id: string
          student_id: string
        }
        Insert: {
          adjusted_at?: string | null
          adjusted_by: string
          adjustment_type: string
          approved?: boolean | null
          id?: string
          new_status: string
          original_status?: string | null
          reason: string
          record_id?: string | null
          session_id: string
          student_id: string
        }
        Update: {
          adjusted_at?: string | null
          adjusted_by?: string
          adjustment_type?: string
          approved?: boolean | null
          id?: string
          new_status?: string
          original_status?: string | null
          reason?: string
          record_id?: string | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_adjustments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_adjustments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_appeals: {
        Row: {
          created_at: string | null
          evidence_url: string | null
          id: string
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string
          status: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id: string
          status?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          evidence_url?: string | null
          id?: string
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_appeals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_appeals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_appeals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_goals: {
        Row: {
          achieved: boolean | null
          achieved_at: string | null
          class_id: string | null
          created_at: string | null
          end_date: string | null
          goal_type: string
          id: string
          start_date: string
          student_id: string
          target_percentage: number
        }
        Insert: {
          achieved?: boolean | null
          achieved_at?: string | null
          class_id?: string | null
          created_at?: string | null
          end_date?: string | null
          goal_type: string
          id?: string
          start_date?: string
          student_id: string
          target_percentage: number
        }
        Update: {
          achieved?: boolean | null
          achieved_at?: string | null
          class_id?: string | null
          created_at?: string | null
          end_date?: string | null
          goal_type?: string
          id?: string
          start_date?: string
          student_id?: string
          target_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_goals_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_patterns: {
        Row: {
          at_risk: boolean | null
          attendance_percentage: number | null
          attended_sessions: number | null
          class_id: string
          id: string
          last_attended: string | null
          streak_current: number | null
          streak_longest: number | null
          student_id: string
          total_sessions: number | null
          trend: string | null
          updated_at: string | null
        }
        Insert: {
          at_risk?: boolean | null
          attendance_percentage?: number | null
          attended_sessions?: number | null
          class_id: string
          id?: string
          last_attended?: string | null
          streak_current?: number | null
          streak_longest?: number | null
          student_id: string
          total_sessions?: number | null
          trend?: string | null
          updated_at?: string | null
        }
        Update: {
          at_risk?: boolean | null
          attendance_percentage?: number | null
          attended_sessions?: number | null
          class_id?: string
          id?: string
          last_attended?: string | null
          streak_current?: number | null
          streak_longest?: number | null
          student_id?: string
          total_sessions?: number | null
          trend?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_patterns_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_patterns_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          arrival_status: string | null
          device_fingerprint: string | null
          device_info: Json | null
          distance_from_classroom: number | null
          id: string
          location_override_by: string | null
          location_override_reason: string | null
          location_verified: boolean | null
          manually_added: boolean | null
          minutes_late: number | null
          notes: string | null
          scanned_at: string | null
          session_id: string
          student_id: string
          student_latitude: number | null
          student_longitude: number | null
        }
        Insert: {
          arrival_status?: string | null
          device_fingerprint?: string | null
          device_info?: Json | null
          distance_from_classroom?: number | null
          id?: string
          location_override_by?: string | null
          location_override_reason?: string | null
          location_verified?: boolean | null
          manually_added?: boolean | null
          minutes_late?: number | null
          notes?: string | null
          scanned_at?: string | null
          session_id: string
          student_id: string
          student_latitude?: number | null
          student_longitude?: number | null
        }
        Update: {
          arrival_status?: string | null
          device_fingerprint?: string | null
          device_info?: Json | null
          distance_from_classroom?: number | null
          id?: string
          location_override_by?: string | null
          location_override_reason?: string | null
          location_verified?: boolean | null
          manually_added?: boolean | null
          minutes_late?: number | null
          notes?: string | null
          scanned_at?: string | null
          session_id?: string
          student_id?: string
          student_latitude?: number | null
          student_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_location_override_by_fkey"
            columns: ["location_override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          allow_location_override: boolean | null
          attendance_value: number | null
          bonus_attendance: boolean | null
          class_id: string
          classroom_latitude: number | null
          classroom_longitude: number | null
          created_at: string | null
          duration_minutes: number
          end_time: string
          geofence_radius_meters: number | null
          grace_period_minutes: number | null
          id: string
          is_active: boolean | null
          lecturer_id: string
          location_required: boolean | null
          multiple_checkpoints: boolean | null
          qr_refresh_interval: number | null
          session_code: string
          start_time: string | null
          template_id: string | null
        }
        Insert: {
          allow_location_override?: boolean | null
          attendance_value?: number | null
          bonus_attendance?: boolean | null
          class_id: string
          classroom_latitude?: number | null
          classroom_longitude?: number | null
          created_at?: string | null
          duration_minutes: number
          end_time: string
          geofence_radius_meters?: number | null
          grace_period_minutes?: number | null
          id?: string
          is_active?: boolean | null
          lecturer_id: string
          location_required?: boolean | null
          multiple_checkpoints?: boolean | null
          qr_refresh_interval?: number | null
          session_code: string
          start_time?: string | null
          template_id?: string | null
        }
        Update: {
          allow_location_override?: boolean | null
          attendance_value?: number | null
          bonus_attendance?: boolean | null
          class_id?: string
          classroom_latitude?: number | null
          classroom_longitude?: number | null
          created_at?: string | null
          duration_minutes?: number
          end_time?: string
          geofence_radius_meters?: number | null
          grace_period_minutes?: number | null
          id?: string
          is_active?: boolean | null
          lecturer_id?: string
          location_required?: boolean | null
          multiple_checkpoints?: boolean | null
          qr_refresh_interval?: number | null
          session_code?: string
          start_time?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "session_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_streaks: {
        Row: {
          class_id: string
          id: string
          is_active: boolean | null
          streak_end: string | null
          streak_length: number
          streak_start: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          is_active?: boolean | null
          streak_end?: string | null
          streak_length: number
          streak_start: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          is_active?: boolean | null
          streak_end?: string | null
          streak_length?: number
          streak_start?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_streaks_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_streaks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_key: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          points: number | null
          rarity: string | null
          tier: string | null
        }
        Insert: {
          badge_key: string
          criteria: Json
          description: string
          icon: string
          id?: string
          name: string
          points?: number | null
          rarity?: string | null
          tier?: string | null
        }
        Update: {
          badge_key?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number | null
          rarity?: string | null
          tier?: string | null
        }
        Relationships: []
      }
      class_announcements: {
        Row: {
          class_id: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          message: string
          priority: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          message: string
          priority?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          day_of_week: number | null
          effective_from: string
          effective_until: string | null
          end_time: string
          id: string
          location: string | null
          recurring: boolean | null
          start_time: string
        }
        Insert: {
          class_id: string
          day_of_week?: number | null
          effective_from: string
          effective_until?: string | null
          end_time: string
          id?: string
          location?: string | null
          recurring?: boolean | null
          start_time: string
        }
        Update: {
          class_id?: string
          day_of_week?: number | null
          effective_from?: string
          effective_until?: string | null
          end_time?: string
          id?: string
          location?: string | null
          recurring?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          archived: boolean | null
          archived_at: string | null
          capacity: number | null
          course_code: string
          course_name: string
          created_at: string | null
          id: string
          lecturer_id: string
          location: string | null
          schedule_notes: string | null
          section: string | null
          semester: string
          syllabus_url: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          archived?: boolean | null
          archived_at?: string | null
          capacity?: number | null
          course_code: string
          course_name: string
          created_at?: string | null
          id?: string
          lecturer_id: string
          location?: string | null
          schedule_notes?: string | null
          section?: string | null
          semester: string
          syllabus_url?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          archived?: boolean | null
          archived_at?: string | null
          capacity?: number | null
          course_code?: string
          course_name?: string
          created_at?: string | null
          id?: string
          lecturer_id?: string
          location?: string | null
          schedule_notes?: string | null
          section?: string | null
          semester?: string
          syllabus_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      classroom_locations: {
        Row: {
          building: string | null
          created_at: string | null
          created_by: string | null
          default_radius_meters: number | null
          id: string
          latitude: number
          longitude: number
          name: string
          room_number: string | null
        }
        Insert: {
          building?: string | null
          created_at?: string | null
          created_by?: string | null
          default_radius_meters?: number | null
          id?: string
          latitude: number
          longitude: number
          name: string
          room_number?: string | null
        }
        Update: {
          building?: string | null
          created_at?: string | null
          created_by?: string | null
          default_radius_meters?: number | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          room_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_fingerprints: {
        Row: {
          fingerprint: string
          first_seen: string | null
          id: string
          last_seen: string | null
          student_id: string
        }
        Insert: {
          fingerprint: string
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          student_id: string
        }
        Update: {
          fingerprint?: string
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          student_id?: string
        }
        Relationships: []
      }
      gamification_points: {
        Row: {
          id: string
          last_updated: string | null
          level: number | null
          points: number | null
          rank: string | null
          student_id: string
        }
        Insert: {
          id?: string
          last_updated?: string | null
          level?: number | null
          points?: number | null
          rank?: string | null
          student_id: string
        }
        Update: {
          id?: string
          last_updated?: string | null
          level?: number | null
          points?: number | null
          rank?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_notifications: boolean | null
          id: string
          low_attendance_warnings: boolean | null
          missed_class_alerts: boolean | null
          push_notifications: boolean | null
          session_reminders: boolean | null
          session_starting_minutes: number | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          email_notifications?: boolean | null
          id?: string
          low_attendance_warnings?: boolean | null
          missed_class_alerts?: boolean | null
          push_notifications?: boolean | null
          session_reminders?: boolean | null
          session_starting_minutes?: number | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          email_notifications?: boolean | null
          id?: string
          low_attendance_warnings?: boolean | null
          missed_class_alerts?: boolean | null
          push_notifications?: boolean | null
          session_reminders?: boolean | null
          session_starting_minutes?: number | null
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          class_id: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          session_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          class_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          session_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          class_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          session_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          endpoint: string
          id: string
          keys_auth: string
          keys_p256dh: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          endpoint: string
          id?: string
          keys_auth: string
          keys_p256dh: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          endpoint?: string
          id?: string
          keys_auth?: string
          keys_p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_archives: {
        Row: {
          file_url: string | null
          generated_at: string | null
          generated_by: string
          id: string
          parameters: Json | null
          report_type: string
          scheduled_report_id: string | null
        }
        Insert: {
          file_url?: string | null
          generated_at?: string | null
          generated_by: string
          id?: string
          parameters?: Json | null
          report_type: string
          scheduled_report_id?: string | null
        }
        Update: {
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string
          id?: string
          parameters?: Json | null
          report_type?: string
          scheduled_report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_archives_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_archives_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          active: boolean | null
          class_ids: string[] | null
          created_by: string
          day_of_week: number | null
          email_to: string[] | null
          format: string | null
          frequency: string | null
          id: string
          last_sent: string | null
          report_type: string
          time: string | null
        }
        Insert: {
          active?: boolean | null
          class_ids?: string[] | null
          created_by: string
          day_of_week?: number | null
          email_to?: string[] | null
          format?: string | null
          frequency?: string | null
          id?: string
          last_sent?: string | null
          report_type: string
          time?: string | null
        }
        Update: {
          active?: boolean | null
          class_ids?: string[] | null
          created_by?: string
          day_of_week?: number | null
          email_to?: string[] | null
          format?: string | null
          frequency?: string | null
          id?: string
          last_sent?: string | null
          report_type?: string
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_checkpoints: {
        Row: {
          checkpoint_number: number
          checkpoint_time: string
          id: string
          qr_code: string
          scans_count: number | null
          session_id: string
        }
        Insert: {
          checkpoint_number: number
          checkpoint_time: string
          id?: string
          qr_code: string
          scans_count?: number | null
          session_id: string
        }
        Update: {
          checkpoint_number?: number
          checkpoint_time?: string
          id?: string
          qr_code?: string
          scans_count?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_checkpoints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_templates: {
        Row: {
          allow_late_entry: boolean | null
          bonus_points: number | null
          created_by: string
          duration_minutes: number
          grace_period_minutes: number | null
          id: string
          late_penalty_percentage: number | null
          location_required: boolean | null
          max_scans_per_student: number | null
          name: string
          qr_refresh_seconds: number | null
          settings: Json | null
        }
        Insert: {
          allow_late_entry?: boolean | null
          bonus_points?: number | null
          created_by: string
          duration_minutes: number
          grace_period_minutes?: number | null
          id?: string
          late_penalty_percentage?: number | null
          location_required?: boolean | null
          max_scans_per_student?: number | null
          name: string
          qr_refresh_seconds?: number | null
          settings?: Json | null
        }
        Update: {
          allow_late_entry?: boolean | null
          bonus_points?: number | null
          created_by?: string
          duration_minutes?: number
          grace_period_minutes?: number | null
          id?: string
          late_penalty_percentage?: number | null
          location_required?: boolean | null
          max_scans_per_student?: number | null
          name?: string
          qr_refresh_seconds?: number | null
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "session_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          badge_id: string
          class_id: string | null
          context: Json | null
          earned_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          class_id?: string | null
          context?: Json | null
          earned_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          badge_id?: string
          class_id?: string | null
          context?: Json | null
          earned_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          attendance_rate: number | null
          group_id: string
          id: string
          joined_at: string | null
          role: string | null
          student_id: string
        }
        Insert: {
          attendance_rate?: number | null
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          student_id: string
        }
        Update: {
          attendance_rate?: number | null
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          attendance_threshold: number | null
          class_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          max_members: number | null
          meeting_schedule: Json | null
          name: string
        }
        Insert: {
          attendance_threshold?: number | null
          class_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_members?: number | null
          meeting_schedule?: Json | null
          name: string
        }
        Update: {
          attendance_threshold?: number | null
          class_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_members?: number | null
          meeting_schedule?: Json | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          active_sessions: number | null
          active_users_today: number | null
          avg_session_duration: number | null
          error_count: number | null
          id: string
          metric_date: string
          recorded_at: string | null
          system_uptime: unknown
          total_scans_today: number | null
          total_sessions: number | null
          total_users: number | null
        }
        Insert: {
          active_sessions?: number | null
          active_users_today?: number | null
          avg_session_duration?: number | null
          error_count?: number | null
          id?: string
          metric_date: string
          recorded_at?: string | null
          system_uptime?: unknown
          total_scans_today?: number | null
          total_sessions?: number | null
          total_users?: number | null
        }
        Update: {
          active_sessions?: number | null
          active_users_today?: number | null
          avg_session_duration?: number | null
          error_count?: number | null
          id?: string
          metric_date?: string
          recorded_at?: string | null
          system_uptime?: unknown
          total_scans_today?: number | null
          total_sessions?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_assistants: {
        Row: {
          added_at: string | null
          added_by: string
          assistant_id: string
          class_id: string
          id: string
          permissions: Json | null
        }
        Insert: {
          added_at?: string | null
          added_by: string
          assistant_id: string
          class_id: string
          id?: string
          permissions?: Json | null
        }
        Update: {
          added_at?: string | null
          added_by?: string
          assistant_id?: string
          class_id?: string
          id?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_assistants_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_assistants_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_assistants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_leaderboard: {
        Row: {
          avatar_url: string | null
          badge_count: number | null
          full_name: string | null
          global_rank: number | null
          level: number | null
          points: number | null
          rank: string | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_lecturer_avg_attendance: {
        Args: { lecturer_uuid: string }
        Returns: number
      }
      deactivate_expired_sessions: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_creator: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      upsert_device_fingerprint: {
        Args: { p_fingerprint: string; p_student_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "lecturer" | "student"
      assignment_type: "assignment" | "cat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "lecturer", "student"],
      assignment_type: ["assignment", "cat"],
    },
  },
} as const
