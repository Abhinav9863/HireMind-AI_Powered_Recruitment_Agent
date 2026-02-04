# Resend Email Setup Guide

## Why Resend?

HireMind uses **Resend** for email delivery because many hosting providers (like Render.com) block SMTP ports to prevent spam. Resend provides a free API-based email service that works reliably on all hosting platforms.

## Quick Setup (5 minutes)

### 1. Create Resend Account

1. Visit [resend.com](https://resend.com)
2. Sign up with your email (no credit card required)
3. Verify your email address

### 2. Generate API Key

1. Log in to Resend dashboard
2. Navigate to [API Keys](https://resend.com/api-keys)
3. Click "Create API Key"
4. Give it a name (e.g., "HireMind Development")
5. Copy the API key (starts with `re_...`)

### 3. Configure Environment

Add to your `backend/.env` file:

```bash
# Email Configuration
RESEND_API_KEY="re_your_actual_api_key_here"
EMAIL_FROM="HireMind <onboarding@resend.dev>"
```

**Note**: For testing, use `onboarding@resend.dev`. For production, you'll need to verify your own domain.

### 4. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Test Email Sending

```bash
cd backend
python test_resend_integration.py
```

Enter your email address when prompted to receive a test OTP email.

## Free Tier Limits

- **100 emails per day**
- **3,000 emails per month**
- Perfect for development, testing, and small-scale deployments

## For Production

To use your own domain (e.g., `noreply@yourdomain.com`):

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain name
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually < 5 minutes)
6. Update `EMAIL_FROM` in `.env`:
   ```bash
   EMAIL_FROM="HireMind <noreply@yourdomain.com>"
   ```

## Deployment to Render

When deploying to Render, set these environment variables in the dashboard:

```
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=HireMind <onboarding@resend.dev>
```

## Troubleshooting

### Email not sending locally

1. Check that `RESEND_API_KEY` is set in `.env`
2. Verify the API key starts with `re_`
3. Run `test_resend_integration.py` to diagnose
4. Check console logs for specific error messages

### Email not sending on Render

1. Verify environment variables are set in Render dashboard
2. Check Render logs for error messages
3. Ensure you're not exceeding free tier limits (100/day)
4. Verify your Resend account is in good standing

### Emails going to spam

- For `@resend.dev` domain: This is normal for test emails
- For custom domain: Ensure SPF, DKIM, and DMARC records are properly configured

## Support

- Resend Documentation: https://resend.com/docs
- Resend Status: https://status.resend.com
- HireMind Issues: [GitHub Issues](https://github.com/Abhinav9863/HireMind-AI_Powered_Recruitment_Agent/issues)
