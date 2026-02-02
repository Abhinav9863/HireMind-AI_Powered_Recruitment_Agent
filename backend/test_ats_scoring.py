"""
Test script to verify ATS scoring works correctly with different resumes
"""
import requests
import json

BASE_URL = "http://localhost:8000"
TOKEN = None  # Will be set after login

def login_as_student():
    """Login as a test student to get auth token"""
    global TOKEN
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "harlinmartin58@gmail.com",  # Test student account
            "password": "123456",
            "role": "student"
        }
    )
    if response.status_code == 200:
        TOKEN = response.json()["access_token"]
        print("✅ Logged in successfully")
        return True
    else:
        print(f"❌ Login failed: {response.json()}")
        return False

def start_interview_with_resume(job_id, resume_path):
    """Start a chat interview with a resume file"""
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    with open(resume_path, "rb") as f:
        files = {"resume": (resume_path.split("/")[-1], f, "application/pdf")}
        data = {"job_id": job_id, "use_profile_resume": False}
        
        response = requests.post(
            f"{BASE_URL}/interview/start",
            headers=headers,
            files=files,
            data=data
        )
    
    return response

def test_ats_scoring():
    print("\n" + "="*70)
    print("Testing ATS Scoring with Different Resumes")
    print("="*70 + "\n")
    
    if not login_as_student():
        return
    
    # Test with multiple resumes (if available)
    test_resumes = [
        "/home/sayone-343/Documents/CAPSTONE-PROJECT/backend/uploads/SayOne_Technologies_Company_Details_and_Policies.pdf",
        # Add more test resume paths here
    ]
    
    job_id = 5  # Test job ID (adjust based on your DB)
    
    print(f"Starting interviews for Job ID: {job_id}\n")
    
    scores = []
    for i, resume_path in enumerate(test_resumes, 1):
        print(f"Test {i}: Testing with {resume_path.split('/')[-1]}")
        
        try:
            response = start_interview_with_resume(job_id, resume_path)
            
            if response.status_code == 200:
                data = response.json()
                app_id = data.get("application_id")
                
                # Fetch application details to get ATS score
                app_response = requests.get(
                    f"{BASE_URL}/applications/{app_id}",
                    headers={"Authorization": f"Bearer {TOKEN}"}
                )
                
                if app_response.status_code == 200:
                    app_data = app_response.json()
                    score = app_data.get("ats_score", 0)
                    scores.append(score)
                    print(f"   ATS Score: {score}%")
                    print(f"   Feedback: {app_data.get('ats_feedback', 'N/A')[:100]}...")
                else:
                    print(f"   ❌ Failed to fetch application: {app_response.status_code}")
            else:
                print(f"   ❌ Interview start failed: {response.json()}")
                
        except FileNotFoundError:
            print(f"   ⚠️  Resume file not found: {resume_path}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print()
    
    # Analysis
    print("-"*70)
    if len(scores) > 1:
        if len(set(scores)) == 1:
            print("⚠️  WARNING: All scores are identical!")
            print(f"   All resumes scored: {scores[0]}%")
            print("   This indicates the bug is still present.")
        else:
            print("✅ SUCCESS: Scores vary between resumes!")
            print(f"   Scores: {scores}")
            print("   This indicates ATS is analyzing each resume individually.")
    elif len(scores) == 1:
        print(f"ℹ️  Only one resume tested. Score: {scores[0]}%")
        print("   Add more resumes to verify they get different scores.")
    else:
        print("❌ No successful tests completed.")
    
    print("="*70 + "\n")

if __name__ == "__main__":
    test_ats_scoring()
