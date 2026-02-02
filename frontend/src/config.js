export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Google reCAPTCHA Site Key (get from Google reCAPTCHA admin console)
// Leave empty in development mode - backend will skip verification
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
