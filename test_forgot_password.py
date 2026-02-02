"""
Test script for forgot password feature
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_forgot_password():
    print("\n" + "="*70)
    print("Testing Forgot Password Feature")
    print("="*70 + "\n")
    
    # Test 1: Request password reset
    print("Test 1: Requesting password reset...")
    email = "test@example.com"
    
    response = requests.post(
        f"{BASE_URL}/auth/forgot-password",
        json={"email": email}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Forgot password request successful!")
    else:
        print("❌ Forgot password request failed!")
    
    print("\n" + "-"*70 + "\n")
    
    # Test 2: Try to reset with invalid token
    print("Test 2: Testing with invalid token...")
    
    response = requests.post(
        f"{BASE_URL}/auth/reset-password",
        json={
            "token": "invalid_token_123",
            "new_password": "newpassword123"
        }
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 400:
        print("✅ Invalid token correctly rejected!")
    else:
        print("❌ Invalid token handling failed!")
    
    print("\n" + "="*70)
    print("Tests completed! Check backend logs for email output.")
    print("="*70 + "\n")

if __name__ == "__main__":
    test_forgot_password()
