"""
Test Brevo email integration before deployment
"""
import asyncio
import os
from dotenv import load_dotenv
from email_utils import send_email_otp

# Load environment variables
load_dotenv()

async def test_brevo_integration():
    """Test Brevo email sending"""
    print("\n" + "="*70)
    print("Brevo Integration Test")
    print("="*70 + "\n")
    
    # Check if API key is configured
    api_key = os.getenv("BREVO_API_KEY")
    email_from = os.getenv("EMAIL_FROM", "abhinavclass307@gmail.com")
    
    print(f"📧 EMAIL_FROM: {email_from}")
    print(f"🔑 BREVO_API_KEY: {'✅ Configured' if api_key and 'xkeysib-' in api_key else '❌ Not configured'}\n")
    
    if not api_key or "YourAPIKeyHere" in api_key:
        print("⚠️  Brevo API key not configured!")
        print("\nTo fix this:")
        print("1. Sign up at https://app.brevo.com")
        print("2. Generate an API key at https://app.brevo.com/settings/keys/api")
        print("3. Add to backend/.env:")
        print('   BREVO_API_KEY="xkeysib_your_api_key_here"')
        print('   EMAIL_FROM="youremail@gmail.com"')
        print("\n" + "="*70 + "\n")
        return False
    
    # Get test email address
    test_email = input("Enter email address to receive test OTP (or press Enter for sender email): ").strip()
    
    if not test_email:
        test_email = email_from
        print(f"Using sender email: {test_email}")
    
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
        print(f"📬 Check inbox for {test_email}")
        print("💡 With Brevo, you can send to ANY email address!")
        print("\n" + "="*70 + "\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print("\nTroubleshooting:")
        print("1. Verify your API key is correct")
        print("2. Check that your sender email is verified in Brevo")
        print("3. Review logs above for specific error messages")
        print("\n" + "="*70 + "\n")
        return False


if __name__ == "__main__":
    asyncio.run(test_brevo_integration())
