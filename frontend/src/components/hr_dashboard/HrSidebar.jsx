import React from 'react';
import { LogOut, Briefcase, PlusCircle, Calendar, User, Building } from 'lucide-react';

const HrSidebar = ({ activeTab, setActiveTab, handleLogout }) => {
    return (
        <aside className="w-72 bg-gradient-to-b from-indigo-900 to-violet-900 text-white flex flex-col hidden md:flex shrink-0 transition-all font-sans h-full">
            <div className="p-8">
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
                        onClick={() => setActiveTab('my-jobs')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'my-jobs' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Briefcase size={18} /> My Jobs
                    </button>
                    <button
                        onClick={() => setActiveTab('post-job')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'post-job' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                    >
                        <PlusCircle size={18} /> Post a Job
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'schedule' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Calendar size={18} /> Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'profile' ? 'bg-white/10 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Building size={18} /> Company Profile
                    </button>
                </nav>
            </div>

            <div className="mt-auto p-8">
                <button onClick={handleLogout} className="flex items-center gap-3 text-indigo-200 hover:text-white transition-colors text-sm font-medium">
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default HrSidebar;
