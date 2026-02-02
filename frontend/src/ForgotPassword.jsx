import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from './config';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Login
                </button>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {!success ? (
                        <>
                            {/* Icon */}
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="text-white" size={32} />
                            </div>

                            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                                Forgot Password?
                            </h1>
                            <p className="text-center text-gray-600 text-sm mb-8">
                                No worries! Enter your email and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={20} />}
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            {/* Success State */}
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="text-green-600" size={32} />
                            </div>

                            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                                Check Your Email
                            </h1>
                            <p className="text-center text-gray-600 text-sm mb-8">
                                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-blue-800">
                                    <strong>Didn't receive the email?</strong>
                                </p>
                                <ul className="text-xs text-blue-700 mt-2 list-disc list-inside space-y-1">
                                    <li>Check your spam/junk folder</li>
                                    <li>Make sure you entered the correct email</li>
                                    <li>The link expires in 1 hour</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Return to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
