import React from 'react';
import { LogOut, Briefcase, PlusCircle, Calendar, User, Building, X, Settings } from 'lucide-react';

const HrSidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, onClose }) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed md:relative z-50 h-full w-72 
                bg-gradient-to-b from-indigo-900 to-violet-900 text-white 
                transform transition-transform duration-300 ease-in-out shrink-0 font-sans flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-8 relative">
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-indigo-200 hover:text-white md:hidden"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg"></div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">HireMind HR</h1>
                            <p className="text-xs text-indigo-200">Recruiter Panel</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => { setActiveTab('my-jobs'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'my-jobs' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Briefcase size={18} /> My Jobs
                        </button>
                        <button
                            onClick={() => { setActiveTab('post-job'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'post-job' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <PlusCircle size={18} /> Post a Job
                        </button>
                        <button
                            onClick={() => { setActiveTab('schedule'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'schedule' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Calendar size={18} /> Schedule
                        </button>
                        <button
                            onClick={() => { setActiveTab('profile'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'profile' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Building size={18} /> Company Profile
                        </button>
                        <button
                            onClick={() => { setActiveTab('settings'); onClose && onClose(); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'settings' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Settings size={18} /> Settings
                        </button>
                    </nav>
                </div>

                <div className="mt-auto p-8">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-indigo-200 hover:text-white transition-colors text-sm font-medium">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default HrSidebar;
