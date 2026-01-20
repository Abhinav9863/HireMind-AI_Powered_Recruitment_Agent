import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Upload, FileText, TrendingUp, Users, Search } from 'lucide-react';

const HrDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/hr');
    };

    // Dummy Candidate Data
    const students = [
        { id: 1, name: "Alice Johnson", score: 92, strongField: "Backend System Design", status: "Recommended" },
        { id: 2, name: "Bob Smith", score: 78, strongField: "React Frontend", status: "Review" },
        { id: 3, name: "Charlie Davis", score: 65, strongField: "Data Analysis", status: "Rejected" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-poppins">
            {/* Navbar */}
            <nav className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2 text-xl font-bold">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/50">HM</div>
                    <span className="tracking-tight">HireMind <span className="font-normal text-slate-400">Admin</span></span>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex gap-2">
                    <LogOut size={18} /> Logout
                </button>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-6">

                <h1 className="text-2xl font-bold text-slate-800 mb-8">Recruitment Overview</h1>

                {/* Upload Policy Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-indigo-600" size={24} /> Company Policy Knowledge Base
                            </h2>
                            <p className="text-slate-500 text-sm mt-2 max-w-xl">
                                Upload your company's HR policy, code of conduct, or technical guidelines.
                                The AI Agent uses this to answer student questions accurately during the interview.
                            </p>
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                            <Upload size={18} /> Upload PDF
                        </button>
                    </div>
                </div>

                {/* Leaderboard Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-emerald-500" size={24} /> Candidate Leaderboard
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" placeholder="Search candidates..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                <th className="p-4 border-b border-slate-200">Rank</th>
                                <th className="p-4 border-b border-slate-200">Candidate Name</th>
                                <th className="p-4 border-b border-slate-200">Strongest Field</th>
                                <th className="p-4 border-b border-slate-200">AI Score</th>
                                <th className="p-4 border-b border-slate-200">Status</th>
                                <th className="p-4 border-b border-slate-200">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((student, index) => (
                                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 font-bold text-slate-400">#{index + 1}</td>
                                    <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                            {student.name.charAt(0)}
                                        </div>
                                        {student.name}
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">{student.strongField}</td>
                                    <td className="p-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${student.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                                student.score >= 70 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {student.score}/100
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </main>
        </div>
    );
};

export default HrDashboard;
