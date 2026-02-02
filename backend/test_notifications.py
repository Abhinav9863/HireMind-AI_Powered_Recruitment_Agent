
import asyncio
import os
from dotenv import load_dotenv
import aiosmtplib
from email.mime.text import MIMEText
from twilio.rest import Client

load_dotenv()

async def test_email():
    print("\n📧 Testing Email...")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM")
    
    print(f"Server: {smtp_server}:{smtp_port}")
    print(f"User: {smtp_username}")
    
    try:
        message = MIMEText("This is a test email from HireMind.")
        message["Subject"] = "HireMind Test"
        message["From"] = email_from
        message["To"] = smtp_username # Send to self
        
        await aiosmtplib.send(
            message,
            hostname=smtp_server,
            port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            start_tls=True
        )
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Email failed: {e}")

def test_sms():
    print("\n📱 Testing SMS...")
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    phone = os.getenv("TWILIO_PHONE_NUMBER")
    
    print(f"SID: {sid}")
    print(f"Phone: {phone}")
    
    try:
        client = Client(sid, token)
        # Send to the configured number if possible, or a dummy number if we can't determine the user's
        # Warning: Sending to random numbers might fail if trial account
        # We will try to send to a generic test number or just check init
        account = client.api.accounts(sid).fetch()
        print(f"✅ Twilio Account Valid: {account.friendly_name}")
    except Exception as e:
        print(f"❌ SMS Client failed: {e}")

async def main():
    await test_email()
    test_sms()

if __name__ == "__main__":
    asyncio.run(main())
