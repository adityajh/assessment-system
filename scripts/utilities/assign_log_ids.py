import json, subprocess
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = "https://api.supabase.com/v1/projects/wqcdtdofwytfrcbhfycc/database/query"

def run_sql(query):
    payload = json.dumps({"query": query})
    cmd = ["curl", "-s", "-X", "POST", URL, "-H", f"Authorization: Bearer {PAT}", "-H", "Content-Type: application/json", "-d", payload]
    return json.loads(subprocess.run(cmd, capture_output=True, text=True).stdout)

logs = run_sql("SELECT id, project_id, data_type FROM assessment_logs")

updates = 0
for log in logs:
    if not log.get("project_id"): continue
    
    q = f"""
        UPDATE assessments
        SET assessment_log_id = '{log['id']}'
        WHERE project_id = '{log['project_id']}'
        AND assessment_type = '{log['data_type']}'
        AND assessment_log_id IS NULL;
    """
    run_sql(q)
    updates += 1

print(f"Updated {updates} assessment log mapping rules in the assessments table.")
