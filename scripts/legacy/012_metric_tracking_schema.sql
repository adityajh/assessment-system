-- 012_metric_tracking_schema.sql

-- 1. Create the metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed the metrics
INSERT INTO metrics (name) 
VALUES ('CBP'), ('Conflexion'), ('BoW')
ON CONFLICT (name) DO NOTHING;

-- 3. Create the metric_tracking table
CREATE TABLE IF NOT EXISTS metric_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    assessment_log_id UUID NOT NULL REFERENCES assessment_logs(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, metric_id, assessment_log_id)
);

-- 4. Update the v_student_dashboard view to aggregate metrics
-- We aggregate by summing the latest values for each metric type.
-- Note: For BOW it might be 'latest', but usually CBP/Conflexion are cumulative.
-- For simplicity, let's SUM up all entries for CBP/Conflexion and maybe use latest for BoW?
-- Actually, lets just provide a view that sums everything up per student for now as a baseline.

DROP VIEW IF EXISTS v_student_dashboard CASCADE;

CREATE VIEW v_student_dashboard AS
WITH student_metrics AS (
    SELECT 
        mt.student_id,
        m.name AS metric_name,
        SUM(mt.value) as total_value
    FROM metric_tracking mt
    JOIN metrics m ON m.id = mt.metric_id
    GROUP BY mt.student_id, m.name
)
SELECT
    s.id AS student_id,
    s.student_number,
    s.canonical_name,
    COALESCE((SELECT total_value FROM student_metrics sm WHERE sm.student_id = s.id AND sm.metric_name = 'CBP'), 0) AS cbp_count,
    COALESCE((SELECT total_value FROM student_metrics sm WHERE sm.student_id = s.id AND sm.metric_name = 'Conflexion'), 0) AS conflexion_count,
    COALESCE((SELECT total_value FROM student_metrics sm WHERE sm.student_id = s.id AND sm.metric_name = 'BoW'), 0) AS bow_score
FROM students s
WHERE s.is_active = TRUE;

-- 5. Drop the old term_tracking table eventually, but keep it for now for safety?
-- No, let's keep it until after the migration is fully verified.
