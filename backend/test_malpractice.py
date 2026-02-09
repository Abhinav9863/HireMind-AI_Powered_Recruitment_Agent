import requests
import time
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load env vars
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

BASE_URL = "http://localhost:8001"
TOKEN = None
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for sync engine
if DATABASE_URL and "postgresql+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")

def verify_user_in_db(email):
    print(f"ℹ️ Verifying user {email} in DB...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            # Table name is likely "user" (lowercase) because SQLModel default
            # "user" is reserved, so quote it
            stmt = text('UPDATE "user" SET is_verified = :verified WHERE email = :email')
            conn.execute(stmt, {"verified": True, "email": email})
            conn.commit()
        print("✅ User manually verified in DB")
        return True
    except Exception as e:
        print(f"❌ DB Verification Failed: {e}")
        return False

def login_as_student():
    """Login as a test student to get auth token"""
    global TOKEN
    
    # Registration first to ensure user exists
    reg_email = f"test_malpractice_{int(time.time())}@example.com"
    reg_password = "Password123!"
    
    print(f"ℹ️ Registering new user: {reg_email}")
    try:
        reg_resp = requests.post(
            f"{BASE_URL}/auth/signup",
            json={
                "email": reg_email,
                "password": reg_password,
                "full_name": "Test Malpractice User",
                "role": "student"
            }
        )
        
        if reg_resp.status_code not in [200, 201]:
             print(f"⚠️ Registration failed (maybe exists): {reg_resp.text}")
    except Exception as e:
        print(f"❌ Registration Error: {e}")
        return False
    
    # Manually verify user to bypass OTP
    verify_user_in_db(reg_email)
    
    try:
        # Try login with form data first (OAuth2 standard)
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={ 
                "username": reg_email, 
                "password": reg_password
            }
        )
        
        # Fallback to JSON if needed
        if response.status_code != 200:
             response = requests.post(
                f"{BASE_URL}/auth/login",
                json={
                    "email": reg_email,
                    "password": reg_password,
                    "role": "student" 
                }
             )

        if response.status_code == 200:
            TOKEN = response.json()["access_token"]
            print("✅ Logged in successfully")
            return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return False

def get_or_create_application():
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # 1. Try to get existing applications
    try:
        resp = requests.get(f"{BASE_URL}/applications/my", headers=headers)
        if resp.status_code == 200:
            apps = resp.json()
            if apps:
                print(f"✅ Found existing application ID: {apps[0]['id']}")
                return apps[0]['id']
    except Exception as e:
        print(f"⚠️ Error check existing apps: {e}")
    
    # 2. If no apps, find a job and apply
    print("ℹ️ No applications found. Applying to a job...")
    try:
        jobs_resp = requests.get(f"{BASE_URL}/jobs/", headers=headers)
        if jobs_resp.status_code == 200:
            jobs = jobs_resp.json()
            if not jobs:
                print("❌ No jobs available to apply to.")
                return None
            
            job_id = jobs[0]['id']
            print(f"ℹ️ Applying to Job ID: {job_id}")
            
            # Use existing valid PDF
            resume_path = "backend/uploads/SayOne_Technologies_Company_Details_and_Policies.pdf"
            if not os.path.exists(resume_path):
                resume_path = "backend/test_resume.pdf"
            
            if not os.path.exists(resume_path):
                 print(f"❌ Resume file not found at {os.getcwd()}/{resume_path}")
                 # Create a minimal valid PDF if possible (needs library) or fail
                 return None

            print(f"ℹ️ Using resume: {resume_path}")
            with open(resume_path, "rb") as f:
                 files = {"resume": (os.path.basename(resume_path), f, "application/pdf")}
                 data = {"job_id": job_id, "use_profile_resume": False}
                 
                 apply_resp = requests.post(
                    f"{BASE_URL}/interview/start",
                    headers=headers,
                    files=files,
                    data=data
                )
                 
                 if apply_resp.status_code == 200:
                     app_data = apply_resp.json()
                     print(f"✅ Created new application ID: {app_data['application_id']}")
                     return app_data['application_id']
                 else:
                     print(f"❌ Application failed: {apply_resp.text}")
                     return None
    except Exception as e:
        print(f"❌ Application creation error: {e}")
        return None

    return None

def test_malpractice():
    if not login_as_student():
        return

    app_id = get_or_create_application()
    if not app_id:
        print("❌ Could not get an application ID to test.")
        return

    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    print(f"\n⚡ Testing Malpractice on Application ID: {app_id}")
    
    for i in range(1, 4):
        print(f"   Sending Violation {i}...")
        resp = requests.post(
            f"{BASE_URL}/interview/log_violation",
            headers=headers,
            json={"application_id": app_id}
        )
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"   Response: {data}")
            
            if i < 3:
                if data.get("terminated"):
                     print("   ⚠️ Terminated prematurely?")
            else:
                if data.get("terminated"):
                    print("   ✅ CORRECTLY TERMINATED on 3rd strike.")
                else:
                    print("   ❌ FAILED to terminate on 3rd strike.")
        else:
            print(f"   ❌ Failed to log violation: {resp.text}")
        
        time.sleep(1)
        
    print("\nℹ️ Verifying final status via API...")
    # Since we can't reliably check /applications/my as student for status updates instantly if cached or structured differently, 
    # we rely on the log_violation response.
    # But let's try reading /applications/my
    my_resp = requests.get(f"{BASE_URL}/applications/my", headers=headers)
    if my_resp.status_code == 200:
        my_apps = my_resp.json()
        target_app = next((a for a in my_apps if a['id'] == app_id), None)
        if target_app:
            print(f"   Final Status: {target_app['status']}")
            if target_app['status'] == 'Rejected':
                print("   ✅ Status is Rejected")
            else:
                print(f"   ❌ Status is {target_app['status']} (Expected Rejected)")
        else:
             print("   ⚠️ Application not found in list")

if __name__ == "__main__":
    test_malpractice()
