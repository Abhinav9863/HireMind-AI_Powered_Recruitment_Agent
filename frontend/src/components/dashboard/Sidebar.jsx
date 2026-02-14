import React from 'react';
import { LogOut, Briefcase, Send, FileText, CheckCircle, X, User, Settings } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, selectedJob, stats, handleLogout, isOpen, onClose }) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar Container - Fixed for mobile, Relative/Flex for desktop */}
            <aside className={`
                fixed md:relative z-50 h-screen md:h-full w-72 
                bg-gradient-to-b from-indigo-900 to-violet-900 text-white 
                transform transition-transform duration-300 ease-in-out shrink-0 font-sans flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 md:p-8 relative shrink-0">
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-indigo-200 hover:text-white md:hidden"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-4 md:mb-8">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg"></div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">HireMind AI</h1>
                            <p className="text-xs text-indigo-200">Candidate Portal</p>
                        </div>
                    </div>

                    <nav className="space-y-1 md:space-y-2">
                        <button
                            onClick={() => { setActiveTab('jobs'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'jobs' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Briefcase size={18} /> Job Board
                        </button>
                        <button
                            onClick={() => { if (selectedJob) { setActiveTab('chat'); onClose && onClose(); } }}
                            className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'chat' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'} ${!selectedJob ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
                        >
                            <Send size={18} /> Interview Chat
                        </button>
                        <button
                            onClick={() => { setActiveTab('ats'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'ats' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <FileText size={18} /> ATS Scanner
                        </button>
                        <button
                            onClick={() => { setActiveTab('applications'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'applications' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <CheckCircle size={18} /> My Applications
                        </button>
                        <button
                            onClick={() => { setActiveTab('profile'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'profile' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <User size={18} /> My Profile
                        </button>
                        <button
                            onClick={() => { setActiveTab('settings'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-2 md:p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'settings' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Settings size={18} /> Settings
                        </button>
                    </nav>
                </div>

                <div className="flex-1 min-h-0 px-4 md:px-8 py-2 md:py-4">
                    <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-6">Candidate<br />Dashboard</h3>
                    <div
                        onClick={() => { setActiveTab('profile'); onClose && onClose(); }}
                        className="bg-white/10 rounded-2xl p-3 md:p-5 backdrop-blur-sm border border-white/5 cursor-pointer hover:bg-white/20 transition-colors"
                    >
                        <div className="mb-3 md:mb-4">
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
                        <div className="space-y-2 md:space-y-3">
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

                <div className="shrink-0 p-4 md:p-8 border-t border-white/10">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-indigo-200 hover:text-white transition-colors text-sm font-medium">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
