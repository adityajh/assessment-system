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

print("=== Adding anon SELECT policy for assessment_logs ===")
r = run_sql("""
    CREATE POLICY "Allow anon read assessment_logs"
    ON assessment_logs
    FOR SELECT
    TO anon
    USING (true)
""")
print(r)

print("\n=== Current policies on assessment_logs ===")
policies = run_sql("""
    SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'assessment_logs'
""")
for p in policies:
    print(p)
