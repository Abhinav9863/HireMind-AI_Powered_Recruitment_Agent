import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';
import { PlusCircle, Users, LogOut, Briefcase, MapPin, DollarSign, X, MessageSquare, FileText, CheckCircle, AlertCircle, ChevronRight, Download, Calendar } from 'lucide-react';
import HrSchedule from './HrSchedule';

const HrDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('my-jobs'); // 'post-job' | 'my-jobs'
    const [myJobs, setMyJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);

    // Detailed View State
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [selectedAppDetail, setSelectedAppDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        description: '',
        location: '',
        salary_range: '',
        job_type: 'Full-time',
        experience_required: 0  // Default: freshers welcome
    });
    const [policyFile, setPolicyFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Summary State
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryData, setSummaryData] = useState(null);

    const handleSummarizeInterview = async (appId) => {
        setSummaryLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${API_URL}/interview/summarize/${appId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummaryData(response.data);
        } catch (error) {
            console.error(error);
            alert("Failed to generate summary");
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'my-jobs') {
            fetchMyJobs();
        }
    }, [activeTab]);

    const fetchMyJobs = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/jobs/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyJobs(response.data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        }
    };

    const fetchApplications = async (jobId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/jobs/${jobId}/applications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(response.data);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        }
    };

    const fetchApplicationDetail = async (appId) => {
        setDetailLoading(true);
        setSelectedAppId(appId);
        setSummaryData(null);
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/applications/${appId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedAppDetail(response.data);
        } catch (error) {
            console.error("Failed to fetch application details", error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleViewApplicants = (job) => {
        setSelectedJob(job);
        fetchApplications(job.id);
        setSelectedAppId(null);
        setSelectedAppDetail(null);
        setSummaryData(null);
    };

    const handleBackToJobs = () => {
        setSelectedJob(null);
        setApplications([]);
        setSelectedAppId(null);
        setSelectedAppDetail(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setPolicyFile(e.target.files[0]);
    };

    const handlePostJob = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const token = localStorage.getItem('token');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('location', formData.location);
        data.append('salary_range', formData.salary_range);
        data.append('job_type', formData.job_type);
        data.append('experience_required', formData.experience_required);  // Add experience field
        if (policyFile) {
            data.append('policy_file', policyFile);
        }

        try {
            await axios.post(`${API_URL}/jobs/`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Job Posted Successfully!');
            setFormData({ title: '', company: '', description: '', location: '', salary_range: '', job_type: 'Full-time', experience_required: 0 });
            setPolicyFile(null);
            setTimeout(() => {
                setActiveTab('my-jobs');
                fetchMyJobs();
            }, 1000);
        } catch (error) {
            console.error(error);
            setMessage('Failed to post job.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (appId, newStatus) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_URL}/applications/${appId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update local state smoothly
            if (activeTab === 'my-jobs' && selectedJob) {
                fetchApplications(selectedJob.id); // Refresh list

                // If detail view is open, update it too
                if (selectedAppDetail && selectedAppDetail.id === appId) {
                    setSelectedAppDetail(prev => ({ ...prev, status: newStatus }));
                }

                // Show Success Message
                if (newStatus === 'Interviewing') {
                    alert("Success! Candidate accepted and Interview Email sent.");
                } else if (newStatus === 'Rejected') {
                    alert("Candidate rejected. Rejection email sent.");
                } else {
                    alert("Status updated successfully.");
                }
            }
        } catch (error) {
            console.error("Failed to update status", error);
            const errorMsg = error.response?.data?.detail || "Failed to update status";
            alert(errorMsg);
        }
    };

    // Render detailed view using a clean slide-over or modal style
    const renderApplicationDetail = () => {
        if (!selectedAppDetail) return null;

        const { student_name, student_email, ats_score, status, candidate_info, chat_history, ats_report, resume_path } = selectedAppDetail;

        return (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-full flex flex-col overflow-hidden animate-fade-in-right">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{student_name}</h2>
                        <p className="text-gray-500 text-sm mb-2">{student_email}</p>
                        <div className="flex items-center gap-3 mt-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${ats_score > 75 ? 'bg-green-100 text-green-700' : ats_score > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                ATS: {ats_score}%
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'Accepted' || status === 'Interviewing' ? 'bg-indigo-100 text-indigo-700' : status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {status}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {resume_path && (
                            <a
                                href={`${API_URL}/${resume_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                <Download size={16} /> Resume
                            </a>
                        )}
                        <button
                            onClick={() => handleUpdateStatus(selectedAppDetail.id, 'Interviewing')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(selectedAppDetail.id, 'Rejected')}
                            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition"
                        >
                            Reject
                        </button>
                        <button onClick={() => setSelectedAppId(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* 1. Candidate Summary */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Users size={16} /> Collected Info
                            </h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p><span className="font-semibold">College:</span> {candidate_info?.college || 'N/A'}</p>
                                <p><span className="font-semibold">Experience:</span> {candidate_info?.is_fresher ? 'Fresher' : candidate_info?.previous_institution || 'N/A'}</p>
                                <p><span className="font-semibold">CGPA:</span> {candidate_info?.cgpa || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <AlertCircle size={16} /> ATS Insights
                            </h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p className="font-semibold text-orange-800">Strengths:</p>
                                <div className="flex flex-wrap gap-1">
                                    {ats_report?.strengths?.map((s, i) => <span key={i} className="bg-white px-2 py-0.5 rounded text-xs border border-orange-100">{s}</span>) || "None detected"}
                                </div>
                                <p className="font-semibold text-orange-800 mt-2">Missing Skills:</p>
                                <div className="flex flex-wrap gap-1">
                                    {ats_report?.missing_critical_keywords?.map((s, i) => <span key={i} className="bg-white text-red-500 px-2 py-0.5 rounded text-xs border border-red-100">{s}</span>) || "None"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Interview Chat Transcript */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <MessageSquare size={20} className="text-indigo-600" />
                                AI Interview Transcript
                            </h3>
                            <button
                                onClick={() => handleSummarizeInterview(selectedAppDetail.id)}
                                disabled={summaryLoading || !chat_history || chat_history.length === 0}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {summaryLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={14} /> Summarize Interview
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Summary Card */}
                        {summaryData && (
                            <div className="mb-6 bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden animate-fade-in-up">
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-purple-100 flex justify-between items-center">
                                    <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                                        ✨ AI Interview Analysis
                                    </h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${summaryData.hiring_recommendation.includes('Strong Hire') ? 'bg-green-100 text-green-700 border-green-200' :
                                        summaryData.hiring_recommendation.includes('Reject') ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                        Verdict: {summaryData.hiring_recommendation}
                                    </span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <p className="text-sm text-gray-600 italic border-l-4 border-purple-300 pl-3">
                                        "{summaryData.summary_text}"
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="text-xs font-bold text-green-700 uppercase mb-2">Strengths</h5>
                                            <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                                                {summaryData.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-red-700 uppercase mb-2">Weaknesses</h5>
                                            <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                                                {summaryData.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                                            <span>Project Understanding Score</span>
                                            <span>{summaryData.project_understanding_score}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${summaryData.project_understanding_score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 max-h-[400px] overflow-y-auto space-y-4">
                            {chat_history && chat_history.length > 0 ? (
                                chat_history.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-none'
                                            }`}>
                                            {msg.content || msg.reply || msg.question || msg.answer}

                                            {/* Handle structured Q&A format if present */}
                                            {msg.question && <div className="font-bold mb-1 opacity-70">Q: {msg.question}</div>}
                                            {msg.answer && <div>A: {msg.answer}</div>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 italic">No interview transcript available.</p>
                            )}
                        </div>
                    </div>

                    {/* 3. Resume Text Dump (Collapsed or Scrollable) */}
                    {/* <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-600" />
                            Parsed Resume Content
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 max-h-[200px] overflow-y-auto text-xs text-gray-600 font-mono whitespace-pre-wrap">
                            {selectedAppDetail.resume_text || "No text content available."}
                        </div>
                     </div> */}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 font-poppins text-base overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0 z-20">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-indigo-900 tracking-tight">HireMind HR</h1>
                    <p className="text-xs text-gray-400 mt-1">Recruiter Panel</p>
                </div>
                <div className="p-4 flex-1">
                    <nav className="space-y-1">
                        <button
                            onClick={() => { setActiveTab('my-jobs'); setSelectedJob(null); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-sm font-medium ${activeTab === 'my-jobs' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Briefcase size={18} /> My Jobs
                        </button>
                        <button
                            onClick={() => { setActiveTab('post-job'); setSelectedJob(null); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-sm font-medium ${activeTab === 'post-job' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <PlusCircle size={18} /> Post a Job
                        </button>
                        <button
                            onClick={() => { setActiveTab('schedule'); setSelectedJob(null); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-sm font-medium ${activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Calendar size={18} /> Schedule
                        </button>
                    </nav>
                </div>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative h-full overflow-hidden">
                <header className="px-8 py-5 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {activeTab === 'post-job' ? 'Create New Position' : activeTab === 'schedule' ? 'Interview Schedule' : (selectedJob ? selectedJob.title : 'Active Job Listings')}
                    </h2>
                    {selectedJob && (
                        <button onClick={handleBackToJobs} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                            &larr; Back to Listings
                        </button>
                    )}
                </header>

                <div className="flex-1 overflow-hidden relative flex">

                    {/* Left Pane (Job List OR Applicant List) */}
                    <div className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${selectedAppId ? 'w-1/2 hidden lg:block border-r border-gray-200' : 'w-full'}`}>

                        {/* SCHEDULE TAB */}
                        {activeTab === 'schedule' && (
                            <div className="max-w-6xl mx-auto h-full">
                                <HrSchedule />
                            </div>
                        )}

                        {/* POST JOB FORM */}
                        {activeTab === 'post-job' && (
                            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
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
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                                placeholder="e.g. Senior React Developer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                                            <select
                                                name="job_type"
                                                value={formData.job_type}
                                                onChange={handleInputChange}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
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
                                                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                                    placeholder="e.g. Remote, NY"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Minimum Experience Required
                                                <span className="text-xs text-gray-500 ml-2">(Years)</span>
                                            </label>
                                            <select
                                                name="experience_required"
                                                value={formData.experience_required}
                                                onChange={handleInputChange}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                            >
                                                <option value="0">0 - Freshers Welcome</option>
                                                <option value="1">1+ Year</option>
                                                <option value="2">2+ Years</option>
                                                <option value="3">3+ Years</option>
                                                <option value="4">4+ Years</option>
                                                <option value="5">5+ Years</option>
                                            </select>
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
                                                className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                                placeholder="e.g. $100k - $120k"
                                            />
                                        </div>
                                    </div>


                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Policy (PDF) - Optional</label>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                            rows="6"
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
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
                                        className="w-full bg-indigo-900 text-white font-bold py-4 rounded-xl hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 transform hover:-translate-y-0.5"
                                    >
                                        {loading ? 'Posting...' : 'Post Job'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* MY JOBS LIST */}
                        {activeTab === 'my-jobs' && !selectedJob && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {myJobs.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-gray-500">
                                        <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                                        <h3 className="text-xl font-bold text-gray-700">No Jobs Posted Yet</h3>
                                        <p>Start by creating a new position.</p>
                                    </div>
                                ) : (
                                    myJobs.map((job) => (
                                        <div key={job.id}
                                            onClick={() => handleViewApplicants(job)}
                                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-700 transition-colors">{job.title}</h3>
                                                    <p className="text-sm text-gray-500">{job.company}</p>
                                                </div>
                                                <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                                                    {job.job_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                                                <div className="flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> {job.location}</div>
                                                <div className="flex items-center gap-1"><DollarSign size={14} className="text-gray-400" /> {job.salary_range}</div>
                                            </div>
                                            <div className="flex items-center text-sm font-medium text-indigo-600">
                                                View Applicants <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* APPLICANT LIST */}
                        {activeTab === 'my-jobs' && selectedJob && (
                            <div className="space-y-4">
                                {applications.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
                                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                                        <h3 className="text-xl font-bold text-gray-700">No Applicants Yet</h3>
                                        <p>Waiting for candidates to apply.</p>
                                    </div>
                                ) : (
                                    applications.map((app) => (
                                        <div
                                            key={app.id}
                                            onClick={() => fetchApplicationDetail(app.id)}
                                            className={`bg-white p-5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedAppId === app.id ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-gray-100 hover:border-indigo-300 hover:shadow-sm'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${app.ats_score > 75 ? 'bg-green-100 text-green-700' : app.ats_score > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                    {app.ats_score}%
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{app.student_name}</h4>
                                                    <p className="text-xs text-gray-500">{app.student_email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${app.status === 'Accepted' || app.status === 'Interviewing' ? 'bg-indigo-50 text-indigo-700' :
                                                    app.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Pane (Detailed View) */}
                    {
                        selectedAppId && (
                            <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 bg-white shadow-2xl transform transition-transform duration-300 z-30 lg:relative lg:transform-none lg:shadow-none detail-view">
                                {detailLoading ? (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : (
                                    renderApplicationDetail()
                                )}
                            </div>
                        )
                    }
                </div >
            </main >
        </div >
    );
};

export default HrDashboard;
