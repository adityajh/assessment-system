import psycopg2
import urllib.parse
from dotenv import load_dotenv
import os

load_dotenv("frontend/.env.local")

# Since the .env file does not contain POSTGRES_URL directly, we construct it
# from the host and anon key / password.
password = "jD29v!M7*gTbZ5N"
host = "db.wqcdtdofwytfrcbhfycc.supabase.co"
user = "postgres"
db = "postgres"

password_enc = urllib.parse.quote_plus(password)
conn_str = f"postgresql://{user}:{password_enc}@{host}:5432/{db}"

print("Connecting to Supabase PostgreSQL natively...")
try:
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()
    
    with open("scripts/006_add_assessment_logs.sql", "r") as f:
        sql = f.read()

    print("Executing full SQL seed script...")
    cursor.execute(sql)
    conn.commit()
    print("Success! Changes committed via psycopg2.")
    
except Exception as e:
    print(f"Database error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
