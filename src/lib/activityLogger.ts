import { supabase } from '@/integrations/supabase/client';

export async function logActivity(
  userId: string,
  activityType: string,
  description: string,
  relatedId?: string,
  relatedType?: string
) {
  try {
    const { error } = await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_description: description,
        related_id: relatedId,
        related_type: relatedType,
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
