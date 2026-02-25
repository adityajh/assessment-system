import os
from supabase import create_client, Client
import json
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Please ensure frontend/.env.local contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
    exit(1)

supabase: Client = create_client(url, key)

print("Fetching parameter map directly to insert via SDK...")
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
        return []

params_raw = run_sql("SELECT id, name FROM readiness_parameters")
param_map = {p['name']: p['id'] for p in params_raw}

with open("scripts/semantic_mapping.md", "r") as f:
    lines = f.readlines()

records_to_insert = []
for line in lines[4:]:
    if not line.strip(): continue
    parts = [p.strip() for p in line.split("|")[1:-1]]
    if len(parts) != 4: continue
    
    project, domain, param_name, question_text = parts
    best_p_id = next((dm_id for dm_name, dm_id in param_map.items() if dm_name.lower().strip() == param_name.lower().strip() or dm_name.lower() in param_name.lower()), None)
    if best_p_id:
        records_to_insert.append({"parameter_id": best_p_id, "question_text": question_text, "project_context": project, "version": 1})

import pandas as pd
path = "data/Year 1 Assessment_Matrix (1) (1) (1).xlsx"
xl = pd.ExcelFile(path)
sheet_to_project = {"Kickstart": "Kickstart", "Legacy": "Legacy", "Murder Mystery": "Marketing"}

for sheet in xl.sheet_names:
    if sheet not in sheet_to_project: continue
    df = pd.read_excel(xl, sheet_name=sheet)
    for idx, row in df.iterrows():
        param_cell, question_cell = str(row[df.columns[0]]), str(row[df.columns[1]])
        if not question_cell or not param_cell.strip() or pd.isna(row[df.columns[1]]): continue
        best_p_id = next((dm_id for dm_name, dm_id in param_map.items() if dm_name.lower() in param_cell.lower()), None)
        if best_p_id and len(question_cell) > 10:
            records_to_insert.append({"parameter_id": best_p_id, "question_text": question_cell.strip(), "project_context": sheet_to_project[sheet], "version": 1})

print(f"Found {len(records_to_insert)} records to insert via SDK.")

print("Wiping existing questions via Supabase SDK...")
try:
    # Need to get all IDs to wipe them cleanly if it's large, or just blanket delete if policies allow
    # But since assessments wipe is needed first, let's just use the SDK bulk delete
    supabase.table("assessments").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("self_assessment_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
except Exception as e:
    print(f"Wipe error (might be empty already): {e}")

print("Inserting questions via SDK...")
try:
    response = supabase.table("self_assessment_questions").insert(records_to_insert).execute()
    print(f"Success! Inserted {len(response.data)} questions.")
except Exception as e:
    print(f"Insert Failed: {e}")
