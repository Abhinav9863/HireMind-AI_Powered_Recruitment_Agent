#!/usr/bin/env python3
"""
Test script for Resend email integration
Run this to verify that Resend is properly configured before deploying
"""
import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import email functions
from email_utils import send_email_otp


async def test_resend_integration():
    """Test Resend email sending"""
    print("\n" + "="*70)
    print("Resend Integration Test")
    print("="*70 + "\n")
    
    # Check if API key is configured
    api_key = os.getenv("RESEND_API_KEY")
    email_from = os.getenv("EMAIL_FROM", "HireMind <onboarding@resend.dev>")
    
    print(f"📧 EMAIL_FROM: {email_from}")
    print(f"🔑 RESEND_API_KEY: {'✅ Configured' if api_key and 're_' in api_key else '❌ Not configured'}\n")
    
    if not api_key or "YourAPIKeyHere" in api_key:
        print("⚠️  Resend API key not configured!")
        print("\nTo fix this:")
        print("1. Sign up at https://resend.com")
        print("2. Generate an API key at https://resend.com/api-keys")
        print("3. Add to backend/.env:")
        print('   RESEND_API_KEY="re_your_api_key_here"')
        print('   EMAIL_FROM="HireMind <onboarding@resend.dev>"')
        print("\n" + "="*70 + "\n")
        return False
    
    # Get test email address
    test_email = input("Enter your email address to receive a test OTP: ").strip()
    
    if not test_email or "@" not in test_email:
        print("❌ Invalid email address")
        return False
    
    print(f"\n🔄 Sending test OTP email to {test_email}...")
    
    try:
        # Send test email
        await send_email_otp(
            to_email=test_email,
            full_name="Test User",
            otp="123456"
        )
        
        print("\n✅ Test completed!")
        print("📬 Check your inbox (and spam folder) for the test email")
        print("\n" + "="*70 + "\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print("\nTroubleshooting:")
        print("1. Verify your API key is correct")
        print("2. Check that you have credits in your Resend account")
        print("3. Review logs above for specific error messages")
        print("\n" + "="*70 + "\n")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_resend_integration())
    sys.exit(0 if success else 1)
