import json
import subprocess

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

sql = """
DROP VIEW IF EXISTS v_student_dashboard CASCADE;
CREATE VIEW v_student_dashboard AS
WITH mt_agg AS (
    SELECT 
        mt.student_id,
        m.name AS metric_name,
        SUM(mt.value) as total_value
    FROM metric_tracking mt
    JOIN metrics m ON m.id = mt.metric_id
    GROUP BY mt.student_id, m.name
),
tt_data AS (
    SELECT 
        student_id,
        cbp_count,
        conflexion_count,
        bow_score
    FROM term_tracking
    WHERE term = 'Year 1'
)
SELECT
    s.id AS student_id,
    s.student_number,
    s.canonical_name,
    (
        COALESCE((SELECT total_value FROM mt_agg WHERE mt_agg.student_id = s.id AND mt_agg.metric_name = 'CBP'), 0) +
        COALESCE((SELECT cbp_count FROM tt_data WHERE tt_data.student_id = s.id), 0)
    ) AS cbp_count,
    (
        COALESCE((SELECT total_value FROM mt_agg WHERE mt_agg.student_id = s.id AND mt_agg.metric_name = 'Conflexion'), 0) +
        COALESCE((SELECT conflexion_count FROM tt_data WHERE tt_data.student_id = s.id), 0)
    ) AS conflexion_count,
    (
        COALESCE((SELECT total_value FROM mt_agg WHERE mt_agg.student_id = s.id AND mt_agg.metric_name = 'BoW'), 0) +
        COALESCE((SELECT bow_score FROM tt_data WHERE tt_data.student_id = s.id), 0)
    ) AS bow_score,
    (
        SELECT COUNT(DISTINCT a.project_id) 
        FROM assessments a 
        WHERE a.student_id = s.id 
        AND a.assessment_type = 'mentor' 
        AND a.normalized_score IS NOT NULL
    ) AS total_projects_assessed
FROM students s
WHERE s.is_active = TRUE;
"""

payload = json.dumps({"query": sql})
cmd = ["curl", "-s", "-X", "POST", URL,
       "-H", f"Authorization: Bearer {PAT}",
       "-H", "Content-Type: application/json",
       "-d", payload]

result = subprocess.run(cmd, capture_output=True, text=True)
print(result.stdout)
