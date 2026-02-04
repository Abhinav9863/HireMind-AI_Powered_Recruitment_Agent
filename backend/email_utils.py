"""
Email Utility Functions using Resend API
Replaces SMTP-based email sending to work with cloud hosting providers
that block SMTP ports (like Render.com)
"""
import os
import resend
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Resend with API key from environment
resend.api_key = os.getenv("RESEND_API_KEY")


def _send_email_base(to_email: str, subject: str, html_body: str) -> bool:
    """
    Base helper function to send emails using Resend API
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        html_body: HTML content of the email
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    email_from = os.getenv("EMAIL_FROM", "HireMind <onboarding@resend.dev>")
    
    # Check if Resend is configured
    if not resend.api_key or "YourAPIKeyHere" in str(resend.api_key):
        logger.warning(f"📧 [DEV MODE] Email to {to_email} suppressed (Resend API key not configured)")
        logger.info(f"Subject: {subject}")
        logger.info("To configure: Sign up at https://resend.com and add RESEND_API_KEY to .env")
        return False

    try:
        params = {
            "from": email_from,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"✅ Email sent successfully to {to_email} | ID: {response.get('id', 'N/A')}")
        return True

    except Exception as e:
        logger.error(f"⚠️ Email sending failed: {e}")
        return False


async def send_email_otp(to_email: str, full_name: str, otp: str):
    """
    Send OTP via Email
    
    Args:
        to_email: Recipient email address
        full_name: User's full name
        otp: 6-digit OTP code
    """
    subject = "Your HireMind Verification Code"
    
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
    
    _send_email_base(to_email, subject, html_body)


async def send_interview_scheduled_email(to_email: str, full_name: str, date_str: str, time_str: str, meet_link: str):
    """
    Send Interview Scheduled Email
    """
    subject = "Interview Scheduled - HireMind"
    
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
    
    _send_email_base(to_email, subject, html_body)


async def send_rejection_email(to_email: str, full_name: str):
    """
    Send Rejection Email
    """
    subject = "Update on your application - HireMind"
    
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
    
    _send_email_base(to_email, subject, html_body)


async def send_interview_rescheduled_email(to_email: str, full_name: str, old_date: str, old_time: str, new_date: str, new_time: str, meet_link: str):
    """
    Send Interview Rescheduled Email
    """
    subject = "Interview Rescheduled - HireMind"
    
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
            <p>Good luck!</p>
          </div>
        </div>
      </body>
    </html>
    """
    
    _send_email_base(to_email, subject, html_body)


async def send_interview_cancelled_email(to_email: str, full_name: str, date_str: str, time_str: str):
    """
    Send Interview Cancelled Email
    """
    subject = "Interview Cancelled - HireMind"
    
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
    
    _send_email_base(to_email, subject, html_body)


async def send_password_reset_email(to_email: str, full_name: str, reset_link: str):
    """
    Send Password Reset Email
    """
    subject = "Reset Your Password - HireMind"
    
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
    
    _send_email_base(to_email, subject, html_body)
