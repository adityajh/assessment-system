import json
import subprocess
import pandas as pd
import difflib

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

qs = run_sql("SELECT count(*) FROM self_assessment_questions")
print(qs)
qs_all = run_sql("SELECT id, project_context, question_text FROM self_assessment_questions LIMIT 5")
print(json.dumps(qs_all, indent=2))
