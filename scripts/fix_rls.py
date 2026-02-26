import json
import subprocess

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
ANON_KEY = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"
REST_URL = f"https://{PROJECT_ID}.supabase.co/rest/v1"

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

print("=== RLS policies on assessment_logs ===")
rls = run_sql("""
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
    FROM pg_policies
    WHERE tablename = 'assessment_logs'
""")
print(rls)

print("\n=== Check if anon can read assessment_logs ===")
# Check what grants anon role has
grants = run_sql("""
    SELECT grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_name = 'assessment_logs' AND grantee IN ('anon', 'authenticated', 'public')
""")
print(grants)

print("\n=== Enable anon SELECT on assessment_logs if not present ===")
# Enable RLS and add policy
r1 = run_sql("ALTER TABLE assessment_logs ENABLE ROW LEVEL SECURITY")
print("RLS enabled:", r1)

r2 = run_sql("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'assessment_logs' AND policyname = 'anon_select_logs'
        ) THEN
            CREATE POLICY anon_select_logs ON assessment_logs
            FOR SELECT TO anon, authenticated USING (true);
        END IF;
    END $$
""")
print("Policy created:", r2)
