import pandas as pd
import sys

matrix_file = 'data/Self Assessments/Self_Assessment_Consolidated.xlsx'
try:
    xls = pd.ExcelFile(matrix_file)
    print("Sheets found:", xls.sheet_names)
    
    for sheet in xls.sheet_names[2:4]:
        print(f"\n--- Top 3 rows of '{sheet}' ---")
        df = pd.read_excel(xls, sheet_name=sheet)
        print("Columns:", df.columns.tolist())
        for i in range(min(3, len(df))):
            row_vals = [str(x) for x in df.iloc[i].tolist()]
            print(f"Row {i}: {row_vals}")
except Exception as e:
    print(f"Error reading {matrix_file}: {e}")
