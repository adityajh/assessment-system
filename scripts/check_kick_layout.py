import pandas as pd

matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
try:
    xls = pd.ExcelFile(matrix_file)
    df = pd.read_excel(xls, sheet_name='Kickstart', header=None)
    print("Top 10 rows of Kickstart sheet:")
    for i in range(10):
        row_vals = [str(x) for x in df.iloc[i].values[:5]]
        print(f"Row {i}: {row_vals}")
except Exception as e:
    print("Error:", e)
