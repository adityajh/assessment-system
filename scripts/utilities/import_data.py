import pandas as pd
import requests
import math
import os

URL = "https://wqcdtdofwytfrcbhfycc.supabase.co/rest/v1"
KEY = "your_supabase_anon_key_here"
HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def fetch_table(table, select="*"):
    r = requests.get(f"{URL}/{table}?select={select}", headers=HEADERS)
    r.raise_for_status()
    return r.json()

def insert_rows(table, rows, on_conflict=None):
    if not rows: return
    headers = HEADERS.copy()
    if on_conflict:
        headers["Prefer"] = f"return=minimal, resolution=merge-duplicates"
        url = f"{URL}/{table}?on_conflict={on_conflict}"
    else:
        url = f"{URL}/{table}"
    
    # Send in batches of 100 to avoid large payloads just in case
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        r = requests.post(url, headers=headers, json=batch)
        try:
            r.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print(f"Error inserting into {table}: {r.text}")
            raise e

def clean_name(name):
    if pd.isna(name): return ""
    return str(name).strip().lower()

print("Fetching metadata from Supabase...")
students = fetch_table('students', 'id,canonical_name,aliases')
projects = fetch_table('projects', 'id,name,internal_name')
domains = {d['id']: d['short_name'] for d in fetch_table('readiness_domains')}
params = fetch_table('readiness_parameters', 'id,domain_id,param_number')

# Build parameter lookup: (domain_short_name, param_number) -> id
param_map = {}
for p in params:
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

