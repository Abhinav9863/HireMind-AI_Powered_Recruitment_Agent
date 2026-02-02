import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from './config';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (!tokenFromUrl) {
            setError('Invalid reset link. Please request a new password reset.');
        } else {
            setToken(tokenFromUrl);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_URL}/auth/reset-password`, {
                token,
                new_password: newPassword
            });
            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-red-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
                    <p className="text-gray-600 text-sm mb-6">
                        This password reset link is invalid or has expired.
                    </p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                        Request New Link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {!success ? (
                        <>
                            {/* Icon */}
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="text-white" size={32} />
                            </div>

                            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                                Reset Your Password
                            </h1>
                            <p className="text-center text-gray-600 text-sm mb-8">
                                Enter your new password below
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        minLength={6}
                                    />
                                </div>

                                {/* Password Requirements */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs text-gray-600 font-medium mb-1">Password must:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        <li className={newPassword.length >= 6 ? 'text-green-600' : ''}>
                                            ✓ Be at least 6 characters long
                                        </li>
                                        <li className={newPassword === confirmPassword && newPassword ? 'text-green-600' : ''}>
                                            ✓ Match in both fields
                                        </li>
                                    </ul>
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
                                    {loading ? 'Resetting...' : 'Reset Password'}
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
                                Password Reset Successfully!
                            </h1>
                            <p className="text-center text-gray-600 text-sm mb-8">
                                Your password has been updated. You can now login with your new password.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
                                <p className="text-sm text-blue-800">
                                    Redirecting to login page...
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                            >
                                Go to Login Now
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
