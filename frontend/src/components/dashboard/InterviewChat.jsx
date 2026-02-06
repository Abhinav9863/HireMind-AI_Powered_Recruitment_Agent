import React, { useState, useEffect } from 'react';
import { Send, Paperclip, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

const InterviewChat = ({
    messages,
    messagesEndRef,
    input,
    setInput,
    handleSendMessage,
    fileInputRef,
    handleFileChange,
    triggerFileUpload,
    hasResume,
    profile,
    handleUseProfileResume,
    applicationId
}) => {
    // Proctoring State
    const [violationCount, setViolationCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [isTerminated, setIsTerminated] = useState(false);
    const lastViolationTime = React.useRef(0);

    useEffect(() => {
        // Only active if we have an active interview (applicationId exists)
        if (!applicationId) return;

        const handleVisibilityChange = async () => {
            if (document.hidden) {
                handleViolation();
            }
        };

        const handleBlur = async () => {
            handleViolation();
        };

        const handleViolation = async () => {
            // DEBOUNCE: Ignore if within 2 seconds of last violation
            const now = Date.now();
            if (now - lastViolationTime.current < 2000) {
                return;
            }
            lastViolationTime.current = now;

            // Increment local count (optimistic, backend is source of truth)
            setViolationCount(prev => prev + 1);
            setShowWarning(true);

            // Log to Backend
            try {
                const token = localStorage.getItem('token');
                const response = await axios.post(`${API_URL}/interview/log_violation`, {
                    application_id: applicationId
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Update from backend response
                if (response.data.count) {
                    setViolationCount(response.data.count);
                }

                // Handle Termination
                if (response.data.terminated) {
                    setIsTerminated(true);
                    setShowWarning(false); // Hide warning, show termination
                }

            } catch (error) {
                console.error("Failed to log violation", error);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [applicationId]);

    // Handle Redirect after Termination
    useEffect(() => {
        if (isTerminated) {
            const timer = setTimeout(() => {
                window.location.reload(); // Force reload to dashboard/reset state
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isTerminated]);

    return (
        <div className="h-full flex flex-col relative">

            {/* TERMINATED MODAL */}
            {isTerminated && (
                <div className="absolute inset-0 bg-red-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center border-t-8 border-red-600">
                        <div className="mx-auto bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-red-600 animate-pulse">
                            <AlertTriangle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">INTERVIEW TERMINATED</h3>
                        <p className="text-gray-600 mb-8 text-base">
                            You have exceeded the maximum limit of navigation violations.
                            Your application has been automatically <strong>rejected</strong> due to suspicion of malpractice.
                        </p>
                        <div className="bg-gray-100 rounded-lg p-4 mb-4">
                            <p className="text-sm font-medium text-gray-500">Redirecting to Dashboard in 5s...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Proctoring Warning Modal */}
            {showWarning && !isTerminated && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center border-b-4 border-orange-500">
                        <div className="mx-auto bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-orange-600">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Warning: Navigation Detected</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            Tab switching is not allowed.
                            <br />
                            <span className="font-bold text-red-600 block mt-2">
                                Strike {violationCount} of 3
                            </span>
                        </p>
                        <button
                            onClick={() => setShowWarning(false)}
                            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg active:scale-95"
                        >
                            I Understand & Resume
                        </button>
                    </div>
                </div>
            )}

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
                            onClick={handleUseProfileResume}
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
    );
};

export default InterviewChat;
