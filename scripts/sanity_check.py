import pandas as pd
import requests
import math
import os

URL = "https://wqcdtdofwytfrcbhfycc.supabase.co/rest/v1"
KEY = "sb_publishable_4e_mNxmb1Up4mim2zWnO-w_rwW4lhGF"
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

def fetch_count(table, query=""):
    headers = HEADERS.copy()
    headers["Prefer"] = "count=exact"
    r = requests.head(f"{URL}/{table}?{query}", headers=headers)
    r.raise_for_status()
    # Content-Range will be like "0-0/123"
    content_range = r.headers.get("Content-Range")
    if content_range:
        return int(content_range.split('/')[-1])
    return 0

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
    print("\\n==================================================")
    print("DATA SANITY CHECK: EXCEL vs SUPABASE")
    print("==================================================\\n")

    discrepancies = 0

    def assert_count(name, expected, actual):
        nonlocal discrepancies
        match = "✅" if expected == actual else "❌"
        print(f"{match} {name:30} | Expected: {expected:4} | Actual: {actual:4}")
        if expected != actual:
            discrepancies += 1

    # 1. Term Tracking
    df_term = pd.read_excel('../data/Term Report CBP Conflexion BOW.xlsx', sheet_name='Sheet1')
    term_rows = []
    for _, row in df_term.iterrows():
        student_id = get_student_id(row['Student Name'])
        if student_id: term_rows.append(1)
    
    expected_term = len(term_rows)
    actual_term = fetch_count('term_tracking')
    assert_count("Term Tracking Records", expected_term, actual_term)

    # 2. Peer Feedback
    df_peer = pd.read_excel('../data/Peer Feedback Form (Responses) (1).xlsx', sheet_name='Peer feedback metrics ')
    peer_rows = []
    for _, row in df_peer.iterrows():
        giver_id = get_student_id(row['Your Name (So we can follow up if needed)'])
        recipient_id = get_student_id(row['Recipient Name (Who are you giving feedback to?)'])
        proj_id = get_project_id(row['Project Name'])
        if giver_id and recipient_id and proj_id:
            peer_rows.append(1)
    
    expected_peer = len(peer_rows)
    actual_peer = fetch_count('peer_feedback')
    assert_count("Peer Feedback Records", expected_peer, actual_peer)

    # 3. Assessment: Self (BXR)
    bxr_map = [
        ('commercial', 1), ('commercial', 2), ('commercial', 4),
        ('entrepreneurial', 1), ('entrepreneurial', 2), ('entrepreneurial', 4),
        ('marketing', 1), ('marketing', 3), ('marketing', 4),
        ('innovation', 1), ('innovation', 2), ('innovation', 4),
        ('operational', 1), ('operational', 2), ('operational', 3), ('operational', 4),
        ('commercial', 3), ('professional', 2), ('professional', 3), ('professional', 4)
    ]
    df_bxr = pd.read_excel('../data/Business X-Ray _ Responses.xlsx', sheet_name='Form Responses 1')
    bxr_assessments = 0
    q_cols = df_bxr.columns[2:22]
    for _, row in df_bxr.iterrows():
        student_id = get_student_id(row['Student Name'])
        if not student_id: continue
        for i, col in enumerate(q_cols):
            if pd.notna(row[col]):
                bxr_assessments += 1
                
    # 4. Assessment: Self (Accounts)
    acc_map = [
        ('commercial', 1), ('commercial', 3), ('commercial', 1), ('commercial', 3),
        ('operational', 3), ('operational', 4), ('professional', 2), ('professional', 3), ('professional', 4)
    ]
    df_acc = pd.read_excel('../data/Accounting Project \u2013 Readiness Self-Assessment (Responses).xlsx', sheet_name='Form responses 1')
    q_cols = [c for c in df_acc.columns if c.startswith('I') or c.startswith('Please rate')][:9]
    acc_scores_agg = {}
    name_col = [c for c in df_acc.columns if 'Name' in c][0]
    for _, row in df_acc.iterrows():
        student_id = get_student_id(row[name_col])
        if not student_id: continue
        for i, col in enumerate(q_cols):
            val = row[col]
            if pd.isna(val): continue
            try: float(val)
            except: continue
            domain_short, pnum = acc_map[i]
            param_id = param_map.get((domain_short, pnum))
            if param_id:
                key = (student_id, param_id)
                if key not in acc_scores_agg: acc_scores_agg[key] = []
                acc_scores_agg[key].append(1)
                
    acc_assessments = len(acc_scores_agg)
    expected_self = bxr_assessments + acc_assessments
    actual_self = fetch_count('assessments', 'assessment_type=eq.self')
    assert_count("Self Assessments (Total)", expected_self, actual_self)

    # 5. Assessment: Mentor Matrix
    matrix_file = '../data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
    xls = pd.ExcelFile(matrix_file)
    matrix_assessments = []
    
    target_tabs = {
        'Kickstart': 'Kickstart', 'Legacy': 'Legacy', 'Copy of Legacy': 'Legacy',
        'Murder Mystery': 'Marketing', 'Copy of Murder Mystery': 'Marketing',
        'Business Xray': 'Business X-Ray', 'Accounts': 'Accounts', 'SDP': 'SDP'
    }
    domain_mapping = {
        'commercial readiness': 'commercial', 'entrepreneurial readiness': 'entrepreneurial',
        'marketing readiness': 'marketing', 'innovation readiness': 'innovation',
        'operational readiness': 'operational', 'professional readiness': 'professional'
    }
    
    for sheet in xls.sheet_names:
        if sheet not in target_tabs: continue
        proj_id = get_project_id(target_tabs[sheet])
        if not proj_id: continue
        df = pd.read_excel(xls, sheet_name=sheet)
        if len(df) < 5: continue
        
        current_domain = None
        for _, row in df.iterrows():
            val0 = str(row.iloc[0]).strip().lower()
            if val0 in domain_mapping:
                current_domain = domain_mapping[val0]
                continue
            
            param_num = None
            val_trim = val0[:2]
            if val_trim in ['1.', '2.', '3.', '4.']:
                param_num = int(val_trim[0])
                
            if current_domain and param_num:
                param_id = param_map.get((current_domain, param_num))
                if not param_id: continue
                
                for col_idx in range(1, len(row)):
                    col_name = df.columns[col_idx]
                    student_id = get_student_id(col_name)
                    if not student_id: continue
                    
                    score_val = row.iloc[col_idx]
                    if pd.isna(score_val) or score_val in ['na', 'n/a', '-', '']: continue
                    try: float(score_val)
                    except: continue
                        
                    k = (student_id, proj_id, param_id, "mentor")
                    matrix_assessments.append(k)

    expected_mentor = len(set(matrix_assessments))
    actual_mentor = fetch_count('assessments', 'assessment_type=eq.mentor')
    assert_count("Mentor Assessments (Total)", expected_mentor, actual_mentor)

    print("\\n==================================================")
    if discrepancies == 0:
        print("✅ SUCCESS: All data points match exactly!")
    else:
        print(f"❌ WARNING: Found {discrepancies} discrepanc(ies). Please review.")
    print("==================================================\\n")

if __name__ == "__main__":
    main()