def main():
    print("="*50)
    print("1. Importing Term Tracking...")
    df_term = pd.read_excel('../data/Term Report CBP Conflexion BOW.xlsx', sheet_name='Sheet1')
    term_rows = []
    for _, row in df_term.iterrows():
        student_name = row['Student Name']
        student_id = get_student_id(student_name)
        if not student_id:
            print(f"Student not found: {student_name}")
            continue
        cbp = 0 if pd.isna(row['CBP']) else int(row['CBP'])
        conflexion = 0 if pd.isna(row['Conflexion']) else int(row['Conflexion'])
        bow = 0.0 if pd.isna(row['BOW']) else float(row['BOW'])
        
        term_rows.append({
            "student_id": student_id,
            "cbp_count": cbp,
            "conflexion_count": conflexion,
            "bow_score": bow,
            "term": "Year 1"
        })
    insert_rows('term_tracking', term_rows, on_conflict="student_id,term")
    print(f"✅ Imported {len(term_rows)} term tracking records.")

    print("="*50)
    print("2. Importing Peer Feedback...")
    df_peer = pd.read_excel('../data/Peer Feedback Form (Responses) (1).xlsx', sheet_name='Peer feedback metrics ')
    peer_rows = []
    for _, row in df_peer.iterrows():
        giver_name = row['Your Name (So we can follow up if needed)']
        recipient_name = row['Recipient Name (Who are you giving feedback to?)']
        proj_name = row['Project Name']
        
        giver_id = get_student_id(giver_name)
        recipient_id = get_student_id(recipient_name)
        proj_id = get_project_id(proj_name)
        
        if not (giver_id and recipient_id and proj_id):
            continue
            
        def safe_int(val):
            if pd.isna(val): return None
            try: return int(val)
            except: return None
            
        peer_rows.append({
            "recipient_id": recipient_id,
            "giver_id": giver_id,
            "project_id": proj_id,
            "quality_of_work": safe_int(row['Quality of Work ']),
            "initiative_ownership": safe_int(row['Initiative & Ownership ']),
            "communication": safe_int(row['Communication ']),
            "collaboration": safe_int(row['Collaboration ']),
            "growth_mindset": safe_int(row['Growth Mindset ']),
        })
    insert_rows('peer_feedback', peer_rows, on_conflict="recipient_id,giver_id,project_id")
    print(f"✅ Imported {len(peer_rows)} peer feedback records.")

    print("="*50)
    print("3. Importing Business X-Ray Self-Assessment...")
    # BXR Mapping: index in Qs (0 to 19) -> (domain, param_number)
    # 20 questions starts from 4th column.
    bxr_map = [
        ('commercial', 1), ('commercial', 2), ('commercial', 4),
        ('entrepreneurial', 1), ('entrepreneurial', 2), ('entrepreneurial', 4),
        ('marketing', 1), ('marketing', 3), ('marketing', 4),
        ('innovation', 1), ('innovation', 2), ('innovation', 4),
        ('operational', 1), ('operational', 2), ('operational', 3), ('operational', 4),
        ('commercial', 3), ('professional', 2), ('professional', 3), ('professional', 4)
    ]
    df_bxr = pd.read_excel('../data/Business X-Ray _ Responses.xlsx', sheet_name='Form Responses 1')
    bxr_proj_id = get_project_id('Business X-Ray')
    bxr_assessments = []
    
    # columns are Timestamp, Student Name, then 20 questions
    q_cols = df_bxr.columns[2:22]
    for _, row in df_bxr.iterrows():
        student_id = get_student_id(row['Student Name'])
        if not student_id: continue
        
        for i, col in enumerate(q_cols):
            val = row[col]
            if pd.isna(val): continue
            score = float(val)
            norm = (score - 1) / (5 - 1) * 9 + 1
            
            domain_short, pnum = bxr_map[i]
            param_id = param_map.get((domain_short, pnum))
            
            bxr_assessments.append({
                "student_id": student_id,
                "project_id": bxr_proj_id,
                "parameter_id": param_id,
                "assessment_type": "self",
                "raw_score": score,
                "raw_scale_min": 1,
                "raw_scale_max": 5,
                "normalized_score": norm,
                "source_file": "Business X-Ray _ Responses.xlsx"
            })
    insert_rows('assessments', bxr_assessments, on_conflict="student_id,project_id,parameter_id,assessment_type")
    print(f"✅ Imported {len(bxr_assessments)} Business X-Ray self-assessments.")

    print("="*50)
    print("4. Importing Accounting Self-Assessment...")
    acc_map = [
        ('commercial', 1), ('commercial', 3), ('commercial', 1), ('commercial', 3),
        ('operational', 3), ('operational', 4), ('professional', 2), ('professional', 3), ('professional', 4)
    ]
    df_acc = pd.read_excel('../data/Accounting Project \u2013 Readiness Self-Assessment (Responses).xlsx', sheet_name='Form responses 1')
    acc_proj_id = get_project_id('Accounts')
    acc_assessments = []
    
    q_cols = [c for c in df_acc.columns if c.startswith('I') or c.startswith('Please rate')]
    q_cols = q_cols[:9] # first 9 are scored
    
    acc_scores_agg = {} # (student_id, param_id) -> list of scores
    
    # Name column is 'Preferred Name (First and Last)' roughly.
    name_col = [c for c in df_acc.columns if 'Name' in c][0]
    for _, row in df_acc.iterrows():
        student_id = get_student_id(row[name_col])
        if not student_id: continue
        
        for i, col in enumerate(q_cols):
            val = row[col]
            if pd.isna(val): continue
            try: score = float(val)
            except: continue
            
            domain_short, pnum = acc_map[i]
            param_id = param_map.get((domain_short, pnum))
            if not param_id: continue
            
            key = (student_id, param_id)
            if key not in acc_scores_agg:
                acc_scores_agg[key] = []
            acc_scores_agg[key].append(score)
            
    for (student_id, param_id), scores in acc_scores_agg.items():
        avg_score = sum(scores) / len(scores)
        acc_assessments.append({
            "student_id": student_id,
            "project_id": acc_proj_id,
            "parameter_id": param_id,
            "assessment_type": "self",
            "raw_score": avg_score,
            "raw_scale_min": 1,
            "raw_scale_max": 10,
            "normalized_score": avg_score, # Already 1-10
            "source_file": "Accounting Project \u2013 Readiness Self-Assessment (Responses).xlsx"
        })
        
    insert_rows('assessments', acc_assessments, on_conflict="student_id,project_id,parameter_id,assessment_type")
    print(f"✅ Imported {len(acc_assessments)} Accounting self-assessments.")

    print("="*50)
    print("5. Importing Mentor Assessment Matrix...")
    matrix_file = '../data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
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
        'professional readiness': 'professional'
    }
    
    for sheet in xls.sheet_names:
        if sheet not in target_tabs: continue
        proj_id = get_project_id(target_tabs[sheet])
        if not proj_id: continue
        
        df = pd.read_excel(xls, sheet_name=sheet)
        if len(df) < 5: continue
        
        # Parse matrix row by row
        current_domain = None
        for _, row in df.iterrows():
            val0 = str(row.iloc[0]).strip().lower()
            if val0 in domain_mapping:
                current_domain = domain_mapping[val0]
                continue
            
            # Identify sub-parameter numbering
            param_num = None
            if val0.startswith('1.') or val0.startswith('1 '): param_num = 1
            elif val0.startswith('2.') or val0.startswith('2 '): param_num = 2
            elif val0.startswith('3.') or val0.startswith('3 '): param_num = 3
            elif val0.startswith('4.') or val0.startswith('4 '): param_num = 4
            elif current_domain and len(val0) > 10 and not pd.isna(row.iloc[0]): 
                # Could be a param, need to match name loosely or keep track of count
                pass
                
            # Specifically mapping based on known row text prefixes:
            val_trim = val0[:2]
            if val_trim in ['1.', '2.', '3.', '4.']:
                param_num = int(val_trim[0])
                
            if current_domain and param_num:
                param_id = param_map.get((current_domain, param_num))
                if not param_id: continue
                
                # Now go through columns matching students
                for col_idx in range(1, len(row)):
                    col_name = df.columns[col_idx]
                    student_id = get_student_id(col_name)
                    if not student_id: continue
                    
                    score_val = row.iloc[col_idx]
                    if pd.isna(score_val) or score_val in ['na', 'n/a', '-', '']: continue
                    try:
                        score = float(score_val)
                    except:
                        continue
                        
                    matrix_assessments.append({
                        "student_id": student_id,
                        "project_id": proj_id,
                        "parameter_id": param_id,
                        "assessment_type": "mentor",
                        "raw_score": score,
                        "raw_scale_min": 1,
                        "raw_scale_max": 10,
                        "normalized_score": score,
                        "source_file": matrix_file
                    })
                    
    # Only keep the last inserted score in case of duplicates from 'Copy of X' sheets
    
    # Deduplicate in python before sending since batch API might not like multiple rows with same pk in one batch
    dedup = {}
    for a in matrix_assessments:
        k = (a['student_id'], a['project_id'], a['parameter_id'], a['assessment_type'])
        dedup[k] = a
        
    insert_rows('assessments', list(dedup.values()), on_conflict="student_id,project_id,parameter_id,assessment_type")
    print(f"✅ Imported {len(dedup)} mentor assessments.")

    print("="*50)
    print("ALL DONE.")

if __name__ == "__main__":
    main()
