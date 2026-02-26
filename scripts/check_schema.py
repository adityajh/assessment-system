import json
import subprocess

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

payload = json.dumps({"query": sql})
cmd = ["curl", "-s", "-X", "POST", URL,
       "-H", f"Authorization: Bearer {PAT}",
       "-H", "Content-Type: application/json",
       "-d", payload]

result = subprocess.run(cmd, capture_output=True, text=True)
data = json.loads(result.stdout)

print("Tables found:")
print(data)

sql2 = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assessments';"
payload2 = json.dumps({"query": sql2})
cmd2 = ["curl", "-s", "-X", "POST", URL,
       "-H", f"Authorization: Bearer {PAT}",
       "-H", "Content-Type: application/json",
       "-d", payload2]

result2 = subprocess.run(cmd2, capture_output=True, text=True)
data2 = json.loads(result2.stdout)

print("\nColumns in 'assessments':")
print(data2)
