import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';
import { useNotification } from './context/NotificationContext';
import { PlusCircle, Users, LogOut, Briefcase, MapPin, DollarSign, X, MessageSquare, FileText, CheckCircle, AlertCircle, ChevronRight, Download, Calendar, Search } from 'lucide-react';
import HrSchedule from './HrSchedule';
import HrSidebar from './components/hr_dashboard/HrSidebar';
import HrHeader from './components/hr_dashboard/HrHeader';
import PostJob from './components/hr_dashboard/PostJob';
import HrJobBoard from './components/hr_dashboard/HrJobBoard';
import HrProfile from './components/hr_dashboard/HrProfile';
import Settings from './components/dashboard/Settings';

const HrDashboard = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotification();

    // Add axios interceptor to handle 401s globally within this component's scope
    // (Ideally this should be in a global api configuration file, but this works for now)
    React.useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login'); // Or home '/'
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [navigate]);
    const [activeTab, setActiveTab] = useState('my-jobs'); // 'post-job' | 'my-jobs' | 'schedule' | 'profile'
    const [myJobs, setMyJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Detailed View State
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [selectedAppDetail, setSelectedAppDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        salary_range: '',
        job_type: 'Full-time',
        work_location: 'In-Office',  // Default: In-Office
        experience_required: 0  // Default: freshers welcome
    });
    const [policyFile, setPolicyFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Summary State
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [jobSummary, setJobSummary] = useState(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

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
            addNotification('error', "Failed to generate summary");
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    useEffect(() => {
        fetchUserProfile();
        if (activeTab === 'my-jobs') {
            fetchMyJobs();
        }
    }, [activeTab]);

    const fetchMyJobs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/jobs/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Sort jobs: most new applications first, then by creation date
            const sortedJobs = response.data.sort((a, b) => {
                // First priority: jobs with new applications
                if (b.unviewed_count !== a.unviewed_count) {
                    return b.unviewed_count - a.unviewed_count;
                }
                // Second priority: most recent jobs
                return new Date(b.created_at) - new Date(a.created_at);
            });

            setMyJobs(sortedJobs);
        } catch (error) {
            console.error(error);
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

    // Old manual notification system removed
    const showNotification = (message, type = 'info') => {
        addNotification(type === 'loading' ? 'info' : type, message);
    };

    const fetchApplicationDetail = async (appId) => {
        setDetailLoading(true);
        setSelectedAppId(appId);
        setSummaryData(null);

        // Optimistic update: Mark as viewed locally immediately
        setApplications(prevApps =>
            prevApps.map(app =>
                app.id === appId ? { ...app, viewed: true } : app
            )
        );

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


    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleBackToJobs = () => {
        setSelectedJob(null);
        setApplications([]);
        setSelectedAppId(null);
    };

    const handleViewApplicants = (job) => {
        setSelectedJob(job);
        fetchApplications(job.id);
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
        const jobData = new FormData();
        Object.keys(formData).forEach(key => jobData.append(key, formData[key]));
        if (policyFile) {
            jobData.append('policy_file', policyFile);
        }

        try {
            await axios.post(`${API_URL}/jobs/`, jobData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage('Job Posted Successfully!');
            setFormData({
                title: '', description: '', location: '', salary_range: '', job_type: 'Full-time', work_location: 'In-Office', experience_required: 0
            });
            setPolicyFile(null);
            showNotification("Job Posted Successfully!", 'success');
        } catch (error) {
            console.error(error);
            setMessage('Failed to post job.');
            showNotification("Failed to post job.", 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleUpdateStatus = async (appId, newStatus) => {
        const token = localStorage.getItem('token');

        // Optimistic Update: Update UI immediately
        if (activeTab === 'my-jobs' && selectedJob) {
            // Update detail view immediately
            if (selectedAppDetail && selectedAppDetail.id === appId) {
                setSelectedAppDetail(prev => ({ ...prev, status: newStatus }));
            }

            // Update application list immediately
            setApplications(prevApps =>
                prevApps.map(app =>
                    app.id === appId ? { ...app, status: newStatus } : app
                )
            );
        }

        // Process in background without blocking UI
        try {
            const response = await axios.put(`${API_URL}/applications/${appId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Show Success Notification
            if (newStatus === 'Interviewing') {
                showNotification("Interview scheduled! Email sent to candidate.", 'success');
            } else if (newStatus === 'Rejected') {
                showNotification("Rejection email sent.", 'error'); // Using error type for Red color as requested
            } else {
                showNotification("Status updated.", 'success');
            }

            // Refresh data from server to ensure consistency
            if (activeTab === 'my-jobs' && selectedJob) {
                await fetchApplications(selectedJob.id);

                // Also refresh the detail view if it's open
                if (selectedAppDetail && selectedAppDetail.id === appId) {
                    try {
                        const detailResponse = await axios.get(`${API_URL}/applications/${appId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setSelectedAppDetail(detailResponse.data);
                    } catch (err) {
                        console.error("Failed to refresh detail view", err);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update status", error);
            const errorMsg = error.response?.data?.detail || "Failed to update status";
            showNotification(errorMsg, 'error');

            // Revert optimistic update on error
            if (activeTab === 'my-jobs' && selectedJob) {
                await fetchApplications(selectedJob.id);
                if (selectedAppDetail && selectedAppDetail.id === appId) {
                    try {
                        const result = await axios.get(`${API_URL}/applications/${appId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setSelectedAppDetail(result.data);
                    } catch (err) {
                        console.error("Failed to revert detail view", err);
                    }
                }
            }
        }
    };

    const handleUpdateJob = async (jobId, updatedData) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_URL}/jobs/${jobId}`, updatedData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification("Job updated successfully!", 'success');
            fetchMyJobs(); // Refresh list
        } catch (error) {
            console.error(error);
            showNotification("Failed to update job.", 'error');
        }
    };

    const handleDeleteJob = async (jobId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_URL}/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification("Job deleted successfully.", 'success');
            fetchMyJobs(); // Refresh list
        } catch (error) {
            console.error(error);
            showNotification("Failed to delete job.", 'error');
        }
    };

    const fetchJobSummary = async (jobId) => {
        const token = localStorage.getItem('token');
        setSummaryLoading(true);
        try {
            const response = await axios.get(`${API_URL}/jobs/${jobId}/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobSummary(response.data);
        } catch (error) {
            console.error("Failed to fetch job summary", error);
        } finally {
            setSummaryLoading(false);
        }
    };

    // Render detailed view using a clean slide-over or modal style
    const renderApplicationDetail = () => {
        if (!selectedAppDetail) return null;

        const { candidate_name, candidate_email, ats_score, status, candidate_info, chat_history, ats_report, resume_path } = selectedAppDetail;

        return (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-full flex flex-col overflow-hidden animate-fade-in-right">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{candidate_name}</h2>
                        <p className="text-gray-500 text-sm mb-2">{candidate_email}</p>
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
                        {resume_path ? (
                            <a
                                href={`${API_URL}/${resume_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                <Download size={16} /> Resume
                            </a>
                        ) : (
                            <button
                                disabled
                                className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed flex items-center gap-2 border border-gray-200"
                            >
                                <Download size={16} /> No Resume
                            </button>
                        )}
                        <button
                            onClick={() => handleUpdateStatus(selectedAppDetail.id, 'Interviewing')}
                            className="px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(selectedAppDetail.id, 'Rejected')}
                            className="px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50"
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
                                <p><span className="font-semibold">Experience:</span> {selectedAppDetail.experience_years > 0 ? `${selectedAppDetail.experience_years} Years` : 'Fresher'}</p>
                                <p><span className="font-semibold">Previous:</span> {candidate_info?.is_fresher ? 'N/A' : candidate_info?.previous_institution || 'N/A'}</p>
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
            <HrSidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                    setActiveTab(tab);
                    // Reset selection states when switching major tabs
                    setSelectedJob(null);
                    setSelectedAppDetail(null);
                    setSelectedAppId(null);
                    setSearchQuery('');
                }}
                handleLogout={handleLogout}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative h-full overflow-hidden w-full">
                <HrHeader
                    activeTab={activeTab}
                    selectedJob={selectedJob}
                    handleBackToJobs={handleBackToJobs}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    user={user}
                    toggleSidebar={() => setIsMobileMenuOpen(true)}
                />

                <div className="flex-1 overflow-hidden relative flex">

                    {/* Main Pane */}
                    <div className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${selectedAppId ? 'w-1/2 lg:w-3/5 border-r border-gray-200 hidden lg:block' : 'w-full'}`}>

                        {/* SCHEDULE TAB */}
                        {activeTab === 'schedule' && (
                            <div className="max-w-6xl mx-auto h-full animate-fade-in-up">
                                <HrSchedule />
                            </div>
                        )}

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <HrProfile user={user} setUser={setUser} />
                        )}

                        {/* POST JOB FORM */}
                        {activeTab === 'post-job' && (
                            <div className="animate-fade-in-up">
                                <PostJob
                                    formData={formData}
                                    handleInputChange={handleInputChange}
                                    handleFileChange={handleFileChange}
                                    handlePostJob={handlePostJob}
                                    loading={loading}
                                    message={message}
                                    currentUser={user} // Pass full user object
                                />
                            </div>
                        )}

                        {/* MY JOBS LIST & APPLICANTS */}
                        {activeTab === 'my-jobs' && (
                            <div className="animate-fade-in-up">
                                <HrJobBoard
                                    activeTab={activeTab}
                                    myJobs={myJobs}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    handleViewApplicants={handleViewApplicants}
                                    selectedJob={selectedJob}
                                    handleBackToJobs={handleBackToJobs}
                                    applications={applications}
                                    handleUpdateStatus={handleUpdateStatus}
                                    fetchApplicationDetail={fetchApplicationDetail}
                                    handleUpdateJob={handleUpdateJob}
                                    handleDeleteJob={handleDeleteJob}
                                />
                            </div>
                        )}

                        {/* SETTINGS TAB */}
                        {activeTab === 'settings' && (
                            <div className="max-w-6xl mx-auto h-full animate-fade-in-up">
                                <Settings user={user} handleLogout={handleLogout} />
                            </div>
                        )}
                    </div>

                    {/* Detailed Applicant View (Right Pane) */}
                    {selectedAppId && activeTab === 'my-jobs' && (
                        <div className="w-full lg:w-2/5 p-6 bg-gray-50/50 absolute lg:relative inset-0 z-20">
                            {renderApplicationDetail()}
                        </div>
                    )}

                </div>
            </main>


            {/* Notifications - Removed manual rendering as it's now global */}
        </div>
    );
};

export default HrDashboard;
