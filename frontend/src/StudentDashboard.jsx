import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Send, Paperclip, FileText, User, Award, BookOpen } from 'lucide-react';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [hasResume, setHasResume] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: "Hello, I'd like to know a few things about you before we continue. Please upload your resume so I can analyze it and we can get started." }
    ]);
    const [input, setInput] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    const handleUploadResume = () => {
        // Mock Upload Delay
        setTimeout(() => {
            setHasResume(true);
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'ai',
                text: "I've received your resume. Analysis complete! Your ATS score is ready."
            }]);
        }, 1000);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // User Message
        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Mock AI Response (Placeholder until Backend connected)
        setTimeout(() => {
            const aiMsg = { id: Date.now() + 1, sender: 'ai', text: "I'm processing that... (AI Backend integration pending)" };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);
    };

    return (
        <div className="flex h-screen bg-gray-50 font-poppins">

            {/* Sidebar: Profile & Stats */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">HireMind AI</h1>
                    <p className="text-xs text-gray-400 mt-1">Smart Interview Agent</p>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
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

                    {hasResume && (
                        <div className="mb-8">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Resume Stats</h3>
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-indigo-900 font-medium text-sm">ATS Score</span>
                                    <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">85%</span>
                                </div>
                                <div className="w-full bg-indigo-200 rounded-full h-1.5">
                                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                        <button onClick={handleUploadResume} className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm mb-2">
                            <FileText size={18} /> Upload New Resume
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
                            <BookOpen size={18} /> View Company Policy
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col bg-white">
                {/* Chat Header */}
                <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-pulse">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">AI Interviewer</h2>
                            <p className="text-xs text-green-600 font-medium">Online</p>
                        </div>
                    </div>
                </header>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 scroll-smooth">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center gap-2">
                        <button type="button" className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your answer..."
                            className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 border-0 rounded-full py-3 px-5 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md transform active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-gray-400 mt-2">
                        AI can make mistakes. Please verify important information via Company Policy.
                    </p>
                </div>
            </main>

        </div>
    );
};

export default StudentDashboard;
