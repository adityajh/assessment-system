import pandas as pd
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
        data = json.loads(result.stdout)
        if "error" in data:
            print(f"SQL Error: {data['error']}")
        return data
    except Exception as e:
        print(f"Error running SQL: {e}")
        print(f"STDOUT: {result.stdout}")
        return []

print("1. Fetching Readiness Parameters...")
params_raw = run_sql("SELECT id, name FROM readiness_parameters")

# Lookup map: parameter_name -> parameter_id
param_map = {}
for p in params_raw:
    param_map[p['name']] = p['id']

print("1.5 Fetching Projects...")
projects_raw = run_sql("SELECT id, name FROM projects")
project_map = {p['name']: p['id'] for p in projects_raw}

# 1. First, we load the semantic mapping we generated
print("2. Formatting Semantic Mappings...")
with open("scripts/semantic_mapping.md", "r") as f:
    lines = f.readlines()

questions_to_insert = []

# Parse the Markdown table
for line in lines[4:]:
    if not line.strip(): continue
    parts = [p.strip() for p in line.split("|")[1:-1]]
    if len(parts) != 4: continue
    
    project, domain, param_name, question_text = parts
    
    # We only care about exact matches for insertion
    best_p_id = None
    for dm_name, dm_id in param_map.items():
        # Match ignoring case and trailing spaces
        if dm_name.lower().strip() == param_name.lower().strip() or dm_name.lower() in param_name.lower():
            best_p_id = dm_id
            break

    if best_p_id:
        questions_to_insert.append({
            "parameter_id": best_p_id,
            "question_text": question_text,
            "project_context": project,
            "project_id": project_map.get(project),
            "rating_scale_max": 10 if project in ["SDP", "Accounts"] else 5
        })
    else:
        print(f"WARNING: Unknown parameter '{param_name}' in semantic map")

# 2. Next, we load the direct mappings from the Mentor Matrix
print("3. Extracting Direct Mappings from Matrix...")
path = "data/Year 1 Assessment_Matrix (1) (1) (1).xlsx"
xl = pd.ExcelFile(path)

sheet_to_project = {
    "Kickstart": "Kickstart",
    "Legacy": "Legacy",
    "Murder Mystery": "Marketing"
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
            
        # Find parameter ID
        best_match_id = None
        for p_name, p_id in param_map.items():
            if p_name.lower() in param_cell.lower():
                best_match_id = p_id
                break
                
        if best_match_id and len(question_cell) > 10: # Ensure it's a real question
            questions_to_insert.append({
                "parameter_id": best_match_id,
                "question_text": question_cell.strip(),
                "project_context": project_name,
                "project_id": project_map.get(project_name),
                "rating_scale_max": 10 if project_name in ["SDP", "Accounts"] else 5
            })

print(f"4. Generating SQL to insert {len(questions_to_insert)} questions...")

sql_statements = [
    "DELETE FROM assessments;",
    "DELETE FROM self_assessment_questions;"
]

values = []
order_counter = {}

for q in questions_to_insert:
    clean_q = q['question_text'].replace("'", "''")
    clean_p = q['project_context'].replace("'", "''")
    p_id = q['project_id']
    
    if p_id not in order_counter:
        order_counter[p_id] = 1
    
    q_order = order_counter[p_id]
    order_counter[p_id] += 1
    
    values.append(f"('{p_id}', {q_order}, '{q['parameter_id']}', '{clean_q}', '{clean_p}', {q['rating_scale_max']})")

if values:
    sql_statements.append("INSERT INTO self_assessment_questions (project_id, question_order, parameter_id, question_text, project_context, rating_scale_max) VALUES \n" + ",\n".join(values) + ";")

final_sql = "\n".join(sql_statements)

with open("scripts/003_seed_questions.sql", "w") as f:
    f.write(final_sql)

print("Created scripts/003_seed_questions.sql! Safe to execute via Supabase dashboard or via API.")
