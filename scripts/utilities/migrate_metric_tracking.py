import json
import subprocess
import os

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

def run_sql(query):
    print(f"Executing SQL: {query[:50]}...")
    payload = json.dumps({"query": query})
    cmd = ["curl", "-s", "-X", "POST", URL,
           "-H", f"Authorization: Bearer {PAT}",
           "-H", "Content-Type: application/json",
           "-d", payload]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(result.stdout)
        if isinstance(data, dict) and data.get("error"):
             print(f"  ❌ API Error: {data['error']}")
             return False
        print("  ✅ Success")
        return True
    except Exception as e:
        print(f"  ❌ Failed to parse response: {result.stdout}")
        return False

# Read the SQL file
with open("scripts/012_metric_tracking_schema.sql", "r") as f:
    sql_content = f.read()

# Execute the SQL
# Note: We split by semicolon if the API doesn't like bulk blocks, 
# but usually it handles multi-statement blocks.
if run_sql(sql_content):
    print("\nMigration completed successfully!")
else:
    print("\nMigration failed.")
