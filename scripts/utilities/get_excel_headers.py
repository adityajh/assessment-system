import pandas as pd
import json

path = "data/Year 1 Assessment_Matrix (1) (1) (1).xlsx"
xl = pd.ExcelFile(path)
data = {}
for sheet in xl.sheet_names:
    df = pd.read_excel(xl, sheet_name=sheet, nrows=5)
    data[sheet] = df.to_dict(orient="records")

with open("scripts/headers.json", "w") as f:
    json.dump(data, f, indent=2, default=str)
