import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, GraduationCap, Loader2, X, Mail, RefreshCw } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';
import { API_URL, RECAPTCHA_SITE_KEY } from './config';

const AuthPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isHrMode, setIsHrMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpMethod, setOtpMethod] = useState('email'); // 'email' only
    const [otp, setOtp] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Form States
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        universityOrCompany: ''
    });

    // Handle URL-based mode switching
    useEffect(() => {
        setIsHrMode(location.pathname === '/hr');
        setError(''); // Clear errors on mode switch
    }, [location.pathname]);

    const handleModeSwitch = () => {
        navigate(isHrMode ? '/' : '/hr');
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');



        try {
            await axios.post(`${API_URL}/auth/signup`, {
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName,
                role: isHrMode ? 'hr' : 'student',
                university_or_company: formData.universityOrCompany
            });

            // Show OTP verification modal
            setShowOTPModal(true);
            setError('');

        } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/auth/verify-otp`, {
                email_or_phone: formData.email,
                otp: otp,
                verification_type: 'email'
            });

            if (response.data.success) {
                setShowOTPModal(false);
                setIsSignUp(false);
                alert('Account verified successfully! You can now login.');
                // Clear form
                setFormData({
                    email: '',
                    password: '',
                    fullName: '',
                    universityOrCompany: ''
                });
                setOtp('');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setError('');

        try {
            await axios.post(`${API_URL}/auth/resend-otp`, {
                email: formData.email,
                method: 'email'
            });

            alert(`OTP resent to your email!`);
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isSignUp) {
            await handleSignup(e);
            return;
        }

        try {
            const endpoint = '/auth/login';
            const payload = {
                email: formData.email,
                password: formData.password,
                role: isHrMode ? 'hr' : 'student'
            };

            const response = await axios.post(`${API_URL}${endpoint}`, payload);

            // Success
            const token = response.data.access_token;
            localStorage.setItem('token', token);
            localStorage.setItem('role', isHrMode ? 'hr' : 'student');

            // Navigate to Dashboard
            if (isHrMode) {
                navigate('/hr-dashboard');
            } else {
                navigate('/student-dashboard');
            }

        } catch (err) {
            console.error(err);
            const errorDetail = err.response?.data?.detail || 'Authentication failed. Please try again.';

            // Check if error is due to unverified email
            if (errorDetail.includes('not verified') || errorDetail.includes('verify')) {
                setError('Account not verified. Please verify using the OTP sent to your email.');
                // Show OTP modal to allow verification
                setShowOTPModal(true);
                setOtpMethod('email'); // Default to email
            } else {
                setError(errorDetail);
            }
        } finally {
            setLoading(false);
        }
    };

    const title = isHrMode ? 'Recruiter' : 'Student';
    const overlayClass = isHrMode ? 'hr-mode' : '';

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 font-poppins text-base antialiased">
            <div className={`container ${isSignUp ? 'right-panel-active' : ''} ${overlayClass}`}>

                {/* Sign Up Form */}
                <div className="form-container sign-up-container flex flex-col items-center justify-center p-12 bg-white text-center">
                    <form className="flex flex-col items-center w-full h-full justify-center" onSubmit={handleAuth}>
                        <h1 className="text-2xl font-bold mb-4">Create {title} Account</h1>

                        <span className="text-xs text-gray-500 mb-2">Fill in your details to get started</span>

                        <input name="fullName" type="text" placeholder="Full Name" className="input-field" required onChange={handleInputChange} value={formData.fullName} />
                        <input name="email" type="email" placeholder="Email" className="input-field" required onChange={handleInputChange} value={formData.email} />
                        <input name="password" type="password" placeholder="Password" className="input-field" required onChange={handleInputChange} value={formData.password} />
                        {/* Unified Company/University Field */}
                        <input
                            name="universityOrCompany"
                            type="text"
                            placeholder={isHrMode ? "Company Name" : "University / College"}
                            className="input-field"
                            required
                            onChange={handleInputChange}
                            value={formData.universityOrCompany}
                        />

                        {/* reCAPTCHA */}
                        {RECAPTCHA_SITE_KEY && (
                            <div className="mb-3">
                                <ReCAPTCHA
                                    sitekey={RECAPTCHA_SITE_KEY}
                                    onChange={handleCaptchaChange}
                                />
                            </div>
                        )}

                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                        <button className="btn-solid flex items-center gap-2" disabled={loading}>
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            {loading ? 'Creating...' : 'Sign Up'}
                        </button>

                        <div onClick={handleModeSwitch} className="mt-6 text-xs text-gray-500 cursor-pointer hover:text-black flex items-center gap-1 transition-colors">
                            {isHrMode ? <><GraduationCap size={14} /> Not a Recruiter? Join as Student</> : <><Briefcase size={14} /> Are you hiring? Join as Recruiter</>}
                        </div>
                    </form>
                </div>

                {/* Sign In Form */}
                <div className="form-container sign-in-container flex flex-col items-center justify-center p-12 bg-white text-center">
                    <form className="flex flex-col items-center w-full h-full justify-center" onSubmit={handleAuth}>
                        <h1 className="text-2xl font-bold mb-4">{title} Login</h1>

                        <span className="text-xs text-gray-500 mb-2">or use your account</span>

                        <input name="email" type="email" placeholder="Email" className="input-field" required onChange={handleInputChange} value={formData.email} />
                        <input name="password" type="password" placeholder="Password" className="input-field" required onChange={handleInputChange} value={formData.password} />

                        <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="text-xs text-gray-500 my-2 hover:underline cursor-pointer"
                        >
                            Forgot your password?
                        </button>

                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                        <button className="btn-solid flex items-center gap-2" disabled={loading}>
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>

                        <div onClick={handleModeSwitch} className="mt-6 text-xs text-gray-500 cursor-pointer hover:text-black flex items-center gap-1 transition-colors">
                            {isHrMode ? <><GraduationCap size={14} /> Not a Recruiter? Student Login</> : <><Briefcase size={14} /> Are you hiring? Recruiter Login</>}
                        </div>
                    </form>
                </div>

                {/* Overlay Panel */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
                            <p className="text-sm font-light mb-8">To keep connected with us please login with your personal info</p>
                            <button className="btn-grad" onClick={() => { setIsSignUp(false); setError(''); }}>Sign In</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1 className="text-3xl font-bold mb-4">Hello, {title}!</h1>
                            <p className="text-sm font-light mb-8">Enter your personal details and start your journey with HireMind</p>
                            <button className="btn-grad" onClick={() => { setIsSignUp(true); setError(''); }}>Sign Up</button>
                        </div>
                    </div>
                </div>

            </div>

            {/* OTP Verification Modal */}
            {showOTPModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Verify Your Account (No SMS)</h2>
                            <button onClick={() => setShowOTPModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>



                        <p className="text-sm text-gray-600 mb-4 text-center">
                            Enter the 6-digit code sent to your email
                        </p>

                        {/* OTP Input */}
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="000000"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:border-purple-500 focus:outline-none mb-4"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                        />

                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

                        {/* Verify Button */}
                        <button
                            onClick={handleVerifyOTP}
                            disabled={otp.length !== 6 || loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        {/* Resend OTP */}
                        <button
                            onClick={handleResendOTP}
                            disabled={loading}
                            className="w-full py-2 px-4 text-purple-600 font-medium hover:bg-purple-50 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Resend Code
                        </button>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            Code expires in 5 minutes
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
