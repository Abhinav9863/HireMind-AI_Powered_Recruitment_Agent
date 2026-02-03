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
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
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
            use_tls=(smtp_port == 465),
            start_tls=(smtp_port != 465),
            timeout=30
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
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
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
            use_tls=(smtp_port == 465),
            start_tls=(smtp_port != 465),
            timeout=30
        )
        print(f"✅ Interview email sent to {to_email}")

    except Exception as e:
        print(f"⚠️ Email sending failed: {e}")

async def send_rejection_email(to_email: str, full_name: str):
    """
    Send Rejection Email
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
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
            use_tls=(smtp_port == 465),
            start_tls=(smtp_port != 465),
            timeout=30
        )
        print(f"✅ Rejection email sent to {to_email}")

    except Exception as e:
        print(f"⚠️ Email sending failed: {e}")


async def send_interview_rescheduled_email(to_email: str, full_name: str, old_date: str, old_time: str, new_date: str, new_time: str, meet_link: str):
    """
    Send Interview Rescheduled Email with apology
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM", f"HireMind <{smtp_username}>")

    if not smtp_username:
        print(f"📧 RESCHEDULE EMAIL (Dev Mode): To {to_email} | Old: {old_date} {old_time} → New: {new_date} {new_time}")
        return

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Interview Rescheduled - HireMind"
        message["From"] = email_from
        message["To"] = to_email

        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Interview Rescheduled</h1>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #f59e0b;">Important Update</h2>
                <p>Hi <strong>{full_name}</strong>,</p>
                <p>We sincerely apologize for the inconvenience, but we need to reschedule your interview.</p>
                
                <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <p style="margin: 5px 0; text-decoration: line-through; color: #666;"><strong>Previous Schedule:</strong></p>
                    <p style="margin: 5px 0; color: #666;">📅 {old_date}</p>
                    <p style="margin: 5px 0; color: #666;">⏰ {old_time}</p>
                </div>
                
                <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>New Schedule:</strong></p>
                    <p style="margin: 5px 0;"><strong>📅 Date:</strong> {new_date}</p>
                    <p style="margin: 5px 0;"><strong>⏰ Time:</strong> {new_time}</p>
                    <p style="margin: 5px 0;"><strong>📹 Link:</strong> <a href="{meet_link}" style="color: #667eea;">Join Google Meet</a></p>
                </div>
                
                <p>We apologize for any inconvenience this may cause. We look forward to meeting you at the new scheduled time.</p>
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
            use_tls=(smtp_port == 465),
            start_tls=(smtp_port != 465),
            timeout=30
        )
        print(f"✅ Interview rescheduled email sent to {to_email}")

    except Exception as e:
        print(f"⚠️ Email sending failed: {e}")


async def send_interview_cancelled_email(to_email: str, full_name: str, date_str: str, time_str: str):
    """
    Send Interview Cancelled Email with apology
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM", f"HireMind <{smtp_username}>")

    if not smtp_username:
        print(f"📧 CANCELLATION EMAIL (Dev Mode): To {to_email} | Cancelled: {date_str} {time_str}")
        return

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Interview Cancelled - HireMind"
        message["From"] = email_from
        message["To"] = to_email

        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background: #ef4444; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Interview Cancelled</h1>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #ef4444;">We Apologize</h2>
                <p>Hi <strong>{full_name}</strong>,</p>
                <p>We sincerely apologize, but we need to cancel your scheduled interview.</p>
                
                <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Cancelled Interview:</strong></p>
                    <p style="margin: 5px 0;">📅 Date: {date_str}</p>
                    <p style="margin: 5px 0;">⏰ Time: {time_str}</p>
                </div>
                
                <p>We understand this may cause inconvenience and we truly apologize for any disruption to your schedule.</p>
                <p>We will reach out to you shortly to reschedule at a more convenient time.</p>
                <br>
                <p>Thank you for your understanding.</p>
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
            use_tls=(smtp_port == 465),
            start_tls=(smtp_port != 465),
            timeout=30
        )
        print(f"✅ Interview cancellation email sent to {to_email}")

    except Exception as e:
        print(f"⚠️ Email sending failed: {e}")



async def send_password_reset_email(to_email: str, full_name: str, reset_link: str):
    """
    Send Password Reset Email with reset link
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    email_from = os.getenv("EMAIL_FROM", f"HireMind <{smtp_username}>")

    if not smtp_username or smtp_username == "your-email@gmail.com":
        print(f"\n{'=' * 70}")
        print(f"📧 PASSWORD RESET EMAIL (Development Mode)")
        print(f"{'=' * 70}")
        print(f"To: {to_email}")
        print(f"Subject: Reset Your Password - HireMind")
        print(f"\nHi {full_name},\n")
        print(f"Click the link below to reset your password:")
        print(f"{reset_link}")
        print(f"\nThis link expires in 1 hour.")
        print(f"{'=' * 70}\n")
        return

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Reset Your Password - HireMind"
        message["From"] = email_from
        message["To"] = to_email

        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #667eea;">Reset Your Password</h2>
                <p>Hi <strong>{full_name}</strong>,</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{reset_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">{reset_link}</p>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in <strong>1 hour</strong>.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px;">
                  If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>
            </div>
          </body>
        </html>
        """
        
        text_body = f"""
        Hi {full_name},
        
        We received a request to reset your password for your HireMind account.
        
        Click the link below to reset your password:
        {reset_link}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The HireMind Team
        """
        
        message.attach(MIMEText(text_body, "plain"))
        message.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            message,
            hostname=smtp_server,
            port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            use_tls=(smtp_port == 465),
            start_tls=(smtp_port != 465),
            timeout=30
        )
        print(f"✅ Password reset email sent to {to_email}")

    except Exception as e:
        print(f"⚠️ Email sending failed: {e}")
        print(f"Password reset link for {to_email}: {reset_link}")
