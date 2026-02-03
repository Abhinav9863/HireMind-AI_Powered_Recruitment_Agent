import requests
import json
import time
import subprocess

BASE_URL = "http://localhost:8000"

# Helper to verify user via Docker (skips OTP)
def manual_verify_user(email):
    print(f"🔧 Manually verifying {email} via DB...")
    # SQLModel uses 'user' (singular) by default usually. Escaping "user" is safe.
    # We use docker exec to run psql.
    cmd = [
        "docker", "exec", "hiremind-db", 
        "psql", "-U", "hiremind", "-d", "hiremind_db", 
        "-c", f"UPDATE \"user\" SET is_verified = true WHERE email = '{email}';"
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"✅ Verified {email}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to verify {email}: {e}")
        return False

# 1. Signup Logic
def signup(email, password, role, name):
    url = f"{BASE_URL}/auth/signup"
    data = {
        "email": email,
        "password": password,
        "full_name": name,
        "role": role,
        "university_or_company": "Test Org"
    }
    response = requests.post(url, json=data)
    if response.status_code in [200, 201]:
        print(f"✅ Signed up {email}")
        manual_verify_user(email)
        return True
    elif response.status_code == 400 and "already registered" in response.text:
        print(f"ℹ️  {email} already exists")
        manual_verify_user(email) # Ensure it's verified mostly
        return True
    
    print(f"❌ Signup failed for {email}: {response.text}")
    return False

# 2. Login Logic
def login(email, password, role):
    url = f"{BASE_URL}/auth/login"
    data = {"email": email, "password": password, "role": role}
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"❌ Login failed for {email}: {response.text}")
    return None

# 3. HR: Post Job with Work Location
def post_job(token):
    url = f"{BASE_URL}/jobs/"
    headers = {"Authorization": f"Bearer {token}"}
    # Note: create_job uses Form parameters
    data = {
        "title": "Remote Python Dev",
        "description": "Work from anywhere!",
        "location": "NY",
        "salary_range": "$120k",
        "job_type": "Full-time",
        "work_location": "Remote",  # <--- NEW FIELD
        "experience_required": 2
    }
    # Send as form data
    response = requests.post(url, headers=headers, data=data) 
    if response.status_code == 200:
        job = response.json()
        print(f"✅ Job Posted: ID={job['id']}, WorkLocation={job.get('work_location')}")
        return job['id']
    print(f"❌ Job Post Failed: {response.text}")
    return None

# 4. Candidate: Apply with Experience
def apply_for_job(token, job_id, experience_years):
    url = f"{BASE_URL}/interview/start"
    headers = {"Authorization": f"Bearer {token}"}
    
    # We need a dummy resume
    # Create a minimal valid PDF content with realistic resume keywords
    long_text = """
    JOHN DOE
    john.doe@example.com | 123-456-7890
    
    WORK EXPERIENCE:
    Senior Software Engineer | Tech Solutions Inc. | 2018 - Present
    - Developed scalable backend services using Python and FastAPI
    - Managed database migrations and optimization
    
    EDUCATION:
    Bachelor of Technology in Computer Science
    University of Technology | 2014 - 2018
    
    SKILLS:
    Python, Django, FastAPI, React, Docker, Kubernetes, PostgreSQL
    """
    
    pdf_content = (
        b'%PDF-1.4\n'
        b'1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'
        b'2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n'
        b'3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/Contents 4 0 R\n>>\nendobj\n'
        b'4 0 obj\n<<\n/Length 500\n>>\nstream\n'
        b'BT\n/F1 12 Tf\n100 700 Td\n(' + long_text.replace('\n', ' ').encode('latin1') + b') Tj\nET\nendstream\nendobj\n'
        b'xref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000157 00000 n \n0000000302 00000 n \n'
        b'trailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n408\n%%EOF\n'
    )

    files = {'resume': ('resume.pdf', pdf_content, 'application/pdf')}
    data = {
        'job_id': job_id,
        'experience_years': experience_years  # <--- NEW FIELD
    }
    
    response = requests.post(url, headers=headers, files=files, data=data)
    if response.status_code == 200:
        app_data = response.json()
        print(f"✅ Application Started: AppID={app_data['application_id']}, ATS Score={app_data.get('ats_score')}")
        return app_data['application_id']
    else:
        print(f"❌ Application Failed: {response.text}")
        return None

# 5. HR: View Application Details
def view_application(token, app_id, expected_years):
    url = f"{BASE_URL}/applications/{app_id}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        app = response.json()
        print(f"✅ Application Details Fetched")
        # print(f"   - Candidate: {app['student_name']}") # Might not be in default read model
        actual_years = app.get('experience_years', 'N/A')
        print(f"   - Experience: {actual_years} years") 
        
        if actual_years == expected_years:
            print("✅ Experience matches!")
            return True
        else:
            print(f"❌ Experience mismatch! Expected {expected_years}, got {actual_years}")
            return False
            
    print(f"❌ Fetch Details Failed: {response.text}")
    print(f"Response: {response.json()}") # Debug
    return False

# Main Verification Flow
def run_verification():
    print("🚀 Starting Verification Script (fixed endpoints)...")
    
    # Register HR
    hr_email = "hr_test_final@example.com"
    hr_pass = "Password123!" # Strong password per requirements
    signup(hr_email, hr_pass, "hr", "Test HR")
    
    # Register Candidate
    cand_email = "cand_test_final@example.com"
    cand_pass = "Password123!"
    signup(cand_email, cand_pass, "student", "Test Candidate")
    
    # Login
    hr_token = login(hr_email, hr_pass, "hr")
    cand_token = login(cand_email, cand_pass, "student")
    
    if not hr_token or not cand_token:
        print("❌ Login failed, aborting.")
        return

    # Post Job
    job_id = post_job(hr_token)
    if not job_id: return

    # Apply
    print("Applying for job...")
    time.sleep(1) # small delay
    app_id = apply_for_job(cand_token, job_id, experience_years=5)

    if not app_id: 
        print("Skipping verification due to application failure")
        return

    # View Details
    view_application(hr_token, app_id, expected_years=5)

if __name__ == "__main__":
    run_verification()
