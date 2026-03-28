-- Migration 004: Add Client Assessments Support
-- Description: Adds client/company metadata to logs and expands assessment types.

-- 1. Add columns to assessment_logs
ALTER TABLE assessment_logs ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE assessment_logs ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Update data_type check constraint on assessment_logs
-- Since Postgres doesn't allow direct update to CHECK constraints without drop/add,
-- we'll rename the old one (if we knew the name) or just add a new one if possible.
-- Standard practice: DROP existing check if name is known, or just ADD.
-- We'll use a DO block to safely handle constraint names.
DO $$
BEGIN
    -- Drop the old constraint if it exists (standard name is usually table_column_check)
    ALTER TABLE assessment_logs DROP CONSTRAINT IF EXISTS assessment_logs_data_type_check;
    
    -- Add the new expanded constraint
    ALTER TABLE assessment_logs ADD CONSTRAINT assessment_logs_data_type_check 
    CHECK (data_type IN ('self', 'mentor', 'peer', 'term', 'mentor_notes', 'client'));
END $$;

-- 3. Update assessment_type check constraint on assessments
DO $$
BEGIN
    ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_assessment_type_check;
    
    ALTER TABLE assessments ADD CONSTRAINT assessments_assessment_type_check 
    CHECK (assessment_type IN ('mentor', 'self', 'client'));
END $$;

-- 4. Re-create v_domain_scores view to include client type
-- (Postgres requires dropping the view before changing its output if needed, 
-- but here we are just expanding the range of a column value)
CREATE OR REPLACE VIEW v_domain_scores AS
SELECT
    a.student_id,
    s.canonical_name AS student_name,
    a.project_id,
    p.name AS project_name,
    p.sequence,
    p.sequence_label,
    a.assessment_type,
    rd.name AS domain_name,
    rd.short_name AS domain_short,
    rd.display_order,
    ROUND(AVG(a.normalized_score), 2) AS domain_score,
    COUNT(a.normalized_score) AS params_scored
FROM assessments a
JOIN students s ON s.id = a.student_id
JOIN projects p ON p.id = a.project_id
JOIN readiness_parameters rp ON rp.id = a.parameter_id
JOIN readiness_domains rd ON rd.id = rp.domain_id
WHERE a.normalized_score IS NOT NULL
GROUP BY a.student_id, s.canonical_name, a.project_id, p.name, p.sequence,
         p.sequence_label, a.assessment_type, rd.name, rd.short_name, rd.display_order;
