import os
import pandas as pd

dir_path = "/Users/adityajhunjhunwala/Documents/Antigravity/AssessmentSystem"

for filename in os.listdir(dir_path):
    if filename.endswith(".xlsx") and not filename.startswith("~"):
        file_path = os.path.join(dir_path, filename)
        print(f"==== File: {filename} ====")
        try:
            xls = pd.ExcelFile(file_path)
            for sheet_name in xls.sheet_names:
                print(f"  -> Sheet (Tab): {sheet_name}")
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=5)
                    print(f"     Columns (Headers): {list(df.columns)}")
                    if not df.empty and df.index.name is not None:
                         print(f"     Index (Row Header): {df.index.name}")
                except Exception as e:
                    print(f"     Could not read headers: {e}")
        except Exception as e:
            print(f"  Error reading file: {e}")
        print()
