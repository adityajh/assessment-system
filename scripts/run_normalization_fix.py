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

print("=== STEP 1: Determining peer feedback scale ===")
scale = run_sql("SELECT MIN(quality_of_work), MAX(quality_of_work) FROM peer_feedback")
print("Quality of Work range:", scale)

print("\n=== STEP 2: Fix self-assessment normalized scores ===")
result = run_sql("""
    UPDATE assessments
    SET normalized_score = ROUND((raw_score / raw_scale_max::numeric) * 10, 2)
    WHERE assessment_type = 'self'
      AND raw_scale_max IS NOT NULL
      AND raw_scale_max > 0
    RETURNING id
""")
if isinstance(result, list):
    print(f"Updated {len(result)} self-assessment rows")
else:
    print("Result:", result)

print("\n=== STEP 3: Verify fix ===")
verify = run_sql("""
    SELECT COUNT(*) as total, MIN(normalized_score) as min, MAX(normalized_score) as max,
           COUNT(CASE WHEN normalized_score > 10 THEN 1 END) as still_out_of_range
    FROM assessments WHERE assessment_type = 'self'
""")
print("Self-assessment scores:", verify)

print("\n=== STEP 4: Add normalized_avg column to peer_feedback ===")
add_col = run_sql("""
    ALTER TABLE peer_feedback
    ADD COLUMN IF NOT EXISTS normalized_avg NUMERIC(4,2) GENERATED ALWAYS AS (
        ROUND(
            (quality_of_work + initiative_ownership + communication + collaboration + growth_mindset)::numeric
            / 5.0,
        2)
    ) STORED
""")
print("Add column result:", add_col)

print("\n=== STEP 5: Verify peer_feedback normalized_avg ===")
pf_check = run_sql("SELECT quality_of_work, collaboration, normalized_avg FROM peer_feedback LIMIT 3")
print("Peer feedback with normalized_avg:", pf_check)
