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
        data = json.loads(result.stdout)
        if hasattr(data, "get") and data.get("error"):
             print(f"API Error for {query}: {data['error']}")
        return data
    except Exception as e:
        print(f"Failed to parse for {query}")
        return []

print("1. Fetching Metadata...")
students_raw = run_sql("SELECT id, canonical_name, aliases FROM students")
projects_raw = run_sql("SELECT id, name, internal_name FROM projects")
questions_raw = run_sql("SELECT id, parameter_id, question_text, project_context FROM self_assessment_questions")

print(f"DEBUG: questions_raw is type {type(questions_raw)}")
if isinstance(questions_raw, dict): print(f"DEBUG DICT: {questions_raw}")
if isinstance(questions_raw, list): 
    sdp_qs = [q for q in questions_raw if q['project_context'] == 'SDP']
    print(f"DEBUG SDP Q COUNT: {len(sdp_qs)}")
    if len(sdp_qs) > 0:
        print(f"DEBUG FIRST SDP Q: {sdp_qs[0]}")
    accounts_qs = [q for q in questions_raw if q['project_context'] == 'Accounts']
    print(f"DEBUG Accounts Q COUNT: {len(accounts_qs)}")

def clean_name(name):
    if pd.isna(name): return ""
    return str(name).strip().lower()

def get_student_id(name_str):
    name_clean = clean_name(name_str)
    if not name_clean: return None
    for s in students_raw:
        if clean_name(s['canonical_name']) == name_clean: return s['id']
        for alias in s['aliases']:
            if clean_name(alias) == name_clean: return s['id']
    return None

def get_project_id(name_str):
    name_clean = clean_name(name_str)
    if not name_clean: return None
    for p in projects_raw:
        if clean_name(p['name']) == name_clean: return p['id']
        if p['internal_name'] and clean_name(p['internal_name']) == name_clean: return p['id']
    return None

import re

def normalize_text(text):
    if pd.isna(text): return ""
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9]', '', text)
    return text

import difflib

def normalize_text(text):
    if pd.isna(text): return ""
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9]', '', text)
    return text

def get_question_meta(question_text, project_context):
    q_norm = normalize_text(question_text)
    
    best_match = None
    best_ratio = 0
    best_q_id = None
    best_p_id = None
    
    for q in questions_raw:
        if q['project_context'] == project_context:
            db_norm = normalize_text(q['question_text'])
            ratio = difflib.SequenceMatcher(None, q_norm, db_norm).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = db_norm
                best_q_id = q['id']
                best_p_id = q['parameter_id']
                
    if best_ratio > 0.8:
        return best_q_id, best_p_id
        
    print(f"FAILED MATCH (Best ratio {best_ratio:.2f}): [{project_context}] '{q_norm}'")
    if best_match:
        print(f"  Closest DB question: '{best_match}'")
    return None, None

file_mapping = {
    "Accounting Project – Readiness Self-Assessment (Responses) (1).xlsx": "Accounts",
    "Business X-Ray _ Responses (1).xlsx": "Business X-Ray",
    "Kickstart Assessment  (Responses) (1).xlsx": "Kickstart",
    "Legacy Assessment - Readiness Self-Assessment (Responses) (2).xlsx": "Legacy",
    "Marketing Project - Readiness Self-Assessment (Responses) (1).xlsx": "Marketing",
    "SDP Self-Assessment (Responses) (1).xlsx": "SDP"
}

data_dir = "data/Self Assessments"
assessments_dict = {}

