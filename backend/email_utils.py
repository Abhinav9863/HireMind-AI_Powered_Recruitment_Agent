"""
Email and SMS Utility Functions for OTP Sending
"""
import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart



async def send_email_otp(to_email: str, full_name: str, otp: str):
    """
    Send OTP via Email using Gmail SMTP
    
    Args:
        to_email: Recipient email address
        full_name: User's full name
        otp: 6-digit OTP code
    """
    
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM", f"HireMind <{smtp_username}>")
    
    # Check if email is configured
    if not smtp_username or not smtp_password or smtp_username == "your-email@gmail.com":
        # Development mode - print to console
        print(f"\n{'=' * 70}")
        print(f"📧 EMAIL OTP (Development Mode - Email Not Configured)")
        print(f"{'=' * 70}")
        print(f"To: {to_email}")
        print(f"Subject: Your HireMind Verification Code")
        print(f"\nHi {full_name},\n")
        print(f"Your email verification code is: {otp}")
        print(f"This code expires in 5 minutes.\n")
        print(f"Alternatively, you can verify using the SMS code sent to your phone.")
        print(f"{'=' * 70}\n")
        return
    
    # Production mode - actual email sending
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Your HireMind Verification Code"
        message["From"] = email_from
        message["To"] = to_email
        
        # HTML email body
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">HireMind</h1>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #667eea;">Verify Your Account</h2>
                <p>Hi <strong>{full_name}</strong>,</p>
                <p>Your email verification code is:</p>
                
                <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; border-radius: 8px; margin: 20px 0;">
                  {otp}
                </div>
                
                <p style="color: #666; font-size: 14px;">This code expires in <strong>5 minutes</strong>.</p>
                <p style="color: #666; font-size: 14px;">Alternatively, you can verify using the SMS code sent to your phone.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px;">
                  If you didn't request this code, please ignore this email.
                </p>
              </div>
            </div>
          </body>
        </html>
        """
        
        # Plain text fallback
        text_body = f"""
        Hi {full_name},
        
        Your HireMind verification code is: {otp}
        
        This code expires in 5 minutes.
        
        Alternatively, you can verify using the SMS code sent to your phone.
        
        If you didn't request this code, please ignore this email.
        """
        
        # Attach both versions
        message.attach(MIMEText(text_body, "plain"))
        message.attach(MIMEText(html_body, "html"))
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=smtp_server,
            port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            start_tls=True
        )
        
        print(f"✅ Email OTP sent successfully to {to_email}")
        
    except Exception as e:
        print(f"⚠️ Email sending failed: {e}")
        print(f"Email OTP for {to_email}: {otp}")




async def send_interview_scheduled_email(to_email: str, full_name: str, date_str: str, time_str: str, meet_link: str):
    """
    Send Interview Scheduled Email
    """
    
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM", f"HireMind <{smtp_username}>")

    if not smtp_username:
        print(f"📧 INTERVIEW EMAIL (Dev Mode): To {to_email} | {date_str} {time_str} | {meet_link}")
        return

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Interview Scheduled - HireMind"
        message["From"] = email_from
        message["To"] = to_email

        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Congratulations!</h1>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #667eea;">You've been shortlisted!</h2>
                <p>Hi <strong>{full_name}</strong>,</p>
                <p>We are pleased to inform you that your application has been accepted for the next round.</p>
                
                <div style="background: #f0faff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>📅 Date:</strong> {date_str}</p>
                    <p style="margin: 5px 0;"><strong>⏰ Time:</strong> {time_str}</p>
                    <p style="margin: 5px 0;"><strong>📹 Link:</strong> <a href="{meet_link}" style="color: #667eea;">Join Google Meet</a></p>
                </div>
                
                <p>Please make sure to join 5 minutes early.</p>
                <p>Good luck!</p>
              </div>
            </div>
          </body>
        </html>
        """
        
        message.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            message,
            hostname=smtp_server,
            port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            start_tls=True
        )
        print(f"✅ Interview email sent to {to_email}")

async def send_rejection_email(to_email: str, full_name: str):
    """
    Send Rejection Email
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM", f"HireMind <{smtp_username}>")

    if not smtp_username:
        print(f"📧 REJECTION EMAIL (Dev Mode): To {to_email}")
        return

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Update on your application - HireMind"
        message["From"] = email_from
        message["To"] = to_email

        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background: #f87171; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Application Update</h1>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
                <p>Hi <strong>{full_name}</strong>,</p>
                <p>Thank you for giving us the opportunity to consider your application.</p>
                <p>After careful review, we regret to inform you that we will not be moving forward with your candidacy for this position at this time.</p>
                <p>We appreciate your interest in HireMind and wish you the best in your job search.</p>
                <br>
                <p>Sincerely,</p>
                <p><strong>The HireMind Team</strong></p>
              </div>
            </div>
          </body>
        </html>
        """
        
        message.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            message,
            hostname=smtp_server,
            port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            start_tls=True
        )
        print(f"✅ Rejection email sent to {to_email}")

    except Exception as e:
        print(f"⚠️ Email sending failed: {e}")

    except Exception as e:
        print(f"⚠️ Email sending failed: {e}")
