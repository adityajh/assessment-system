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
        return {"error": result.stdout}

print("=== PEER FEEDBACK COLUMNS ===")
pf_cols = run_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'peer_feedback' ORDER BY ordinal_position")
for col in pf_cols:
    print(col)

print("\n=== TERM TRACKING COLUMNS ===")
tt_cols = run_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'term_tracking' ORDER BY ordinal_position")
for col in tt_cols:
    print(col)

print("\n=== PEER FEEDBACK SAMPLE ===")
pf_sample = run_sql("SELECT * FROM peer_feedback LIMIT 3")
for row in pf_sample:
    print(row)

print("\n=== ASSESSMENT LOGS - All Rows ===")
logs = run_sql("SELECT id, data_type, assessment_date, records_inserted, file_name FROM assessment_logs ORDER BY created_at DESC")
print(f"Total logs: {len(logs)}")
for l in logs:
    print(l)

print("\n=== OUT OF RANGE self-assessment scores ===")
out_range = run_sql("""
    SELECT COUNT(*), MIN(normalized_score), MAX(normalized_score)
    FROM assessments
    WHERE normalized_score > 10 AND assessment_type = 'self'
""")
print(out_range)

print("\n=== Example out-of-range self scores ===")
examples = run_sql("""
    SELECT normalized_score, raw_score, raw_scale_max, source_file
    FROM assessments
    WHERE normalized_score > 10 AND assessment_type = 'self'
    LIMIT 5
""")
for r in examples:
    print(r)
