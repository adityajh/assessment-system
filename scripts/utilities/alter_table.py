import json
import subprocess
import os

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = os.environ["SUPABASE_MGMT_PAT"]  # token rotated + moved to env 2026-07-12
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

sql = """
ALTER TABLE self_assessment_questions ADD COLUMN IF NOT EXISTS project_context TEXT;
"""

payload = json.dumps({"query": sql})
cmd = ["curl", "-s", "-X", "POST", URL,
       "-H", f"Authorization: Bearer {PAT}",
       "-H", "Content-Type: application/json",
       "-d", payload]

print("Executing ALTER TABLE to add project_context...")
result = subprocess.run(cmd, capture_output=True, text=True)

try:
    data = json.loads(result.stdout)
    if "error" in data:
        print(f"SQL Error: {data['error']}")
    else:
        print("Success! Altered table.")
except Exception as e:
    # If it returns empty on success for DDL
    print("Likely success. Could not parse JSON:", e)
    print(result.stdout)
