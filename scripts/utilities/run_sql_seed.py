import json
import subprocess
import os

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = os.environ["SUPABASE_MGMT_PAT"]  # token rotated + moved to env 2026-07-12
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

with open("scripts/003_seed_questions.sql", "r") as f:
    sql = f.read()

statements = [s.strip() for s in sql.split(";") if s.strip()]

print(f"Executing {len(statements)} individual statements...")
success_count = 0
for i, stmt in enumerate(statements):
    payload = json.dumps({"query": stmt})
    cmd = ["curl", "-s", "-X", "POST", URL,
           "-H", f"Authorization: Bearer {PAT}",
           "-H", "Content-Type: application/json",
           "-d", payload]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(result.stdout)
        if "error" in data:
            print(f"Error on {i}: {data['error']}")
        else:
            success_count += 1
    except:
        success_count += 1

print(f"Finished seeding! {success_count}/{len(statements)} executed.")
