import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';
import { LogOut, Send, Paperclip, FileText, User, Briefcase, ChevronRight, UploadCloud, CheckCircle, MapPin, DollarSign } from 'lucide-react';

const CandidateDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'chat' | 'ats'
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicationId, setApplicationId] = useState(null);
    const [hasResume, setHasResume] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    // ATS State
    const [atsResult, setAtsResult] = useState(null);
    const [atsLoading, setAtsLoading] = useState(false);
    const [atsJd, setAtsJd] = useState('');
    const [atsJobTitle, setAtsJobTitle] = useState('');
    const [atsHistory, setAtsHistory] = useState([]);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    // Applications State
    const [myApplications, setMyApplications] = useState([]);
    const [currentAtsScore, setCurrentAtsScore] = useState(null);

    // Profile State
    const [profile, setProfile] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const fileInputRef = useRef(null);
    const atsFileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await axios.get(`${API_URL}/jobs/`);
            setJobs(response.data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        }
    };

    const fetchAtsHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await axios.get(`${API_URL}/ats/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAtsHistory(response.data);
        } catch (error) {
            console.error("Failed to fetch ATS history", error);
        }
    };

    const fetchMyApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await axios.get(`${API_URL}/applications/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyApplications(response.data);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        }
    };

    // Form State for Profile
    const [formData, setFormData] = useState({
        full_name: '',
        university: '',
        bio: '',
        phone_number: ''
    });
    const [saveLoading, setSaveLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [resumeLoading, setResumeLoading] = useState(false);

    // File Buffer State
    const [photoFile, setPhotoFile] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [resumePreviewUrl, setResumePreviewUrl] = useState(null);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await axios.get(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Profile Data:", response.data);
            setProfile(response.data);
            setHasResume(!!response.data.resume_path);

            // Sync form data with profile
            setFormData({
                full_name: response.data.full_name || '',
                university: response.data.university || '',
                bio: response.data.bio || '',
                phone_number: response.data.phone_number || ''
            });

        } catch (error) {
            console.error("Failed to fetch profile", error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                navigate('/');
            } else {
                // Allow empty form if fetch fails
                setFormData({ full_name: '', university: '', bio: '', phone_number: '' });
                // Ensure profile object exists so the view renders
                setProfile({ full_name: '', email: '', university: '', bio: '', phone_number: '' });
            }
        }
    };

    useEffect(() => {
        fetchJobs();
        fetchAtsHistory();
        fetchMyApplications();
        fetchProfile();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    const handleApply = (job) => {
        setSelectedJob(job);
        setActiveTab('chat');
        setMessages([
            {
                id: 1,
                sender: 'ai',
                text: `Hello! I see you're applying for the ${job.title} position at ${job.company}. To proceed, please upload your resume so I can verify your fit.`
            }
        ]);
        setHasResume(false);
        setApplicationId(null); // Reset App ID
    };

    const triggerFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileName = file.name;

            // User Message
            const userMsg = { id: Date.now(), sender: 'user', text: `Uploaded: ${fileName}` };
            setMessages(prev => [...prev, userMsg]);

            // Send to Backend
            const formData = new FormData();
            formData.append('resume', file);
            formData.append('job_id', selectedJob.id);

            const token = localStorage.getItem('token');
            try {
                const response = await axios.post(`${API_URL}/interview/start`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                setApplicationId(response.data.application_id);
                setHasResume(true);

                // Get ATS score directly from the response
                if (response.data.ats_score !== undefined && response.data.ats_score !== null) {
                    setCurrentAtsScore(response.data.ats_score);
                }

                // AI Response (First Question)
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'ai',
                        text: response.data.reply
                    }]);
                }, 500);

                // Refresh applications list to show "Applied" status on dashboard
                fetchMyApplications();

            } catch (error) {
                console.error("Interview Start Error:", error);

                // Extract specific error message from backend if available
                let errorMessage = "Sorry, I encountered an error processing your resume. Please try again.";

                if (error.response && error.response.data && error.response.data.detail) {
                    // Use the specific error message from the backend
                    errorMessage = error.response.data.detail;
                }

                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: errorMessage
                }]);
            }
        }
    };

    const handleAtsAnalyze = async (e) => {
        if (!atsJobTitle.trim()) {
            alert("Please enter a Job Title (e.g., 'React Developer') to analyze against.");
            if (atsFileInputRef.current) atsFileInputRef.current.value = ""; // Reset file input
            return;
        }

        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // 1. Show Preview Immediately
            const objectUrl = URL.createObjectURL(file);
            setPdfPreviewUrl(objectUrl);

            setAtsLoading(true);
            setAtsResult(null);

            const formData = new FormData();
            formData.append('resume', file);
            formData.append('job_description', atsJd);
            formData.append('job_title', atsJobTitle);

            try {
                // Use a direct call or with auth header if needed (ATS check is technically free/public in plan but let's assume auth for now)
                const token = localStorage.getItem('token');
                const response = await axios.post(`${API_URL}/ats/analyze`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setAtsResult(response.data);
                fetchAtsHistory(); // 2. Refresh History
            } catch (error) {
                console.error("ATS Analysis Failed", error);
                alert("Failed to analyze resume. Please try again.");
            } finally {
                setAtsLoading(false);
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // User Message
        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        if (!applicationId) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: "Please upload your resume to start the interview process."
            }]);
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${API_URL}/interview/chat`, {
                application_id: applicationId,
                message: input
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const aiMsg = { id: Date.now() + 1, sender: 'ai', text: response.data.reply };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg = { id: Date.now() + 1, sender: 'ai', text: "Sorry, I'm having trouble connecting to the interview server." };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaveLoading(true);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            // Upload Photo if selected
            if (photoFile) {
                try {
                    const photoData = new FormData();
                    photoData.append('file', photoFile);
                    await axios.post(`${API_URL}/users/upload/photo`, photoData, { headers });
                } catch (err) {
                    console.error("Photo upload failed", err);
                    throw new Error(`Photo upload failed: ${err.response?.data?.detail || err.message}`);
                }
            }

            // Upload Resume if selected
            if (resumeFile) {
                try {
                    const resumeData = new FormData();
                    resumeData.append('file', resumeFile);
                    await axios.post(`${API_URL}/users/upload/resume`, resumeData, { headers });
                } catch (err) {
                    console.error("Resume upload failed", err);
                    throw new Error(`Resume upload failed: ${err.response?.data?.detail || err.message}`);
                }
            }

            // Update Text Profile
            try {
                await axios.put(`${API_URL}/users/profile`, formData, { headers });
            } catch (err) {
                console.error("Profile update failed", err);
                throw new Error(`Profile details update failed: ${err.response?.data?.detail || err.message}`);
            }

            alert("Profile updated successfully!");
            setPhotoFile(null);
            setResumeFile(null);
            setPreviewUrl(null);
            setResumePreviewUrl(null);
            fetchProfile(); // Refresh all data

        } catch (error) {
            console.error("Failed to update profile", error);
            alert(error.message);
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-poppins text-base">

            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">HireMind AI</h1>
                    <p className="text-xs text-gray-400 mt-1">Smart Recruitment</p>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <nav className="space-y-2 mb-8">
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${activeTab === 'jobs' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Briefcase size={18} /> Job Board
                        </button>
                        <button
                            onClick={() => { if (selectedJob) setActiveTab('chat'); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${activeTab === 'chat' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'} ${!selectedJob ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Send size={18} /> Interview Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('ats')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${activeTab === 'ats' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <FileText size={18} /> ATS Scanner
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${activeTab === 'applications' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <CheckCircle size={18} /> My Applications
                        </button>
                    </nav>

                    <div className="mb-8 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onClick={() => setActiveTab('profile')}>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Profile</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 overflow-hidden">
                                {profile?.profile_picture ? (
                                    <img src={`${API_URL}/${profile.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{profile?.full_name || 'Loading...'}</p>
                                <p className="text-xs text-gray-500">{profile?.university || 'View Profile'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Resume Stats - Only Visible when Active in Chat & Has Resume */}
                    {activeTab === 'chat' && hasResume && currentAtsScore !== null && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Application Stats</h3>
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-indigo-900 font-medium text-sm">ATS Match</span>
                                    <span className={`text-white text-xs px-2 py-0.5 rounded-full ${currentAtsScore >= 70 ? 'bg-green-600' : currentAtsScore >= 40 ? 'bg-yellow-600' : 'bg-red-600'}`}>
                                        {currentAtsScore}%
                                    </span>
                                </div>
                                <div className="w-full bg-indigo-200 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${currentAtsScore >= 70 ? 'bg-green-600' : currentAtsScore >= 40 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${currentAtsScore}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">

                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">
                        {activeTab === 'jobs' ? 'Available Opportunities' :
                            activeTab === 'profile' ? 'My Profile' :
                                activeTab === 'ats' ? 'ATS Scanner' :
                                    activeTab === 'applications' ? 'My Applications' :
                                        selectedJob ? `${selectedJob.title} - ${selectedJob.company}` : 'Interview Chat'}
                    </h2>
                    {selectedJob && activeTab === 'chat' && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Applying to <strong>{selectedJob.company}</strong></span>
                        </div>
                    )}
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">

                    {/* JOB BOARD VIEW */}
                    {activeTab === 'jobs' && (
                        <div className="h-full overflow-y-auto p-8">
                            {/* ... existing jobs code ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {jobs.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-gray-500">
                                        <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                                        <h3 className="text-xl font-bold text-gray-700">No Openings Found</h3>
                                        <p>Check back later for new opportunities.</p>
                                    </div>
                                ) : (
                                    jobs.map(job => (
                                        <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-lg text-indigo-600">
                                                    {job.company.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                                                        {job.job_type}
                                                    </span>
                                                    {job.experience_required !== undefined && (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.experience_required === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {job.experience_required === 0 ? '🎓 Freshers Welcome' : `💼 ${job.experience_required}+ Years Required`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-1">{job.title}</h3>
                                            <p className="text-sm text-gray-500 mb-4">{job.company}</p>

                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <MapPin size={14} /> {job.location}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                                <DollarSign size={14} /> {job.salary_range}
                                            </div>

                                            {job.policy_path && (
                                                <div className="mb-4 text-xs">
                                                    <a
                                                        href={`${API_URL}/${job.policy_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-indigo-600 hover:underline"
                                                    >
                                                        <FileText size={14} /> View Company Policy (PDF)
                                                    </a>
                                                </div>
                                            )}

                                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                                {myApplications.some(app => app.job_title === job.title && app.company_name === job.company) ? (
                                                    <button
                                                        disabled
                                                        className="w-full bg-green-100 text-green-700 text-sm font-bold px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle size={16} /> Applied
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleApply(job)}
                                                        className="w-full bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        Apply <ChevronRight size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}


                    {/* ATS SCANNER VIEW */}
                    {activeTab === 'ats' && (
                        <div className="h-full overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto space-y-12">
                                {/* Analyzer Section */}
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Free ATS Resume Checker</h2>
                                    <p className="text-gray-500 mb-8">Upload your resume and a job description to see how well you match.</p>

                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Title <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={atsJobTitle}
                                                onChange={(e) => setAtsJobTitle(e.target.value)}
                                                placeholder="e.g. Full Stack Developer, Data Scientist..."
                                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Description (Optional)</label>
                                            <textarea
                                                value={atsJd}
                                                onChange={(e) => setAtsJd(e.target.value)}
                                                placeholder="Paste the job description here for better accuracy..."
                                                className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm"
                                            />
                                        </div>

                                        <div className="flex justify-center">
                                            <input
                                                type="file"
                                                ref={atsFileInputRef}
                                                onChange={handleAtsAnalyze}
                                                className="hidden"
                                                accept=".pdf"
                                            />
                                            <button
                                                onClick={() => atsFileInputRef.current?.click()}
                                                disabled={atsLoading}
                                                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {atsLoading ? (
                                                    <>Processing...</>
                                                ) : (
                                                    <><UploadCloud size={20} /> Upload Resume & Analyze</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ... Logic for Result Display ... */}
                                    {atsResult && (
                                        <div className="space-y-6 animate-fade-in">
                                            {/* Score Card */}
                                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800 mb-1">ATS Compatibility Score</h3>
                                                    <p className="text-sm text-gray-500">Based on keyword match and formatting</p>
                                                </div>
                                                <div className="relative w-24 h-24 flex items-center justify-center">
                                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                                        <path
                                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                            fill="none"
                                                            stroke="#E0E7FF"
                                                            strokeWidth="3"
                                                        />
                                                        <path
                                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                            fill="none"
                                                            stroke={atsResult.score > 70 ? "#16A34A" : atsResult.score > 40 ? "#CA8A04" : "#DC2626"}
                                                            strokeWidth="3"
                                                            strokeDasharray={`${atsResult.score}, 100`}
                                                        />
                                                    </svg>
                                                    <span className="absolute text-2xl font-bold text-gray-800">{atsResult.score}%</span>
                                                </div>
                                            </div>

                                            {/* Split Screen Concept: Resume Preview + Detailed Feedback */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
                                                {/* Left: Resume Preview */}
                                                <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                                                    {pdfPreviewUrl ? (
                                                        <iframe
                                                            src={pdfPreviewUrl}
                                                            className="w-full h-full"
                                                            title="Resume Preview"
                                                        />
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-gray-400">
                                                            <p>No PDF uploaded</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Feedback */}
                                                <div className="overflow-y-auto pr-2 space-y-6">
                                                    {/* Missing Critical */}
                                                    {atsResult.missing_critical_keywords && atsResult.missing_critical_keywords.length > 0 && (
                                                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                                                            <h3 className="text-red-800 font-bold mb-3 flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                Missing Critical Skills
                                                            </h3>
                                                            <div className="flex flex-wrap gap-2">
                                                                {atsResult.missing_critical_keywords.map((kw, i) => (
                                                                    <span key={i} className="bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-medium border border-red-100 shadow-sm">
                                                                        {kw}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Detailed Feedback */}
                                                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                                                        <h3 className="text-indigo-900 font-bold mb-2">AI Critique</h3>
                                                        <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-line">
                                                            {atsResult.feedback}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* History Section */}
                                <div className="border-t border-gray-100 pt-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Past Analysis History</h3>
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                                                <tr>
                                                    <th className="px-6 py-3">Job Title</th>
                                                    <th className="px-6 py-3">Score</th>
                                                    <th className="px-6 py-3">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {atsHistory.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="3" className="px-6 py-4 text-center">No history found.</td>
                                                    </tr>
                                                ) : (
                                                    atsHistory.map((item) => (
                                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                                            <td className="px-6 py-4 font-medium text-gray-900">{item.job_title}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.score > 70 ? 'bg-green-100 text-green-700' : item.score > 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {item.score}%
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROFILE VIEW */}
                    {activeTab === 'profile' && profile && (
                        <div className="h-full overflow-y-auto p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>
                            <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

                                {/* Photo Section */}
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative group">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border-2 border-white shadow-sm">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : profile.profile_picture ? (
                                                <img
                                                    src={profile.profile_picture.startsWith('http') ? profile.profile_picture : `${API_URL}/${profile.profile_picture}?t=${Date.now()}`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                                                />
                                            ) : (
                                                <User size={40} />
                                            )}
                                        </div>
                                        <button
                                            onClick={() => document.getElementById('pfp-input').click()}
                                            disabled={photoLoading}
                                            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition"
                                            title="Change Photo"
                                        >
                                            {photoLoading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <UploadCloud size={16} />}
                                        </button>
                                        <input
                                            id="pfp-input"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files[0]) {
                                                    setPhotoFile(e.target.files[0]);
                                                    setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{profile.full_name || 'No Name Set'}</h3>
                                        <p className="text-gray-500">{profile.email}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <input type="text"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input type="text"
                                                value={formData.phone_number}
                                                placeholder="+1 234 567 8900"
                                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">University / College</label>
                                        <input type="text"
                                            value={formData.university}
                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition" />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={saveLoading}
                                            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {saveLoading ? 'Saving...' : 'Save Profile Changes'}
                                        </button>
                                    </div>
                                </form>

                                <div className="border-t border-gray-100 my-8 pt-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Resume Management</h3>
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                <FileText size={24} />
                                            </div>
                                            <div className="flex-1">
                                                {resumeFile ? (
                                                    <div>
                                                        <p className="font-bold text-indigo-700 text-sm">Selected for Upload:</p>
                                                        <p className="text-gray-900 font-medium truncate">{resumeFile.name}</p>
                                                        {resumePreviewUrl && (
                                                            <a href={resumePreviewUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 underline mt-1 block">
                                                                Preview New Resume
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : profile.resume_path ? (
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">Current Resume</p>
                                                        <a href={`${API_URL}/${profile.resume_path}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-1 block">
                                                            View Uploaded Resume
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 italic text-sm">No resume uploaded yet</p>
                                                )}
                                            </div>
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('resume-upload').click()}
                                                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
                                                >
                                                    {resumeFile ? 'Change Selection' : 'Upload Resume'}
                                                </button>
                                                <input
                                                    id="resume-upload"
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf"
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            const file = e.target.files[0];
                                                            setResumeFile(file);
                                                            setResumePreviewUrl(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {resumeFile && (
                                            <div className="bg-indigo-50 text-indigo-800 text-xs px-3 py-2 rounded-md border border-indigo-100 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                                Click "Save Profile Changes" below to upload this resume.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPLICATIONS VIEW */}
                    {activeTab === 'applications' && (
                        <div className="h-full overflow-y-auto p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Job Applications</h2>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Company</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Applied On</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myApplications.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-center">You haven't applied to any jobs yet.</td>
                                            </tr>
                                        ) : (
                                            myApplications.map((app) => (
                                                <tr key={app.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{app.company_name}</td>
                                                    <td className="px-6 py-4">{app.job_title}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${app.status === 'Accepted' || app.status === 'Interviewing' ? 'bg-green-100 text-green-700' :
                                                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">{new Date(app.applied_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CHAT VIEW */}
                    {
                        activeTab === 'chat' && (
                            <div className="h-full flex flex-col">
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                                : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-none'
                                                }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center gap-3">

                                        {/* Upload Trigger */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept=".pdf,.doc,.docx"
                                        />
                                        <button
                                            type="button"
                                            onClick={triggerFileUpload}
                                            className={`p-3 rounded-full transition-colors ${hasResume ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                            title="Upload Resume"
                                        >
                                            {hasResume ? <CheckCircle size={20} /> : <Paperclip size={20} />}
                                        </button>

                                        {/* Profile Resume Quick Action */}
                                        {profile?.resume_path && !hasResume && (
                                            <button type="button"
                                                onClick={async () => {
                                                    // Trigger start interview with profile resume
                                                    // User Message
                                                    const userMsg = { id: Date.now(), sender: 'user', text: `Used Profile Resume` };
                                                    setMessages(prev => [...prev, userMsg]);

                                                    const formData = new FormData();
                                                    formData.append('job_id', selectedJob.id);
                                                    formData.append('use_profile_resume', true);

                                                    const token = localStorage.getItem('token');
                                                    try {
                                                        const response = await axios.post(`${API_URL}/interview/start`, formData, {
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'multipart/form-data'
                                                            }
                                                        });

                                                        setApplicationId(response.data.application_id);
                                                        setHasResume(true);

                                                        setTimeout(() => {
                                                            setMessages(prev => [...prev, {
                                                                id: Date.now() + 1,
                                                                sender: 'ai',
                                                                text: response.data.reply
                                                            }]);
                                                        }, 500);
                                                        fetchMyApplications();
                                                    } catch (error) {
                                                        console.error(error);
                                                        alert(`Failed to start with profile resume: ${error.response?.data?.detail || error.message}`);
                                                    }
                                                }}
                                                className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium hover:bg-indigo-200 transition"
                                            >
                                                Use Profile Resume
                                            </button>
                                        )}

                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Type your answer..."
                                            className="flex-1 bg-gray-100 text-gray-900 border-0 rounded-xl py-3 px-5 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim()}
                                            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )
                    }
                </div >
            </main >
        </div >
    );
};

export default CandidateDashboard;
