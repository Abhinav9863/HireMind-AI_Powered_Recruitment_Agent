import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, PlusCircle, Users, LogOut, Briefcase, MapPin, DollarSign, Building } from 'lucide-react';

const HrDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('post-job'); // 'post-job' | 'candidates'
    const [jobs, setJobs] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        company: '', // Will be overridden by backend or we can let them edit if needed
        description: '',
        location: '',
        salary_range: '',
        job_type: 'Full-time'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://localhost:8000/jobs/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(response.data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePostJob = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post('http://localhost:8000/jobs/', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Job Posted Successfully!');
            setFormData({ title: '', company: '', description: '', location: '', salary_range: '', job_type: 'Full-time' });
            // Refresh job list
        } catch (error) {
            console.error(error);
            setMessage('Failed to post job.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-poppins text-base">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-indigo-900">HireMind HR</h1>
                    <p className="text-xs text-gray-400 mt-1">Recruiter Panel</p>
                </div>
                <div className="p-6 flex-1">
                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('post-job')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${activeTab === 'post-job' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <PlusCircle size={18} /> Post a Job
                        </button>
                        <button
                            onClick={() => setActiveTab('candidates')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${activeTab === 'candidates' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Users size={18} /> View Candidates
                        </button>
                    </nav>
                </div>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <header className="mb-8 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {activeTab === 'post-job' ? 'Create New Position' : 'Candidate Applications'}
                    </h2>
                </header>

                {activeTab === 'post-job' && (
                    <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <form onSubmit={handlePostJob} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Senior React Developer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                                    <select
                                        name="job_type"
                                        value={formData.job_type}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option>Full-time</option>
                                        <option>Part-time</option>
                                        <option>Contract</option>
                                        <option>Internship</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. Remote, NY"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="salary_range"
                                            value={formData.salary_range}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. $100k - $120k"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows="6"
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Enter detailed job description..."
                                ></textarea>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-900 text-white font-bold py-4 rounded-xl hover:bg-indigo-800 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                            >
                                {loading ? 'Posting...' : 'Post Job'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'candidates' && (
                    <div className="text-center py-20 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-gray-700">No Candidates Yet</h3>
                        <p>Applicants will appear here once they apply to your jobs.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HrDashboard;
