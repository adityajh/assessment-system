-- 007_update_assessment_logs_constraint.sql

-- Drop the old overly restrictive constraint
ALTER TABLE assessment_logs DROP CONSTRAINT IF EXISTS assessment_logs_data_type_check;

-- Add the new constraint allowing mentor_notes
ALTER TABLE assessment_logs ADD CONSTRAINT assessment_logs_data_type_check 
CHECK (data_type IN ('self', 'mentor', 'peer', 'term', 'mentor_notes'));
