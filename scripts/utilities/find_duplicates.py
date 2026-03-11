import json
import subprocess
from dotenv import load_dotenv

load_dotenv("frontend/.env.local")

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
    try:
        return json.loads(result.stdout)
    except:
        return []

questions_raw = run_sql("SELECT q.question_text, q.project_context, p.name as param_name, d.name as domain_name FROM self_assessment_questions q JOIN readiness_parameters p ON q.parameter_id = p.id JOIN readiness_domains d ON p.domain_id = d.id")

# Group by project_context and param_name
duplicates = {}
for q in questions_raw:
    key = (q['project_context'], q['domain_name'], q['param_name'])
    if key not in duplicates:
        duplicates[key] = []
    duplicates[key].append(q['question_text'])

with open("docs/duplicate_mappings.md", "w") as f:
    f.write("# Self-Assessment Duplicate Mappings\n\n")
    f.write("The following questions were identified as mapping to the exact same Readiness Sub-Parameter within the same Project. When the import script ran, a student's scores for these overlapping questions were mathematically averaged together into a single master score for that parameter.\n\n")
    
    found_any = False
    for (project, domain, param), questions in duplicates.items():
        if len(questions) > 1:
            found_any = True
            f.write(f"### Project: {project}\n")
            f.write(f"**Domain:** {domain} ➔ **Parameter:** {param}\n\n")
            f.write("**Questions Averaged Together:**\n")
            for q in questions:
                f.write(f"- {q}\n")
            f.write("\n---\n\n")
    
    if not found_any:
        f.write("No duplicates found in the current mapping.")

print("Report generated at docs/duplicate_mappings.md")
