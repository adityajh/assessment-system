#!/usr/bin/env python3
"""
Run SQL migration against Supabase via pg-meta / REST SQL endpoint approaches.
Tries multiple auth strategies to find what works.
"""

import urllib.request
import urllib.error
import json

PROJECT_ID   = "wqcdtdofwytfrcbhfycc"
API_KEY      = "your_supabase_anon_key_here"
PROJECT_URL  = f"https://{PROJECT_ID}.supabase.co"
SQL_FILE     = "./migrations/001_schema.sql"


def post(url, body, headers):
    data = json.dumps(body).encode()
    req  = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


with open(SQL_FILE) as f:
    sql = f.read()

# ---------- Strategy 1: PostgREST rpc (won't work for DDL but let's check auth) ----------
print("=== Strategy 1: REST API health check ===")
req = urllib.request.Request(
    f"{PROJECT_URL}/rest/v1/",
    headers={"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}"},
)
try:
    with urllib.request.urlopen(req) as r:
        print(f"HTTP {r.status} — REST API accessible")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}")

# ---------- Strategy 2: Supabase SQL over pg-meta (needs service_role) ----------
print("\n=== Strategy 2: pg-meta SQL endpoint ===")
status, body = post(
    f"https://{PROJECT_ID}.supabase.co/rest/v1/rpc/query",
    {"sql": "SELECT 1"},
    {"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
)
print(f"HTTP {status}: {body[:200]}")

# ---------- Strategy 3: Supabase Management API with key as PAT ----------
print("\n=== Strategy 3: Management API /database/query ===")
status, body = post(
    f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query",
    {"query": "SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 5"},
    {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
)
print(f"HTTP {status}: {body[:300]}")

# ---------- Strategy 4: Direct DB connection info from management API ----------
print("\n=== Strategy 4: Fetch project info to validate key type ===")
req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects",
    headers={"Authorization": f"Bearer {API_KEY}"},
)
try:
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
        print(f"HTTP {r.status} — projects: {[p.get('name') for p in data]}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"HTTP {e.code}: {body[:300]}")
