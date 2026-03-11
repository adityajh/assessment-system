import pandas as pd

matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
try:
    xls = pd.ExcelFile(matrix_file)
    df = pd.read_excel(xls, sheet_name='Accounts', header=None)
    print("All rows in Accounts first col:")
    for idx, row in df.iterrows():
        val = str(row.iloc[0]).strip()
        if len(val) > 0 and 'nan' not in val.lower():
            print(f"Row {idx}: {val[:60]}...")
except Exception as e:
    print("Error:", e)
