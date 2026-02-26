-- 006_modify_term_tracking.sql

-- Drop the old overly-restrictive unique constraint
ALTER TABLE term_tracking DROP CONSTRAINT IF EXISTS term_tracking_student_id_term_key;

-- Add the new constraint that includes assessment_log_id to allow multiple imports over time
ALTER TABLE term_tracking ADD CONSTRAINT term_tracking_student_id_term_log_key UNIQUE (student_id, term, assessment_log_id);
