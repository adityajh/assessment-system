-- 010_add_cohort_to_assessment_logs.sql

ALTER TABLE assessment_logs ADD COLUMN IF NOT EXISTS cohort TEXT;
