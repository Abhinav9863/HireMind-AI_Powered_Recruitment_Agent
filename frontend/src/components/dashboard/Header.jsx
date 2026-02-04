import React from 'react';
import { Search, User, ChevronRight, ArrowLeft, Menu } from 'lucide-react';
import { API_URL } from '../../config';

const Header = ({ activeTab, user, toggleSidebar, setActiveTab }) => {
    return (
        <header className="h-20 bg-white flex items-center justify-between px-8 shrink-0 relative z-20 shadow-sm">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-gray-600 hover:text-indigo-600 md:hidden rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Menu size={24} />
                </button>

                {activeTab === 'jobs' ? (
                    <div className="relative w-96 hidden md:block">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for jobs, skills, or companies..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400"
                        />
                    </div>
                ) : (
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                        <ArrowLeft size={20} /> <span className="hidden md:inline">Back to Job Board</span>
                    </button>
                )}
            </div>

            <div className="flex items-center gap-6">
                <div
                    className="flex items-center gap-3 pl-6 border-l border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setActiveTab && setActiveTab('profile')}
                >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 flex items-center justify-center text-indigo-600">
                        {user?.profile_picture ? (
                            <img
                                src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}/${user.profile_picture}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150' }}
                            />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                    <div className="text-sm hidden md:block">
                        <p className="font-bold text-gray-900 leading-none mb-1">{user?.full_name || 'Candidate'}</p>
                        <div className="flex items-center text-gray-400 text-xs">
                            Candidate
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
