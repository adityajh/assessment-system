import pandas as pd

matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
try:
    xls = pd.ExcelFile(matrix_file)
    for sheet in ['SDP', 'Accounts']:
        df = pd.read_excel(xls, sheet_name=sheet, header=None)
        print(f"--- Top 2 rows of {sheet} sheet ---")
        for i in range(min(2, len(df))):
            row_vals = [str(x) for x in df.iloc[i].values]
            print(f"Row {i} len {len(row_vals)}: {row_vals}")
except Exception as e:
    print("Error:", e)
