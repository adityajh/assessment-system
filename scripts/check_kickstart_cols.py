import pandas as pd

matrix_file = 'data/Year 1 Assessment_Matrix (1) (1) (1).xlsx'
try:
    xls = pd.ExcelFile(matrix_file)
    df = pd.read_excel(xls, sheet_name='Kickstart')
    # Print the columns which represent student names
    print("Columns in Kickstart sheet (skipping first):")
    for col in df.columns[1:]:
        print(f"'{col}'")
except Exception as e:
    print("Error:", e)
