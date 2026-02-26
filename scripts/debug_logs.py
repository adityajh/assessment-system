import json
import subprocess

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

def run_sql(query):
    payload = json.dumps({"query": query})
    cmd = ["curl", "-s", "-X", "POST", URL,
           "-H", f"Authorization: Bearer {PAT}",
           "-H", "Content-Type: application/json",
           "-d", payload]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(result.stdout)
    except:
        return {"raw": result.stdout}

print("=== Assessment logs with program/project joins ===")
# Check if program_id is NULL (which would cause the join to fail for some rows)
r = run_sql("""
    SELECT al.id, al.data_type, al.program_id, al.project_id, 
           p.name as program_name, pr.name as project_name
    FROM assessment_logs al
    LEFT JOIN programs p ON al.program_id = p.id
    LEFT JOIN projects pr ON al.project_id = pr.id
    ORDER BY al.assessment_date DESC
    LIMIT 11
""")
for row in r:
    print(row)

print("\n=== Programs table content ===")
progs = run_sql("SELECT id, name FROM programs")
print(progs)
