"""
Email Utility Functions using Brevo API (formerly Sendinblue)
Replaces Resend API to enable sending to any email address without domain verification
"""
import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Brevo API client
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = os.getenv("BREVO_API_KEY")


def _send_email_base(to_email: str, subject: str, html_body: str) -> bool:
    """
    Base helper function to send emails using Brevo API
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        html_body: HTML content of the email
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    email_from = os.getenv("EMAIL_FROM", "abhinavclass307@gmail.com")
    
    # Check if Brevo is configured
    if not configuration.api_key['api-key'] or "YourAPIKeyHere" in str(configuration.api_key['api-key']):
        logger.warning(f"📧 [DEV MODE] Email to {to_email} suppressed (Brevo API key not configured)")
        logger.info(f"Subject: {subject}")
        logger.info("To configure: Sign up at https://app.brevo.com and add BREVO_API_KEY to .env")
        return False

    try:
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email}],
            sender={"email": email_from, "name": "HireMind"},
            subject=subject,
            html_content=html_body
        )
        
        api_response = api_instance.send_transac_email(send_smtp_email)
        logger.info(f"✅ Email sent successfully to {to_email} | Message ID: {api_response.message_id}")
        return True

    except ApiException as e:
        logger.error(f"⚠️ Brevo API error: {e}")
        return False
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


async def send_interview_scheduled_email(to_email: str, candidate_name: str, job_title: str, interview_datetime: str, meet_link: str):
    """
    Send interview scheduled notification email
    """
    subject = f"Interview Scheduled - {job_title}"
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">HireMind</h1>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Interview Scheduled!</h2>
            <p>Hi <strong>{candidate_name}</strong>,</p>
            <p>Great news! Your interview for <strong>{job_title}</strong> has been scheduled.</p>
            
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Date & Time:</strong> {interview_datetime}</p>
              <p style="margin: 10px 0;"><strong>Interview Link:</strong> <a href="{meet_link}" style="color: #667eea;">{meet_link}</a></p>
            </div>
            
            <p style="color: #666; font-size: 14px;">Please join the interview using the link above at the scheduled time.</p>
            
            <div style="margin-top: 30px; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
              <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                <strong>Tip:</strong> Ensure you have a stable internet connection and test your camera/microphone before the interview.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              Good luck with your interview!<br>
              The HireMind Team
            </p>
          </div>
        </div>
      </body>
    </html>
    """
    
    _send_email_base(to_email, subject, html_body)


async def send_rejection_email(to_email: str, candidate_name: str, job_title: str):
    """
    Send rejection notification email
    """
    subject = f"Application Update - {job_title}"
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">HireMind</h1>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Application Update</h2>
            <p>Dear <strong>{candidate_name}</strong>,</p>
            <p>Thank you for your interest in the <strong>{job_title}</strong> position and for taking the time to apply.</p>
            
            <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
            
            <p>We appreciate the effort you put into your application and encourage you to apply for future opportunities that match your skills and experience.</p>
            
            <p>We wish you the best of luck in your job search.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              The HireMind Team
            </p>
          </div>
        </div>
      </body>
    </html>
    """
    
    _send_email_base(to_email, subject, html_body)


async def send_interview_rescheduled_email(to_email: str, candidate_name: str, job_title: str, new_datetime: str, meet_link: str):
    """
    Send interview rescheduled notification email
    """
    subject = f"Interview Rescheduled - {job_title}"
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">HireMind</h1>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Interview Rescheduled</h2>
            <p>Hi <strong>{candidate_name}</strong>,</p>
            <p>Your interview for <strong>{job_title}</strong> has been rescheduled to a new date and time.</p>
            
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>New Date & Time:</strong> {new_datetime}</p>
              <p style="margin: 10px 0;"><strong>Interview Link:</strong> <a href="{meet_link}" style="color: #667eea;">{meet_link}</a></p>
            </div>
            
            <p style="color: #666; font-size: 14px;">Please make a note of the new time and join using the link above.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              See you then!<br>
              The HireMind Team
            </p>
          </div>
        </div>
      </body>
    </html>
    """
    
    _send_email_base(to_email, subject, html_body)


async def send_interview_cancelled_email(to_email: str, candidate_name: str, job_title: str):
    """
    Send interview cancelled notification email
    """
    subject = f"Interview Cancelled - {job_title}"
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">HireMind</h1>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Interview Cancelled</h2>
            <p>Hi <strong>{candidate_name}</strong>,</p>
            <p>We regret to inform you that your scheduled interview for <strong>{job_title}</strong> has been cancelled.</p>
            
            <p>We apologize for any inconvenience this may have caused. If you have any questions, please feel free to reach out to us.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              Best regards,<br>
              The HireMind Team
            </p>
          </div>
        </div>
      </body>
    </html>
    """
    
    _send_email_base(to_email, subject, html_body)


async def send_password_reset_email(to_email: str, full_name: str, reset_link: str):
    """
    Send password reset email
    
    Args:
        to_email: Recipient email address
        full_name: User's full name
        reset_link: Password reset link with token
    """
    subject = "Password Reset Request - HireMind"
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">HireMind</h1>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Reset Your Password</h2>
            <p>Hi <strong>{full_name}</strong>,</p>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{reset_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #667eea; font-size: 12px; word-break: break-all;">{reset_link}</p>
            
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
