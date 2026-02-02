import requests

LOGIN_URL = "http://localhost:8000/auth/login"
try:
    # 1. Login
    resp = requests.post(LOGIN_URL, json={"email": "hr_sched@test.com", "password": "pass", "role": "hr"})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        exit(1)
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Try Update Status (assuming app_id 3 exists from logs)
    # This should fail if no slots
    print("Attempting to update status to Accepted (Interviewing)...")
    STATUS_URL = "http://localhost:8000/applications/3/status" 
    resp = requests.put(STATUS_URL, json={"status": "Interviewing"}, headers=headers)
    
    print(f"Status Code: {resp.status_code}")
    print(f"Response Body: {resp.text}")

except Exception as e:
    print(f"Error: {e}")
