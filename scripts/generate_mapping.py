import pandas as pd
import subprocess
import json

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
    except Exception as e:
        print(f"Error running SQL: {e}")
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        raise

print("Fetching db parameters via raw SQL...")
domains_raw = run_sql("SELECT id, name FROM readiness_domains")
domains = {d['id']: d['name'] for d in domains_raw}

params_raw = run_sql("SELECT id, domain_id, name, description FROM readiness_parameters")

db_params = []
for p in params_raw:
    db_params.append({
        "id": p['id'],
        "domain": domains.get(p['domain_id'], "Unknown"),
        "name": p['name'],
        "desc": p['description']
    })

path = "data/Year 1 Assessment_Matrix (1) (1) (1).xlsx"
xl = pd.ExcelFile(path)

mapping = []

# Map sheet names to project names in DB
sheet_to_project = {
    "Kickstart": "Kickstart",
    "Legacy": "Legacy",
    "Murder Mystery": "Marketing",
    "Business X Ray": "Business X-Ray",
    "Accounts": "Accounts",
    "SDP": "SDP"
}

for sheet in xl.sheet_names:
    if sheet not in sheet_to_project:
        continue
    
    project_name = sheet_to_project[sheet]
    df = pd.read_excel(xl, sheet_name=sheet)
    
    col_param = df.columns[0]
    col_question = df.columns[1]
    
    for idx, row in df.iterrows():
        param_cell = str(row[col_param]) if pd.notna(row[col_param]) else ""
        question_cell = str(row[col_question]) if pd.notna(row[col_question]) else ""
        
        if not question_cell or not param_cell.strip():
            continue
            
        best_match = None
        for dp in db_params:
            if dp['name'].lower() in param_cell.lower():
                best_match = dp
                break
                
        if best_match:
            mapping.append({
                "Project": project_name,
                "Parameter": best_match['name'],
                "Domain": best_match['domain'],
                "Question": question_cell.strip()
            })

with open("scripts/mapping_plan.md", "w") as f:
    f.write("## Question to Parameter Mapping Plan\n\n")
    f.write("| Project | Domain | Parameter | Self-Assessment Question |\n")
    f.write("|---|---|---|---|\n")
    for m in mapping:
        f.write(f"| {m['Project']} | {m['Domain']} | {m['Parameter']} | {m['Question']} |\n")

print("Created scripts/mapping_plan.md")
