import requests
import datetime

# Login
LOGIN_URL = "http://localhost:8000/auth/login"
SLOT_URL = "http://localhost:8000/schedule/slots"

try:
    # 1. Login
    resp = requests.post(LOGIN_URL, json={"email": "hr_sched@test.com", "password": "pass", "role": "hr"})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        exit(1)
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add Slot
    start = (datetime.datetime.utcnow() + datetime.timedelta(days=1, hours=10)).isoformat()
    end = (datetime.datetime.utcnow() + datetime.timedelta(days=1, hours=11)).isoformat()
    
    data = {"start_time": start, "end_time": end}
    print(f"Sending data: {data}")
    
    resp = requests.post(SLOT_URL, json=data, headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

except Exception as e:
    print(f"Error: {e}")
