import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';

// Components
import Sidebar from './components/dashboard/Sidebar';
import Header from './components/dashboard/Header';
import JobBoard from './components/dashboard/JobBoard';
import JobApplications from './components/dashboard/JobApplications';
import ATSScanner from './components/dashboard/ATSScanner';
import Profile from './components/dashboard/Profile';
import InterviewChat from './components/dashboard/InterviewChat';

const CandidateDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'chat' | 'ats' | 'profile' | 'applications'
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

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

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
        university_or_company: '',
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
                university_or_company: response.data.university_or_company || '',
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
                setFormData({ full_name: '', university_or_company: '', bio: '', phone_number: '' });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            formData.append('experience_years', 0); // Default to 0 since we removed input

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

    const handleUseProfileResume = async () => {
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

    // Stats Calculation
    const startStats = () => {
        const interviews = myApplications.filter(app => app.status === 'Interviewing' || app.status === 'Scheduled').length;
        const totalApps = myApplications.length;

        let completion = 0;
        if (profile) {
            // Use formData for editable fields to allow immediate updates
            // Use local file state (photoFile, resumeFile) to count pending uploads
            const liveData = { ...profile, ...formData };

            const hasPhoto = photoFile || liveData.profile_picture;
            const hasResume = resumeFile || liveData.resume_path;

            const checks = [
                liveData.full_name,
                liveData.phone_number,
                liveData.university_or_company,
                liveData.bio,
                hasPhoto,
                hasResume
            ];

            const filled = checks.filter(val => val && (typeof val !== 'string' || val.trim() !== '')).length;
            completion = Math.round((filled / checks.length) * 100);
        }
        return { interviews, totalApps, completion };
    };
    const stats = startStats();

    return (
        <div className="flex h-screen bg-gray-50 font-poppins text-base">

            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                selectedJob={selectedJob}
                stats={stats}
                handleLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">

                {/* Header */}
                <Header
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setActiveTab={setActiveTab}
                    activeTab={activeTab}
                    profile={profile}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">

                    {/* JOB BOARD VIEW */}
                    {activeTab === 'jobs' && (
                        <JobBoard
                            jobs={jobs}
                            searchQuery={searchQuery}
                            myApplications={myApplications}
                            handleApply={handleApply}
                        />
                    )}

                    {/* ATS SCANNER VIEW */}
                    {activeTab === 'ats' && (
                        <ATSScanner
                            atsJobTitle={atsJobTitle}
                            setAtsJobTitle={setAtsJobTitle}
                            atsJd={atsJd}
                            setAtsJd={setAtsJd}
                            atsFileInputRef={atsFileInputRef}
                            handleAtsAnalyze={handleAtsAnalyze}
                            atsLoading={atsLoading}
                            atsResult={atsResult}
                            pdfPreviewUrl={pdfPreviewUrl}
                            atsHistory={atsHistory}
                        />
                    )}

                    {/* PROFILE VIEW */}
                    {activeTab === 'profile' && profile && (
                        <Profile
                            profile={profile}
                            previewUrl={previewUrl}
                            setPreviewUrl={setPreviewUrl}
                            photoLoading={photoLoading}
                            saveLoading={saveLoading}
                            formData={formData}
                            setFormData={setFormData}
                            handleProfileUpdate={handleProfileUpdate}
                            photoFile={photoFile}
                            setPhotoFile={setPhotoFile}
                            resumeFile={resumeFile}
                            setResumeFile={setResumeFile}
                            resumePreviewUrl={resumePreviewUrl}
                            setResumePreviewUrl={setResumePreviewUrl}
                        />
                    )}

                    {/* APPLICATIONS VIEW */}
                    {activeTab === 'applications' && (
                        <JobApplications myApplications={myApplications} />
                    )}

                    {/* CHAT VIEW */}
                    {activeTab === 'chat' && (
                        <InterviewChat
                            messages={messages}
                            messagesEndRef={messagesEndRef}
                            input={input}
                            setInput={setInput}
                            handleSendMessage={handleSendMessage}
                            fileInputRef={fileInputRef}
                            handleFileChange={handleFileChange}
                            triggerFileUpload={triggerFileUpload}
                            hasResume={hasResume}
                            profile={profile}
                            handleUseProfileResume={handleUseProfileResume}
                        />
                    )}
                </div >
            </main >

        </div >
    );
};

export default CandidateDashboard;