print("2. Parsing Excel Files...")
for filename, project_name in file_mapping.items():
    path = os.path.join(data_dir, filename)
    if not os.path.exists(path):
        print(f"File missing: {path}")
        continue
        
    project_id = get_project_id(project_name)
    if not project_id:
        print(f"Could not find project ID for {project_name}")
        continue
        
    df = pd.read_excel(path)
    
    # Identify student name column
    name_col = None
    for col in df.columns:
        if "name" in col.lower() or "email" not in col.lower() and col.lower() != "timestamp":
            # Just guess the first column that looks like a name
            name_col = col
            break
            
    if "Student Name" in df.columns: name_col = "Student Name"
    elif "Your Name" in df.columns: name_col = "Your Name"
    elif "Name" in df.columns: name_col = "Name"
    
    if not name_col:
        print(f"Could not find Name column for {filename}")
        continue
        
    for _, row in df.iterrows():
        student_id = get_student_id(row[name_col])
        if not student_id:
            print(f"Student not found: {row[name_col]} in {project_name}")
            continue
            
        for col in df.columns:
            if col in ["Timestamp", name_col, "Email", "What is one specific skill or insight you gained from this accounting project?"]:
                continue
                
            raw_score = row[col]
            if pd.isna(raw_score) or str(raw_score).strip() == "":
                continue
                
            try:
                score = float(raw_score)
            except:
                continue
                
            q_id, param_id = get_question_meta(col, project_name)
            
            if not q_id:
                # In Business X-Ray, questions changed slightly, try a softer match
                fallback_qid = None
                fallback_pid = None
                for q in questions_raw:
                    if q['project_context'] == project_name and q['question_text'].lower()[:20] == str(col).strip().lower()[:20]:
                        fallback_qid = q['id']
                        fallback_pid = q['parameter_id']
                        break
                
                if fallback_qid:
                    q_id = fallback_qid
                    param_id = fallback_pid
                else:
                    print(f"Warning: Could not map question in {project_name}: {col}")
                    continue
            
            scale_max = 10 if project_name in ["SDP", "Accounts"] else 5
            norm_score = ((score - 1) / (scale_max - 1)) * 9 + 1
            
            key = (student_id, project_id, param_id)
            if key not in assessments_dict:
                assessments_dict[key] = {
                    "student_id": student_id,
                    "project_id": project_id,
                    "parameter_id": param_id,
                    "assessment_type": "self",
                    "self_assessment_question_id": q_id,
                    "raw_score_sum": score,
                    "raw_score_count": 1,
                    "raw_scale_max": scale_max,
                    "normalized_score_sum": norm_score,
                    "source_file": filename
                }
            else:
                assessments_dict[key]["raw_score_sum"] += score
                assessments_dict[key]["raw_score_count"] += 1
                assessments_dict[key]["normalized_score_sum"] += norm_score

assessments_to_insert = []
for k, v in assessments_dict.items():
    v["raw_score"] = round(v["raw_score_sum"] / v["raw_score_count"], 2)
    v["normalized_score"] = round(v["normalized_score_sum"] / v["raw_score_count"], 2)
    assessments_to_insert.append(v)

print(f"Generated {len(assessments_to_insert)} unique self-assessment records.")

print("3. Generating SQL...")
batch_size = 50
sql_batches = ["DELETE FROM assessments WHERE assessment_type = 'self';"]

for i in range(0, len(assessments_to_insert), batch_size):
    batch = assessments_to_insert[i:i+batch_size]
    values = []
    for a in batch:
        clean_file = a['source_file'].replace('"', '').replace("'", "")
        v = f"('{a['student_id']}', '{a['project_id']}', '{a['parameter_id']}', 'self', '{a['self_assessment_question_id']}', {a['raw_score']}, 1, {a['raw_scale_max']}, {a['normalized_score']}, '{clean_file}')"
        values.append(v)
        
    stmt = "INSERT INTO assessments (student_id, project_id, parameter_id, assessment_type, self_assessment_question_id, raw_score, raw_scale_min, raw_scale_max, normalized_score, source_file) VALUES " + ", \n".join(values) + ";"
    sql_batches.append(stmt)
    
final_sql = "\n\n".join(sql_batches)

with open("scripts/004_insert_self_assessments.sql", "w") as f:
    f.write(final_sql)

print("Created scripts/004_insert_self_assessments.sql")
