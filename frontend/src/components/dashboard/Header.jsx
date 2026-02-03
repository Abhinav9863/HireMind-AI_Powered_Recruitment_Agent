import React from 'react';
import { Search, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { API_URL } from '../../config';

const Header = ({ searchQuery, setSearchQuery, setActiveTab, activeTab, profile }) => {
    return (
        <header className="h-20 bg-white flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
            {/* Search Bar - Only show on Job Board */}
            <div className="flex-1 max-w-2xl relative">
                {activeTab === 'jobs' ? (
                    <>
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search jobs by title, company, location, or type..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400"
                        />
                    </>
                ) : (
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-gray-50"
                    >
                        <ArrowLeft size={20} />
                        Back to Job Board
                    </button>
                )}
            </div>

            <div className="flex items-center gap-6 ml-6">
                {/* Profile Dropdown Trigger */}
                <div
                    className="flex items-center gap-3 pl-6 border-l border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setActiveTab('profile')}
                >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200">
                        {profile?.profile_picture ? (
                            <img
                                src={profile.profile_picture.startsWith('http') ? profile.profile_picture : `${API_URL}/${profile.profile_picture}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                                <User size={20} />
                            </div>
                        )}
                    </div>
                    <div className="text-sm">
                        <p className="font-bold text-gray-900 leading-none mb-1">{profile?.full_name || 'Guest User'}</p>
                        <div className="flex items-center text-gray-400 text-xs">
                            Profile <ChevronRight size={12} className="ml-1" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
