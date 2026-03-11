
import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# 1. Check assessment logs
print("--- Assessment Logs Metadata ---")
logs = supabase.table("assessment_logs").select("id, assessment_date, data_type, mapping_config").execute()
for log in logs.data:
    raw_max = log.get("mapping_config", {}).get("raw_scale_max")
    print(f"Log {log['id']} ({log['assessment_date']} {log['data_type']}): raw_scale_max={raw_max}")

# 2. Check a sample of assessments for 'mentor'
print("\n--- Mentor Assessments (Sample) ---")
res = supabase.table("assessments").select("raw_score, normalized_score, raw_scale_max").eq("assessment_type", "mentor").limit(10).execute()
for a in res.data:
    print(f"Raw: {a['raw_score']}, Normalized: {a['normalized_score']}, ScaleMax: {a['raw_scale_max']}")
