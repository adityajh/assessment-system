import json
import subprocess

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

# Check term_tracking counts and metric_tracking counts
sql = """
SELECT 
    s.canonical_name, 
    s.cohort,
    (SELECT count(*) FROM term_tracking t WHERE t.student_id = s.id) as has_term_tracking,
    (SELECT count(*) FROM metric_tracking mt WHERE mt.student_id = s.id) as has_metric_tracking
FROM students s
WHERE s.is_active = TRUE
LIMIT 10;
"""

payload = json.dumps({"query": sql})
cmd = ["curl", "-s", "-X", "POST", URL,
       "-H", f"Authorization: Bearer {PAT}",
       "-H", "Content-Type: application/json",
       "-d", payload]

result = subprocess.run(cmd, capture_output=True, text=True)
print(result.stdout)
