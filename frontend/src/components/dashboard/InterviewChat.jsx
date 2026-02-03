import React from 'react';
import { Send, Paperclip, CheckCircle } from 'lucide-react';

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
    handleUseProfileResume
}) => {
    return (
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
