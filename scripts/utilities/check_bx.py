import pandas as pd

matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
xls = pd.ExcelFile(matrix_file)

df = pd.read_excel(xls, sheet_name='Business Xray')
print("--- Business Xray ---")
for idx, row in df.iterrows():
    val0 = str(row.iloc[0]).strip().lower()
    if val0.startswith('3. '):
        row_vals = [str(x) for x in row.iloc[2:7]] # Look at a few student score columns
        print(f"Param 3: {val0[:30]} | Scores: {row_vals}")
    if val0.startswith('2. '):
        row_vals = [str(x) for x in row.iloc[2:7]] # Look at a few student score columns
        print(f"Param 2: {val0[:30]} | Scores: {row_vals}")
