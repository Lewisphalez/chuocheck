import { supabase } from '@/integrations/supabase/client';
import { getPendingAttendance, clearPendingAttendance } from './offlineStorage';
import { toast } from '@/hooks/use-toast';

export const syncPendingAttendance = async (): Promise<void> => {
  const pending = await getPendingAttendance();
  
  if (pending.length === 0) return;

  console.log(`Syncing ${pending.length} pending attendance records...`);

  for (const record of pending) {
    try {
      const { error } = await supabase.from('attendance_records').insert({
        session_id: record.sessionId,
        student_id: record.studentId,
        scanned_at: record.timestamp,
        device_fingerprint: record.deviceFingerprint,
        student_latitude: record.location?.latitude,
        student_longitude: record.location?.longitude,
      });

      if (error) {
        console.error('Sync error:', error);
      }
    } catch (err) {
      console.error('Failed to sync attendance:', err);
    }
  }

  await clearPendingAttendance();
  
  toast({
    title: 'Synced',
    description: `${pending.length} attendance records synced successfully`,
  });
};

// Auto-sync when connection is restored
if ('connection' in navigator) {
  (navigator as any).connection.addEventListener('change', () => {
    if ((navigator as any).connection.effectiveType !== 'none') {
      syncPendingAttendance();
    }
  });
}

// Periodic sync every 5 minutes
setInterval(() => {
  if (navigator.onLine) {
    syncPendingAttendance();
  }
}, 5 * 60 * 1000);
