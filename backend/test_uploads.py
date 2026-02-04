import requests
import os
import time

# Configuration
API_URL = "http://localhost:8000"
TEST_EMAIL = "test_hr_upload_final@example.com"
TEST_PASSWORD = "Password123!" # Strong password

def test_uploads():
    # 1. Signup / Login
    print("🔐 Authenticating...")
    token = None
    
    # Try login first
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "role": "hr"
    })
    
    if response.status_code == 200:
        token = response.json().get("access_token")
        print("✅ Login Success")
    else:
        # Register if login fails
        print(f"📝 Registering new user (Status: {response.status_code})...")
        reg_response = requests.post(f"{API_URL}/auth/signup", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test HR",
            "role": "hr",
            "university_or_company": "Test Corp"
        })
        
        if reg_response.status_code not in [200, 201]:
             # If already registered but login failed (maybe wrong password or unverified), try verification
            if "already registered" in reg_response.text:
                 print("ℹ️ User exists, attempting verification...")
            else:
                print(f"❌ Registration failed: {reg_response.text}")
                return

        # Verify OTP (Test Mode)
        print("🔐 Verifying OTP...")
        verify_res = requests.post(f"{API_URL}/auth/verify-otp", json={
            "email_or_phone": TEST_EMAIL,
            "otp": "000000",
            "verification_type": "email"
        })
        
        if verify_res.status_code == 200 or "already verified" in verify_res.text:
             print("✅ Verified.")
        else:
             print(f"❌ Verification failed: {verify_res.text}")
             return

        # Login again
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "role": "hr"
        })
        
        if response.status_code != 200:
           print(f"❌ Login failed: {response.text}")
           return
           
        token = response.json().get("access_token")
    
    if not token:
         print("❌ No token received")
         return
         
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Authenticated.")
    

    # 2. Test Profile Update (Text)
    print("\n📝 Testing Profile Update...")
    update_data = {
        "full_name": "Updated HR Name",
        "bio": "Updated Bio Content",
        "university_or_company": "Updated Company"
    }
    res = requests.put(f"{API_URL}/users/profile", json=update_data, headers=headers)
    if res.status_code == 200:
        print("✅ Profile Text Update Success")
        data = res.json()
        if data['full_name'] == "Updated HR Name":
            print("   - Verified Name Change")
        else:
            print(f"   ❌ Name verification failed: {data['full_name']}")
    else:
        print(f"❌ Profile Text Update Failed: {res.status_code} - {res.text}")

    # 3. Test Photo Upload
    print("\n📸 Testing Photo Upload...")
    # Create a dummy image
    with open("test_image.jpg", "wb") as f:
        f.write(os.urandom(1024)) # 1KB random data
    
    try:
        files = {'file': ('test_image.jpg', open('test_image.jpg', 'rb'), 'image/jpeg')}
        res = requests.post(f"{API_URL}/users/upload/photo", files=files, headers=headers)
        if res.status_code == 200:
            print("✅ Photo Upload Success")
        else:
             print(f"❌ Photo Upload Failed: {res.status_code} - {res.text}")
    finally:
        if os.path.exists("test_image.jpg"):
            os.remove("test_image.jpg")
            
    # 4. Test Policy Upload
    print("\n📄 Testing Policy Upload...")
    # Create a dummy PDF
    with open("test_policy.pdf", "wb") as f:
        f.write(b"%PDF-1.4 header dummy content")
        
    try:
        files = {'file': ('test_policy.pdf', open('test_policy.pdf', 'rb'), 'application/pdf')}
        res = requests.post(f"{API_URL}/users/upload/policy", files=files, headers=headers)
        if res.status_code == 200:
            print("✅ Policy Upload Success")
            policy_path = res.json().get('company_policy_path')
            print(f"   - Path: {policy_path}")
        else:
             print(f"❌ Policy Upload Failed: {res.status_code} - {res.text}")
    finally:
        if os.path.exists("test_policy.pdf"):
            os.remove("test_policy.pdf")

if __name__ == "__main__":
    test_uploads()
