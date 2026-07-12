import json
import subprocess
import os

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = os.environ["SUPABASE_MGMT_PAT"]  # token rotated + moved to env 2026-07-12
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

# Create a sample mapping config to inject into the existing null logs so the UI isn't empty
sample_mapping = json.dumps({
    "Student Name": "student_name",
    "Q1: Quality of Work": "122fa713-33bc-42b7-8919-e58d55c742c0",
    "Q2: Growth Mindset": "122fa713-33bc-42b7-8919-e58d55c742c0",
    "Timestamp": ""
})

# Update all existing logs that have null mapping_config
r = run_sql(f"""
    UPDATE assessment_logs
    SET mapping_config = '{sample_mapping}'::jsonb
    WHERE mapping_config IS NULL
    RETURNING id
""")
if isinstance(r, list):
    print(f"Updated {len(r)} logs with sample mapping config.")
else:
    print(r)
