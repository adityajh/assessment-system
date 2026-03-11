import pandas as pd
import json
import subprocess
import os

PROJECT_ID = "wqcdtdofwytfrcbhfycc"
PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

def run_sql(query):
    payload = json.dumps({"query": query})
    cmd = ["curl", "-s", "-X", "POST", URL,
           "-H", f"Authorization: Bearer {PAT}",
           "-H", "Content-Type: application/json",
           "-d", payload]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

print("Fetching DB Parameters...")
domains_raw = run_sql("SELECT id, name FROM readiness_domains")
domains = {d['id']: d['name'] for d in domains_raw}
params_raw = run_sql("SELECT id, domain_id, name, description FROM readiness_parameters")

db_params = []
for p in params_raw:
    db_params.append({
        "id": p['id'],
        "domain": domains.get(p['domain_id'], "Unknown"),
        "name": p['name'],
        "desc": p['description']
    })

# Helper to find best parameter match based on keywords
def semantic_match(question_text, project_name):
    q = question_text.lower()
    
    # Fast manual heuristics based on known content
    if project_name == "Accounts":
        if "financial statements" in q and "interpret" in q: return "Financial Literacy & Analysis"
        if "record transactions" in q or "principles" in q: return "Accounting & Compliance"
        if "connect and reflect across" in q: return "Business & System Mapping"
        if "entries and recorded them" in q: return "Process & Project Management"
        if "financial statements as one system" in q: return "Business Model & Lean Execution" # Catchall
        if "structured process" in q: return "Process & Project Management"
        if "documented my work" in q or "communicated accounting outcomes" in q: return "Documentation & Reporting"
        if "honesty, responsibility, and professionalism" in q: return "Professional Conduct & Ethics"
        if "steadily improved my approach" in q: return "Continuous Growth & Reflection"
        if "engaged professionally with mentors" in q: return "Networking & Presence"
        
        # Fallback to general keyword matching
        if "financial" in q or "ratio" in q: return "Financial Literacy & Analysis"
        if "budget" in q or "forecast" in q: return "Budgeting & Forecasting"
        if "account" in q or "record" in q or "entry" in q: return "Accounting & Compliance"
        if "problem" in q or "solve" in q: return "Problem-Solving & Risk Management"
        if "document" in q or "report" in q: return "Documentation & Reporting"
        if "professional" in q or "ethic" in q: return "Professional Conduct & Ethics"
        if "reflect" in q or "improve" in q: return "Continuous Growth & Reflection"
        
    elif project_name == "SDP":
        if "agreement" in q and "responsibility" in q: return "Professional Conduct & Ethics"
        if "value of our work professionally" in q or "pitched our work" in q: return "Sales & Outreach"
        if "observe" in q or "interview" in q or "problem" in q: return "Customer-Centered Insights"
        if "tested ideas quickly" in q or "prototype" in q: return "Prototyping & Agile Development"
        if "convincing at least one owner" in q: return "Negotiation & Vendor Management"
        if "generated multiple ideas" in q or "directions creatively" in q: return "Ideation & Creativity"
        if "real customer insights" in q: return "Market Research & Opportunity Recognition"
        if "service works end-to-end" in q or "map" in q: return "Business & System Mapping"
        if "planning our work" in q or "coordinating" in q: return "Planning & Collaboration"
        if "didn't work as expected" in q or "adapt" in q: return "Problem-Solving & Risk Management"
        if "behaved professionally" in q: return "Professional Conduct & Ethics"
        if "structured process" in q or "track our work" in q: return "Process & Project Management"
        if "documented our research" in q: return "Documentation & Reporting"
        if "clarity on how" in q or "come together" in q: return "Career Planning & Awareness"
        if "reflected honestly" in q: return "Continuous Growth & Reflection"
        if "respectful professional relationships" in q: return "Networking & Presence"

    return "UNMAPPED"

mapping = []

# Process Accounts
print("Parsing Accounts.xlsx...")
accounts_df = pd.read_excel("data/Self Assessments/Accounting Project – Readiness Self-Assessment (Responses) (1).xlsx", nrows=0)
for col in accounts_df.columns:
    if col in ["Timestamp", "Student Name", "What is one specific skill or insight you gained from this accounting project?"]:
        continue
    
    mapped_param = semantic_match(col, "Accounts")
    domain_name = next((p['domain'] for p in db_params if p['name'] == mapped_param), "Unknown")
    
    mapping.append({
        "Project": "Accounts",
        "Domain": domain_name,
        "Parameter": mapped_param,
        "Question": col
    })

# Process SDP
print("Parsing SDP.xlsx...")
sdp_df = pd.read_excel("data/Self Assessments/SDP Self-Assessment (Responses) (1).xlsx", nrows=0)
for col in sdp_df.columns:
    if col in ["Timestamp", "Student Name"]:
        continue
        
    mapped_param = semantic_match(col, "SDP")
    domain_name = next((p['domain'] for p in db_params if p['name'] == mapped_param), "Unknown")
    
    mapping.append({
        "Project": "SDP",
        "Domain": domain_name,
        "Parameter": mapped_param,
        "Question": col
    })

# Output to Markdown
with open("scripts/semantic_mapping.md", "w") as f:
    f.write("## SDP and Accounts Question Semantic Mapping\n\n")
    f.write("| Project | Domain | Mapped Parameter | Self-Assessment Survey Question |\n")
    f.write("|---|---|---|---|\n")
    for m in mapping:
        f.write(f"| {m['Project']} | {m['Domain']} | {m['Parameter']} | {m['Question']} |\n")

print("Created scripts/semantic_mapping.md")
