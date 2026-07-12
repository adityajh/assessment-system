import json
import subprocess
import os

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = os.environ["SUPABASE_MGMT_PAT"]  # token rotated + moved to env 2026-07-12
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

sql = "SELECT id, name FROM metrics;"

payload = json.dumps({"query": sql})
cmd = ["curl", "-s", "-X", "POST", URL,
       "-H", f"Authorization: Bearer {PAT}",
       "-H", "Content-Type: application/json",
       "-d", payload]

result = subprocess.run(cmd, capture_output=True, text=True)
print(result.stdout)
