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

print("=== ASSESSMENT LOGS ===")
logs = run_sql("SELECT id, data_type, assessment_date, records_inserted, file_name FROM assessment_logs ORDER BY created_at DESC LIMIT 10")
print(f"Count: {len(logs)}")
if logs:
    for l in logs[:5]:
        print(l)

print("\n=== ASSESSMENTS - Score Range Check ===")
score_check = run_sql("""
    SELECT
        assessment_type,
        COUNT(*) as total,
        MIN(normalized_score) as min_norm,
        MAX(normalized_score) as max_norm,
        AVG(normalized_score) as avg_norm,
        COUNT(CASE WHEN normalized_score > 10 THEN 1 END) as out_of_range
    FROM assessments
    GROUP BY assessment_type
""")
for row in score_check:
    print(row)

print("\n=== PEER FEEDBACK - Score Range Check ===")
peer_check = run_sql("""
    SELECT
        COUNT(*) as total,
        MIN(score) as min_score,
        MAX(score) as max_score,
        AVG(score) as avg_score,
        COUNT(CASE WHEN score > 10 THEN 1 END) as out_of_range
    FROM peer_feedback
""")
print(peer_check)

print("\n=== PEER FEEDBACK - Sample Rows ===")
peer_sample = run_sql("SELECT id, score, source_file FROM peer_feedback LIMIT 5")
for row in peer_sample:
    print(row)

print("\n=== TERM TRACKING - Score Range Check ===")
term_check = run_sql("""
    SELECT
        COUNT(*) as total,
        MIN(score) as min_score,
        MAX(score) as max_score
    FROM term_tracking
""")
print(term_check)
