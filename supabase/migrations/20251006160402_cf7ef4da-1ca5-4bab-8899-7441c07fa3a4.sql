-- Add device_fingerprint column to attendance_records table for fraud prevention
ALTER TABLE attendance_records 
ADD COLUMN device_fingerprint TEXT;

-- Create indexes for fast lookups
CREATE INDEX idx_attendance_session_device 
ON attendance_records(session_id, device_fingerprint);

CREATE INDEX idx_attendance_student_session 
ON attendance_records(student_id, session_id);