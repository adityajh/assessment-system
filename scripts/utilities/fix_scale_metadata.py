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

# These 3 files appear to have been answered on 1-10 but stored with raw_scale_max=5.
# When raw_score > 5, the student was clearly answering on a 0-10 or 1-10 scale.
# Fix: update raw_scale_max = 10 for all rows where raw_scale_max=5 AND source file is one of the bad ones

BAD_FILES = [
    'Business X-Ray _ Responses (1).xlsx',
    'Legacy Assessment - Readiness Self-Assessment (Responses) (2).xlsx',
    'Marketing Project - Readiness Self-Assessment (Responses) (1).xlsx'
]

# First, let's check what the full range looks like for these files (including valid rows)
print("=== Full range of bad files ===")
for f in BAD_FILES:
    r = run_sql(f"""
        SELECT raw_scale_max, COUNT(*), MIN(raw_score), MAX(raw_score)
        FROM assessments
        WHERE source_file = '{f}'
        GROUP BY raw_scale_max
    """)
    print(f"{f}: {r}")

print("\n=== Correcting raw_scale_max for all rows in bad source files ===")
# All 3 bad files appear to be on a 1-10 scale despite raw_scale_max=5 being stored
# Fix all rows in these files to use raw_scale_max=10, then recalculate normalized
for f in BAD_FILES:
    r = run_sql(f"""
        UPDATE assessments
        SET
            raw_scale_max = 10,
            raw_scale_min = 1,
            normalized_score = ROUND(raw_score, 2)
        WHERE source_file = '{f}'
          AND assessment_type = 'self'
    """)
    if isinstance(r, list):
        print(f"Updated rows in '{f}': {len(r)}")
    else:
        print(f"Result for '{f}': {r}")

print("\n=== Verification ===")
verify = run_sql("""
    SELECT COUNT(*), MIN(normalized_score), MAX(normalized_score),
           COUNT(CASE WHEN normalized_score > 10 THEN 1 END) as still_out_of_range
    FROM assessments WHERE assessment_type = 'self'
""")
print("Self-assessments:", verify)

mentor_verify = run_sql("""
    SELECT COUNT(*), MIN(normalized_score), MAX(normalized_score)
    FROM assessments WHERE assessment_type = 'mentor'
""")
print("Mentor assessments:", mentor_verify)
