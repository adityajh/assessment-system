import json
import subprocess

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

# Updated view with total_projects_assessed
sql = """
DROP VIEW IF EXISTS v_student_dashboard CASCADE;
CREATE VIEW v_student_dashboard AS
SELECT
    s.id AS student_id,
    s.student_number,
    s.canonical_name,
    COALESCE(t.cbp_count, 0) AS cbp_count,
    COALESCE(t.conflexion_count, 0) AS conflexion_count,
    COALESCE(t.bow_score, 0) AS bow_score,
    (
        SELECT COUNT(DISTINCT a.project_id) 
        FROM assessments a 
        WHERE a.student_id = s.id 
        AND a.assessment_type = 'mentor' 
        AND a.normalized_score IS NOT NULL
    ) AS total_projects_assessed
FROM students s
LEFT JOIN term_tracking t ON t.student_id = s.id AND t.term = 'Year 1'
WHERE s.is_active = TRUE;
"""

payload = json.dumps({"query": sql})
cmd = ["curl", "-s", "-X", "POST", URL,
       "-H", f"Authorization: Bearer {PAT}",
       "-H", "Content-Type: application/json",
       "-d", payload]

result = subprocess.run(cmd, capture_output=True, text=True)
print(result.stdout)
