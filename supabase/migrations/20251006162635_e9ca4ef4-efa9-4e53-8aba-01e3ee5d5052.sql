-- Step 1: Remove duplicate attendance records (keep only the earliest scan per device per session)
-- This is necessary before we can add the unique constraint

WITH duplicates AS (
  SELECT 
    id,
    session_id,
    device_fingerprint,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, device_fingerprint 
      ORDER BY scanned_at ASC
    ) AS rn
  FROM public.attendance_records
  WHERE device_fingerprint IS NOT NULL
)
DELETE FROM public.attendance_records
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Now create the unique partial index
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_session_device_unique
ON public.attendance_records(session_id, device_fingerprint)
WHERE device_fingerprint IS NOT NULL;

-- Note: The existing UNIQUE(session_id, student_id) constraint already prevents
-- a student from scanning twice in the same session