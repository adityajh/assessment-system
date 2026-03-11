-- 012_consolidate_term_tracking.sql

-- 1. Drop the assessment_log_id based unique constraint
-- Existing name from 006 script: term_tracking_student_id_term_log_key
ALTER TABLE term_tracking DROP CONSTRAINT IF EXISTS term_tracking_student_id_term_log_key;

-- 2. Add the simpler (student_id, term) based unique constraint
-- This ensures one row per student per term, allowing metrics to be merged across logs.
ALTER TABLE term_tracking ADD CONSTRAINT term_tracking_student_term_key UNIQUE (student_id, term);

-- 3. (Optional) In a production environment, you might need to merge existing duplicate student/term rows 
-- if they exist before applying the constraint.
-- For this setup, we assume we can apply it or the user will clear conflicts manually if the DB is small.
