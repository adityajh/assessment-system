import json
import subprocess
import os
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")

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
        return []

res = run_sql("SELECT id, name FROM projects;")
print(json.dumps(res, indent=2))
