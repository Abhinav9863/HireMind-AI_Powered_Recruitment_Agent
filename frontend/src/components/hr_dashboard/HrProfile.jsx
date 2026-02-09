import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { User, Upload, Save, FileText, CheckCircle, AlertCircle, Building, Info } from 'lucide-react';

const HrProfile = ({ user, setUser }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        university_or_company: '', // Maps to Company Name
        bio: '', // Maps to About Company
        phone_number: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                university_or_company: user.university_or_company || '',
                bio: user.bio || '',
                phone_number: user.phone_number || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        // Validation: Full Name (Letters and spaces only)
        if (name === 'full_name') {
            newValue = value.replace(/[^a-zA-Z\s]/g, '');
        }

        // Validation: Phone Number (Numbers and '+' only, max 15 chars)
        if (name === 'phone_number') {
            newValue = value.replace(/[^0-9+]/g, '');
            if (newValue.length > 15) newValue = newValue.slice(0, 15);
        }

        setFormData({ ...formData, [name]: newValue });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_URL}/users/profile`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local user state if provided
            if (setUser) setUser(prev => ({ ...prev, ...response.data }));
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.detail || 'Failed to update profile.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const endpoint = type === 'photo' ? '/users/upload/photo' : '/users/upload/policy';

        try {
            const response = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (setUser) setUser(prev => ({ ...prev, ...response.data }));
            setMessage({ type: 'success', text: `${type === 'photo' ? 'Photo' : 'Policy'} uploaded successfully!` });
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.detail || `Failed to upload ${type}.`;
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                    <User size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
                    <p className="text-gray-500">Manage your company details and policy documents</p>
                </div>
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Profile Picture & Basic Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-indigo-50">
                                {user?.profile_picture ? (
                                    <img
                                        src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}/${user.profile_picture}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150' }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="text-white" size={24} />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
                            </label>
                        </div>
                        <h3 className="font-bold text-gray-900">{user?.full_name || 'HR Manager'}</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                </div>

                {/* Right Column: Edit Details Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Building size={20} className="text-indigo-600" />
                            Company Information
                        </h3>

                        <form onSubmit={handleSaveProfile} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                <input
                                    type="text"
                                    name="university_or_company"
                                    value={formData.university_or_company}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">About Company</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Brief description of your company..."
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-800 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </form>
                    </div>

                    {/* Company Policy Upload */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600" />
                            Company Policy Document
                        </h3>

                        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 hover:border-indigo-400 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
                                <FileText size={24} />
                            </div>
                            <div className="flex-1">
                                {user?.company_policy_path ? (
                                    <div>
                                        <p className="font-bold text-gray-800 mb-1">Current Policy Active</p>
                                        <a
                                            href={`${API_URL}/${user.company_policy_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:underline font-medium"
                                        >
                                            View Uploaded Policy (PDF)
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Upload your company policy (PDF Only)</p>
                                )}
                            </div>
                            <label className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 cursor-pointer shadow-sm transition-all hover:shadow-md">
                                {user?.company_policy_path ? 'Replace File' : 'Upload File'}
                                <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, 'policy')} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HrProfile;
