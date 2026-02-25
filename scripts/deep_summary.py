import os
import pandas as pd

dir_path = "/Users/adityajhunjhunwala/Documents/Antigravity/AssessmentSystem"

# 1. Business X-Ray Responses
print("=" * 80)
print("1. BUSINESS X-RAY RESPONSES")
fp = os.path.join(dir_path, "Business X-Ray _ Responses.xlsx")
df = pd.read_excel(fp, sheet_name="Form Responses 1")
print(f"Shape: {df.shape}")
print(f"Students: {sorted(df['Student Name'].dropna().unique().tolist())}")
# show column names only (short)
for i, col in enumerate(df.columns):
    print(f"  [{i}] {col[:80]}...")
print(f"Value example row 0: {df.iloc[0,2:].tolist()}")

# 2. Accounting Self Assessment
print("\n" + "=" * 80)
print("2. ACCOUNTING SELF-ASSESSMENT")
fp = os.path.join(dir_path, "Accounting Project – Readiness Self-Assessment (Responses).xlsx")
df = pd.read_excel(fp, sheet_name="Form responses 1")
print(f"Shape: {df.shape}")
print(f"Students: {sorted(df['Student Name'].dropna().unique().tolist())}")
for i, col in enumerate(df.columns):
    print(f"  [{i}] {col[:80]}...")
print(f"Value example row 0: {df.iloc[0,2:].tolist()}")

# 3. Peer Feedback
print("\n" + "=" * 80)
print("3. PEER FEEDBACK METRICS")
fp = os.path.join(dir_path, "Peer Feedback Form (Responses) (1).xlsx")
df = pd.read_excel(fp, sheet_name="Peer feedback metrics ")
print(f"Shape: {df.shape}")
print(f"Recipients: {sorted(df['Recipient Name (Who are you giving feedback to?)'].dropna().unique().tolist())}")
print(f"Projects: {sorted(df['Project Name'].dropna().unique().tolist())}")
for col in ['Quality of Work ', 'Initiative & Ownership ', 'Communication ', 'Collaboration ', 'Growth Mindset ']:
    if col in df.columns:
        print(f"  {col.strip()}: min={df[col].min()}, max={df[col].max()}, dtype={df[col].dtype}")

# 4. Term Report
print("\n" + "=" * 80)
print("4. TERM REPORT")
fp = os.path.join(dir_path, "Term Report CBP Conflexion BOW.xlsx")
df = pd.read_excel(fp, sheet_name="Sheet1")
print(f"Shape: {df.shape}")
print(df.to_string())

# 5. Consolidated Assessment
print("\n" + "=" * 80)
print("5. CONSOLIDATED ASSESSMENT")
fp = os.path.join(dir_path, "Year 1 Consolidated Assessment Final 2026 (3).xlsx")
xls = pd.ExcelFile(fp)
print(f"All tabs: {xls.sheet_names}")

df_pq = pd.read_excel(fp, sheet_name="Power query")
print(f"\nPower query shape: {df_pq.shape}")
print(f"Students: {sorted(df_pq['Student Name'].dropna().unique().tolist())}")
print(f"Types: {sorted(df_pq['Type'].dropna().unique().tolist())}")
print(f"Projects: {sorted(df_pq['Project Name'].dropna().unique().tolist())}")
print(f"Readiness Types: {sorted(df_pq['Readiness Type'].dropna().unique().tolist())}")
print(f"Rating range: min={df_pq['Rating'].min()}, max={df_pq['Rating'].max()}")
print(f"Sample:\n{df_pq.head(5).to_string()}")

df_fs = pd.read_excel(fp, sheet_name="Final Score")
print(f"\nFinal Score shape: {df_fs.shape}")
print(f"Types: {sorted(df_fs['Type'].dropna().unique().tolist())}")
print(f"Projects: {sorted(df_fs['Project Name'].dropna().unique().tolist())}")
readiness_cols = ['Commercial Readiness','Entrepreneurial Readiness','Marketing','Innovation Readiness','Operational Readiness','Professional Readiness']
for col in readiness_cols:
    if col in df_fs.columns:
        print(f"  {col}: min={df_fs[col].min()}, max={df_fs[col].max()}")
print(f"Sample:\n{df_fs.head(5).to_string()}")

# 6. Assessment Matrix - look at unique assessment parameters (row-level)
print("\n" + "=" * 80)
print("6. ASSESSMENT MATRIX")
fp = os.path.join(dir_path, "Year 1 Assessment_Matrix (1) (1) (1).xlsx")

# Get assessment params from SDP tab (it has a cleaner structure)
df_sdp = pd.read_excel(fp, sheet_name="SDP", header=None)
print(f"\nSDP shape: {df_sdp.shape}")
print(f"First column values (assessment params):")
for val in df_sdp[0].dropna().unique():
    print(f"  - {str(val)[:100]}")

# Kickstart
df_ks = pd.read_excel(fp, sheet_name="Kickstart", header=None)
print(f"\nKickstart shape: {df_ks.shape}")
print(f"First column values:")
for val in df_ks[0].dropna().unique():
    print(f"  - {str(val)[:100]}")

# Business Xray
df_bx = pd.read_excel(fp, sheet_name="Business Xray", header=None)
print(f"\nBusiness Xray shape: {df_bx.shape}")
print(f"First column values:")
for val in df_bx[0].dropna().unique():
    print(f"  - {str(val)[:100]}")

# Students in each project tab
for tab in ['Legacy', 'Murder Mystery', 'Business Xray', 'SDP', 'Accounts']:
    df = pd.read_excel(fp, sheet_name=tab, header=None)
    # students are typically in row 0, from col 2 onwards
    students = [str(v) for v in df.iloc[0, 2:].dropna().tolist()]
    print(f"\nStudents in {tab}: {students}")
