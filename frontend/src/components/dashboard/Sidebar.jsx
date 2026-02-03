import React from 'react';
import { LogOut, Briefcase, Send, FileText, CheckCircle } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, selectedJob, stats, handleLogout }) => {
    return (
        <aside className="w-72 bg-gradient-to-b from-indigo-900 to-violet-900 text-white flex flex-col hidden md:flex shrink-0 transition-all font-sans h-full">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg"></div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">HireMind AI</h1>
                        <p className="text-xs text-indigo-200">Candidate Portal</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'jobs' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Briefcase size={18} /> Job Board
                    </button>
                    <button
                        onClick={() => { if (selectedJob) setActiveTab('chat'); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'chat' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'} ${!selectedJob ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
                    >
                        <Send size={18} /> Interview Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('ats')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'ats' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                    >
                        <FileText size={18} /> ATS Scanner
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'applications' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                    >
                        <CheckCircle size={18} /> My Applications
                    </button>
                </nav>
            </div>

            <div className="px-8 mb-8">
                <h3 className="text-xl font-bold mb-6">Candidate<br />Dashboard</h3>
                <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-indigo-200">Profile Completion</span>
                            <span className="font-bold">{stats.completion}%</span>
                        </div>
                        <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                                style={{ width: `${stats.completion}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-indigo-200">Applications Sent</span>
                            <span className="font-bold">{stats.totalApps}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-indigo-200">Interviews Scheduled</span>
                            <span className="font-bold">{stats.interviews}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto p-8">
                <button onClick={handleLogout} className="flex items-center gap-3 text-indigo-200 hover:text-white transition-colors text-sm font-medium">
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
