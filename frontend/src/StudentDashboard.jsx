import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Send, Paperclip, FileText, User, Briefcase, ChevronRight, UploadCloud, CheckCircle } from 'lucide-react';

const MOCK_JOBS = [
    {
        id: 1,
        title: "Frontend Developer",
        company: "TechCorp Inc.",
        location: "Remote",
        salary: "$80k - $120k",
        type: "Full-time",
        logo: "TC",
        color: "bg-blue-100 text-blue-600"
    },
    {
        id: 2,
        title: "Backend Engineer",
        company: "DataSystems",
        location: "New York, NY",
        salary: "$90k - $140k",
        type: "Hybrid",
        logo: "DS",
        color: "bg-green-100 text-green-600"
    },
    {
        id: 3,
        title: "Product Designer",
        company: "Creative Studio",
        location: "San Francisco, CA",
        salary: "$100k - $150k",
        type: "On-site",
        logo: "CS",
        color: "bg-purple-100 text-purple-600"
    },
    {
        id: 4,
        title: "Data Scientist",
        company: "AI Solutions",
        location: "Austin, TX",
        salary: "$110k - $160k",
        type: "Remote",
        logo: "AI",
        color: "bg-red-100 text-red-600"
    }
];

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'chat'
    const [selectedJob, setSelectedJob] = useState(null);
    const [hasResume, setHasResume] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const fileInputRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    const handleApply = (job) => {
        setSelectedJob(job);
        setActiveTab('chat');
        // Reset chat for new application
        setMessages([
            {
                id: 1,
                sender: 'ai',
                text: `Hello! I see you're applying for the ${job.title} position at ${job.company}. To proceed, please upload your resume so I can verify your fit.`
            }
        ]);
        setHasResume(false);
    };

    const triggerFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const fileName = e.target.files[0].name;
            // Simulate upload processing
            const userMsg = { id: Date.now(), sender: 'user', text: `Uploaded: ${fileName}` };
            setMessages(prev => [...prev, userMsg]);

            setTimeout(() => {
                setHasResume(true);
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: `I've received ${fileName}. Analysis complete! Your ATS score matches this job description well. Shall we start the interview?`
                }]);
            }, 1000);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // User Message
        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        try {
            const response = await axios.post('http://localhost:8000/interview/chat', {
                message: input,
                context: selectedJob ? selectedJob.title : "General Interview"
            });

            const aiMsg = { id: Date.now() + 1, sender: 'ai', text: response.data.reply };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg = { id: Date.now() + 1, sender: 'ai', text: "Sorry, I'm having trouble connecting to the interview server." };
            setMessages(prev => [...prev, errorMsg]);
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
                    </nav>

                    <div className="mb-8">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Profile</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Student Name</p>
                                <p className="text-xs text-gray-500">Computer Science</p>
                            </div>
                        </div>
                    </div>

                    {/* Resume Stats - Only Visible when Active in Chat & Has Resume */}
                    {activeTab === 'chat' && hasResume && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Application Stats</h3>
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-indigo-900 font-medium text-sm">ATS Match</span>
                                    <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">88%</span>
                                </div>
                                <div className="w-full bg-indigo-200 rounded-full h-1.5">
                                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '88%' }}></div>
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
                        {activeTab === 'jobs' ? 'Available Opportunities' : selectedJob ? `${selectedJob.title} - ${selectedJob.company}` : 'Interview Chat'}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {MOCK_JOBS.map(job => (
                                    <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${job.color}`}>
                                                {job.logo}
                                            </div>
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                                                {job.type}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">{job.title}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{job.company}</p>

                                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="text-sm font-medium text-gray-500">{job.salary}</div>
                                            <button
                                                onClick={() => handleApply(job)}
                                                className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                                            >
                                                Apply <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CHAT VIEW */}
                    {activeTab === 'chat' && (
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
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
