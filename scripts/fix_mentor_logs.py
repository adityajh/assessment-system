import json
import subprocess

PAT = "sbp_b8874cc5000ef2fbc3dacf9da71672d451127fba"
URL = "https://api.supabase.com/v1/projects/wqcdtdofwytfrcbhfycc/database/query"

def run_sql(query):
    payload = json.dumps({"query": query})
    cmd = ["curl", "-s", "-X", "POST", URL, "-H", f"Authorization: Bearer {PAT}", "-H", "Content-Type: application/json", "-d", payload]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(res.stdout)
    except:
        return res.stdout

# 1. Get standard program_id and term
logs = run_sql("SELECT program_id, term FROM assessment_logs LIMIT 1")
try:
    prog_id = logs[0]['program_id']
    term = logs[0]['term']
except:
    prog_id = "5da1d6ff-df73-4554-bd65-8b38cd48679f"
    term = "Term 1"


# Find projects that have mentor score but NO associated assessment log yet
q1 = """
SELECT DISTINCT p.id, p.name 
FROM assessments a
JOIN projects p ON a.project_id = p.id
WHERE a.assessment_type = 'mentor'
AND a.assessment_log_id IS NULL;
"""
missing_projects = run_sql(q1)

print(f"Projects missing logs: {[p.get('name') for p in missing_projects if isinstance(p, dict)]}")

sample_mapping = json.dumps({
    "Student Name": "student_name",
    "Commercial": "commercial",
    "Entrepreneurial": "entrepreneurial",
    "Marketing": "marketing",
    "Innovation": "innovation",
    "Operational": "operational",
    "Professional": "professional"
})

for p in missing_projects:
    if not isinstance(p, dict): continue
    
    insert_q = f"""
    INSERT INTO assessment_logs (assessment_date, program_id, term, data_type, project_id, file_name, records_inserted, mapping_config)
    VALUES (
        '2024-06-01',
        '{prog_id}',
        '{term}',
        'mentor',
        '{p['id']}',
        'Year 1 Assessment Matrix.xlsx (Historical)',
        (SELECT count(*) FROM assessments WHERE project_id = '{p['id']}' AND assessment_type = 'mentor'),
        '{sample_mapping}'::jsonb
    ) RETURNING id;
    """
    new_log = run_sql(insert_q)
    log_id = new_log[0]["id"]
    
    update_q = f"""
    UPDATE assessments
    SET assessment_log_id = '{log_id}'
    WHERE project_id = '{p['id']}' AND assessment_type = 'mentor' AND assessment_log_id IS NULL;
    """
    run_sql(update_q)
    print(f"Created log {log_id} and mapped records for project {p['name']}")
