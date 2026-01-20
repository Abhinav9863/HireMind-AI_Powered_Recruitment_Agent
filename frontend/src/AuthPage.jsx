import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const AuthPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isHrMode, setIsHrMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Form States
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        companyName: '',  // For HR
        university: ''    // For Student
    });

    const API_URL = 'http://localhost:8000';

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

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            // Call the Mock Endpoint
            const response = await axios.post(`${API_URL}/auth/google-mock`, {
                role: isHrMode ? 'hr' : 'student'
            });

            const token = response.data.access_token;
            localStorage.setItem('token', token);
            localStorage.setItem('role', isHrMode ? 'hr' : 'student');

            // Success navigation
            if (isHrMode) {
                navigate('/hr-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            console.error("Google Mock Login Failed", err);
            setError("Google Demo Login Failed");
        } finally {
            setLoading(false);
        }
    }

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
            const payload = isSignUp ? {
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName,
                role: isHrMode ? 'hr' : 'student',
                company_name: isHrMode ? formData.companyName : null,
                university: !isHrMode ? formData.university : null
            } : {
                // Login payload matches UserCreate simplified schema for now, or just email/password
                email: formData.email,
                password: formData.password,
                full_name: "Login User", // Dummy for login schema validation if re-using UserCreate
                role: isHrMode ? 'hr' : 'student' // Dummy
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
            setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const title = isHrMode ? 'Recruiter' : 'Student';
    const overlayClass = isHrMode ? 'hr-mode' : '';

    return (
        <div className={`container ${isSignUp ? 'right-panel-active' : ''} ${overlayClass}`}>

            {/* Sign Up Form */}
            <div className="form-container sign-up-container flex flex-col items-center justify-center p-12 bg-white text-center">
                <form className="flex flex-col items-center w-full h-full justify-center" onSubmit={handleAuth}>
                    <h1 className="text-2xl font-bold mb-4">Create {title} Account</h1>

                    {/* Google Login Button */}
                    <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg py-2.5 mb-4 hover:bg-gray-50 transition-colors">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="google logo" />
                        <span className="text-sm font-medium text-gray-700">Sign up with Google</span>
                    </button>

                    <span className="text-xs text-gray-500 mb-2">or use your email for registration</span>

                    <input name="fullName" type="text" placeholder="Full Name" className="input-field" required onChange={handleInputChange} />
                    <input name="email" type="email" placeholder="Email" className="input-field" required onChange={handleInputChange} />
                    <input name="password" type="password" placeholder="Password" className="input-field" required onChange={handleInputChange} />

                    {/* Role Specific Fields */}
                    {isHrMode ? (
                        <input name="companyName" type="text" placeholder="Company Name" className="input-field" required={isHrMode} onChange={handleInputChange} />
                    ) : (
                        <input name="university" type="text" placeholder="University / College" className="input-field" required={!isHrMode} onChange={handleInputChange} />
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

                    {/* Google Login Button */}
                    <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg py-2.5 mb-4 hover:bg-gray-50 transition-colors">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="google logo" />
                        <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
                    </button>

                    <span className="text-xs text-gray-500 mb-2">or use your account</span>

                    <input name="email" type="email" placeholder="Email" className="input-field" required onChange={handleInputChange} />
                    <input name="password" type="password" placeholder="Password" className="input-field" required onChange={handleInputChange} />

                    <a href="#" className="text-xs text-gray-500 my-2 hover:underline">Forgot your password?</a>

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
    );
};

export default AuthPage;
