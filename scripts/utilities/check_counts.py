import pandas as pd
from import_mentor import get_student_id, domain_mapping, param_map

matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
xls = pd.ExcelFile(matrix_file)

def check_sheet(sheet_name):
    print(f"\n--- Checking {sheet_name} ---")
    df = pd.read_excel(xls, sheet_name=sheet_name)
    
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
    
    print(f"  Mapped {len(student_cols)} students")
    
    current_domain = None
    extracted = 0
    skipped_rows = []
    
    for row_idx, row in df.iterrows():
        val0 = str(row.iloc[0]).strip().lower()
        if pd.isna(val0) or val0 == 'nan' or not val0: continue
        
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
            if not param_id:
                continue
                
            row_extracted = 0
            for col_idx, s_id in student_cols.items():
                score_val = row.iloc[col_idx]
                if pd.isna(score_val) or str(score_val).strip().lower() in ['na', 'n/a', '-', '']: continue
                try:
                    score = float(score_val)
                    row_extracted += 1
                except:
                    pass
            extracted += row_extracted
            print(f"  Extracted {row_extracted} scores for {current_domain} param {param_num}")
        else:
            if not found_domain and val_trim in ['1.', '2.', '3.', '4.'] and not current_domain:
                skipped_rows.append((row_idx, val0))
    
    print(f"  Total extracted: {extracted}")
    if skipped_rows:
        print(f"  Warning: Skipped some parameter rows because no domain was active:")
        for r in skipped_rows[:5]:
            print(f"    - Row {r[0]}: {r[1][:50]}")

check_sheet('Accounts')
check_sheet('Business Xray')
