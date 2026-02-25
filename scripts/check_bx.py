import pandas as pd
import json

df = pd.read_excel("data/Self Assessments/Business X-Ray _ Responses (1).xlsx")
# Let's see the headers
qs = [c for c in df.columns if len(str(c)) > 20 and 'how' in str(c).lower()]
print(json.dumps(qs, indent=2))
