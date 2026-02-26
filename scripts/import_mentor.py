import pandas as pd
import json
import subprocess
import os

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

def clean_name(name):
    if pd.isna(name): return ""
    return str(name).strip().lower()

print("1. Fetching Metadata...")
students = run_sql("SELECT id, canonical_name, aliases FROM students")
projects = run_sql("SELECT id, name, internal_name FROM projects")
domains_raw = run_sql("SELECT id, short_name FROM readiness_domains")
domains = {d['id']: d['short_name'] for d in domains_raw}

params_raw = run_sql("SELECT id, domain_id, param_number FROM readiness_parameters")

# Build parameter lookup: (domain_short_name, param_number) -> id
param_map = {}
for p in params_raw:
    domain_short = domains[p['domain_id']]
    param_map[(domain_short, p['param_number'])] = p['id']

def get_student_id(name_str):
    name_clean = clean_name(name_str)
    if not name_clean: return None
    for s in students:
        if clean_name(s['canonical_name']) == name_clean: return s['id']
        for alias in s['aliases']:
            if clean_name(alias) == name_clean: return s['id']
    return None

def get_project_id(name_str):
    name_clean = clean_name(name_str)
    if not name_clean: return None
    for p in projects:
        if clean_name(p['name']) == name_clean: return p['id']
        if p['internal_name'] and clean_name(p['internal_name']) == name_clean: return p['id']
    return None

print("2. Parsing Mentor Assessment Matrix...")
matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
xls = pd.ExcelFile(matrix_file)
matrix_assessments = []

target_tabs = {
    'Kickstart': 'Kickstart',
    'Legacy': 'Legacy',
    'Copy of Legacy': 'Legacy',
    'Murder Mystery': 'Marketing',
    'Copy of Murder Mystery': 'Marketing',
    'Business Xray': 'Business X-Ray',
    'Accounts': 'Accounts',
    'SDP': 'SDP'
}

domain_mapping = {
    'commercial readiness': 'commercial',
    'entrepreneurial readiness': 'entrepreneurial',
    'marketing readiness': 'marketing',
    'innovation readiness': 'innovation',
    'operational readiness': 'operational',
    'operations readiness': 'operational',
    'professional readiness': 'professional'
}

for sheet in xls.sheet_names:
    if sheet not in target_tabs: continue
    proj_id = get_project_id(target_tabs[sheet])
    if not proj_id: continue
    
    df = pd.read_excel(xls, sheet_name=sheet)
    if len(df) < 5: continue
    
    current_domain = None
    header_val0 = str(df.columns[0]).strip().lower()
    for dm_key, dm_val in domain_mapping.items():
        if header_val0 == dm_key or header_val0.startswith(dm_key):
            current_domain = dm_val
            break
            
    # Pre-compute student mappings for this sheet
    student_cols = {}
    for col_idx in range(1, len(df.columns)):
        s_id = get_student_id(df.columns[col_idx])
        if s_id:
            student_cols[col_idx] = s_id
        else:
            for r_idx in range(min(5, len(df))):
                s_id = get_student_id(df.iloc[r_idx, col_idx])
                if s_id:
                    student_cols[col_idx] = s_id
                    break
                    
    for _, row in df.iterrows():
        val0 = str(row.iloc[0]).strip().lower()
        
        found_domain = False
        for dm_key, dm_val in domain_mapping.items():
            if val0 == dm_key or val0.startswith(dm_key):
                current_domain = dm_val
                found_domain = True
                break
                
        if found_domain:
            continue
        
        param_num = None
        val_trim = val0[:2]
        if val_trim in ['1.', '2.', '3.', '4.']:
            param_num = int(val_trim[0])
            
        if current_domain and param_num:
            param_id = param_map.get((current_domain, param_num))
            if not param_id: continue
            
            for col_idx, student_id in student_cols.items():
                
                score_val = row.iloc[col_idx]
                if pd.isna(score_val) or str(score_val).strip().lower() in ['na', 'n/a', '-', '']: continue
                try:
                    score = float(score_val)
                    if score > 10:
                        score = score / 10.0 # Some stray 1-100 inputs or typos
                    
                    actual_scale_max = 5 if 'kickstart' in target_tabs[sheet].lower() else 10
                    # Normalize to 1-10 scale
                    normalized = ((score - 1) / (actual_scale_max - 1)) * 9 + 1
                    
                except:
                    continue
                    
                matrix_assessments.append({
                    "student_id": student_id,
                    "project_id": proj_id,
                    "parameter_id": param_id,
                    "assessment_type": "mentor",
                    "raw_score": score,
                    "raw_scale_min": 1,
                    "raw_scale_max": actual_scale_max,
                    "normalized_score": round(normalized, 2),
                    "source_file": "Year 1 Assessment Matrix.xlsx"
                })
                
# Deduplicate
dedup = {}
for a in matrix_assessments:
    k = (a['student_id'], a['project_id'], a['parameter_id'], a['assessment_type'])
    dedup[k] = a
    
assessments_to_insert = list(dedup.values())
print(f"Generated {len(assessments_to_insert)} unique mentor records.")

print("3. Generating SQL...")
batch_size = 50
sql_batches = ["DELETE FROM assessments WHERE assessment_type = 'mentor';"]

for i in range(0, len(assessments_to_insert), batch_size):
    batch = assessments_to_insert[i:i+batch_size]
    values = []
    for a in batch:
        clean_file = a['source_file'].replace('"', '').replace("'", "")
        # Note: self_assessment_question_id is NULL for mentor assessments
        v = f"('{a['student_id']}', '{a['project_id']}', '{a['parameter_id']}', 'mentor', NULL, {a['raw_score']}, 1, 10, {a['normalized_score']}, '{clean_file}')"
        values.append(v)
        
    stmt = "INSERT INTO assessments (student_id, project_id, parameter_id, assessment_type, self_assessment_question_id, raw_score, raw_scale_min, raw_scale_max, normalized_score, source_file) VALUES " + ", \n".join(values) + ";"
    sql_batches.append(stmt)
    
final_sql = "\n\n".join(sql_batches)

with open("scripts/005_insert_mentor_assessments.sql", "w") as f:
    f.write(final_sql)

print("Created scripts/005_insert_mentor_assessments.sql")
