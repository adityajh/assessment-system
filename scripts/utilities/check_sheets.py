import pandas as pd

matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
try:
    xls = pd.ExcelFile(matrix_file)
    print("Exact sheet names in file:")
    for sn in xls.sheet_names:
        print(f"'{sn}'")
except Exception as e:
    print("Error:", e)
