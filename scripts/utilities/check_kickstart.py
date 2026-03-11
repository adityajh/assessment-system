import pandas as pd

matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
try:
    xls = pd.ExcelFile(matrix_file)
    df = pd.read_excel(xls, sheet_name='Kickstart')
    print("First column values (first 30 rows):")
    for idx, val in enumerate(df.iloc[:30, 0]):
        print(f"Row {idx}: '{val}'")
except Exception as e:
    print("Error:", e)
