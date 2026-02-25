import requests

URL = "https://wqcdtdofwytfrcbhfycc.supabase.co/rest/v1"
KEY = "your_supabase_anon_key_here"
HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json"
}

def check():
    r = requests.get(f"{URL}/students?select=id,canonical_name", headers=HEADERS)
    print("Students fetched:", len(r.json()))
    r = requests.get(f"{URL}/readiness_domains", headers=HEADERS)
    print("Domains fetched:", len(r.json()))

if __name__ == "__main__":
    check()
