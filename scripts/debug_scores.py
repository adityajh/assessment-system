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

print("=== Investigate bad scores - source file breakdown ===")
r = run_sql("""
    SELECT source_file, raw_scale_max, COUNT(*) as cnt,
           MIN(raw_score) as min_raw, MAX(raw_score) as max_raw,
           MIN(normalized_score) as min_norm, MAX(normalized_score) as max_norm
    FROM assessments
    WHERE assessment_type = 'self' AND normalized_score > 10
    GROUP BY source_file, raw_scale_max
    ORDER BY max_norm DESC
""")
for row in r:
    print(row)

print("\n=== Sample of bad rows to understand pattern ===")
r2 = run_sql("""
    SELECT raw_score, raw_scale_max, normalized_score, source_file
    FROM assessments
    WHERE assessment_type = 'self' AND normalized_score > 10
    LIMIT 10
""")
for row in r2:
    print(row)
