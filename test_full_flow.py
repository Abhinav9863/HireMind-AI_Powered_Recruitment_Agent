import requests
import time

BASE_URL = "http://localhost:8000"

def run():
    session = requests.Session()
    unique = int(time.time())
    hr_email = f"hr_{unique}@test.com"
    stu_email = f"stu_{unique}@test.com"
    
    # 1. Signup HR
    print(f"Signing up HR: {hr_email}")
    resp = session.post(f"{BASE_URL}/auth/signup", json={
        "email": hr_email, "password": "pass", "full_name": "Test HR", "role": "hr", "company_name": "TestCorp"
    })
    # Force verify via SQL because we can't extract OTP easily without logs
    # Using curl/docker exec to verify this specific email
    print("Verifying HR...")
    import subprocess
    cmd = f'docker exec hiremind-db psql -U hiremind -d hiremind_db -c "UPDATE \"user\" SET is_verified = true WHERE email = \'{hr_email}\';"'
    subprocess.run(cmd, shell=True, check=True, stdout=subprocess.DEVNULL)
    
    # Login HR
    resp = session.post(f"{BASE_URL}/auth/login", json={"email": hr_email, "password": "pass", "role": "hr"})
    hr_token = resp.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    
    # 2. Post Job
    print("Posting Job...")
    resp = session.post(f"{BASE_URL}/jobs/", data={
        "title": "DevOps Engineer", "description": "Good at docker", "location": "Remote", 
        "salary_range": "00k", "job_type": "Full-time"
    }, headers=hr_headers)
    if resp.status_code != 200:
        print(f"Post Job Failed: {resp.text}")
        return
    job_id = resp.json()["id"]
    
    # 3. Signup Student
    print(f"Signing up Student: {stu_email}")
    resp = session.post(f"{BASE_URL}/auth/signup", json={
        "email": stu_email, "password": "pass", "full_name": "Test Student", "role": "student"
    })
    cmd = f'docker exec hiremind-db psql -U hiremind -d hiremind_db -c "UPDATE \"user\" SET is_verified = true WHERE email = \'{stu_email}\';"'
    subprocess.run(cmd, shell=True, check=True, stdout=subprocess.DEVNULL)
    
    # Login Student
    resp = session.post(f"{BASE_URL}/auth/login", json={"email": stu_email, "password": "pass", "role": "student"})
    stu_token = resp.json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}
    
    # 4. Apply (Start Interview)
    print("Applying...")
    # Need dummy pdf
    with open("dummy.pdf", "wb") as f: f.write(b"%PDF-1.4 dummy content")
    
    files = {"resume": ("dummy.pdf", open("dummy.pdf", "rb"), "application/pdf")}
    resp = session.post(f"{BASE_URL}/interview/start", data={"job_id": job_id}, files=files, headers=stu_headers)
    if resp.status_code != 200:
        print(f"Apply Failed: {resp.text}")
        return
    app_id = resp.json()["application_id"]
    
    # 5. HR Update Status (Should fail because NO SLOTS)
    print(f"HR Updating Status for App {app_id}...")
    resp = session.put(f"{BASE_URL}/applications/{app_id}/status", json={"status": "Interviewing"}, headers=hr_headers)
    
    print(f"Status Code: {resp.status_code}")
    print(f"Raw Response Body: {resp.text}")

if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"Error: {e}")
