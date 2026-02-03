import React from 'react';
import { Search, MapPin, DollarSign, ChevronRight, Briefcase, X } from 'lucide-react';

const HrJobBoard = ({
    activeTab,
    myJobs,
    searchQuery,
    setSearchQuery,
    handleViewApplicants,
    selectedJob,
    handleBackToJobs,
    applications,
    handleUpdateStatus, // We might need to pass this down or handle it in a parent/sub-component
    fetchApplicationDetail, // Or this
    renderApplicationDetail // This is a function that returns JSX
}) => {

    /* 
       Note: The logic for viewing applicants is currently nested here. 
        ideally, we separate "My Jobs List" from "Applicant List".
       For now, we keep them together to match the current flow but styled better.
    */

    // Helper for My Jobs List
    const renderJobsList = () => {
        const filteredJobs = myJobs.filter(job =>
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredJobs.length === 0 && searchQuery) {
            return (
                <div className="col-span-full text-center py-20 text-gray-500">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-gray-700">No Jobs Found</h3>
                    <p>Try adjusting your search terms</p>
                </div>
            );
        }

        if (filteredJobs.length === 0) {
            return (
                <div className="col-span-full text-center py-20 text-gray-500">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-gray-700">No Jobs Posted Yet</h3>
                    <p>Start by creating a new position.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                    <div key={job.id}
                        onClick={() => handleViewApplicants(job)}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-700 transition-colors">{job.title}</h3>
                                <p className="text-sm text-gray-500 font-medium">{job.company}</p>
                            </div>
                            <div className="flex gap-2">
                                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${job.work_location === 'Remote' ? 'bg-green-50 text-green-700 border-green-100' : job.work_location === 'Hybrid' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                                    {job.work_location || 'In-Office'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 relative z-10">
                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <MapPin size={14} className="text-indigo-400" /> {job.location}
                            </div>
                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <DollarSign size={14} className="text-green-500" /> {job.salary_range}
                            </div>
                        </div>

                        {/* Application Stats Badges */}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 relative z-10">
                            <div className="flex items-center gap-2">
                                {(job.unviewed_count > 0 || job.total_applications > 0) ? (
                                    <>
                                        {job.unviewed_count > 0 && (
                                            <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                                {job.unviewed_count} New
                                            </span>
                                        )}
                                        <span className="text-gray-400 text-xs font-medium">
                                            {job.total_applications} Applicants
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-gray-400 text-xs italic">No applicants yet</span>
                                )}
                            </div>

                            <div className="flex items-center text-sm font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                                Manage <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Helper for Applicants List
    const renderApplicantsList = () => {
        return (
            <div>
                {/* Header for Applicant List is handled by HrHeader now */}

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Candidate</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-2 text-center">ATS Score</div>
                        <div className="col-span-2 text-center">Experience</div>
                        <div className="col-span-2 text-right">Action</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-50">
                        {applications.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <p>No applications received yet.</p>
                            </div>
                        ) : (
                            applications.map((app) => (
                                <div
                                    key={app.id}
                                    className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-indigo-50/30 transition-colors cursor-pointer group ${!app.viewed ? 'bg-purple-50/30' : ''}`}
                                    onClick={() => fetchApplicationDetail(app.id)}
                                >
                                    <div className="col-span-3">
                                        <h4 className={`font-bold text-gray-900 ${!app.viewed ? 'text-indigo-900' : ''}`}>{app.candidate_name}</h4>
                                        <p className="text-xs text-gray-500 truncate">{app.candidate_email}</p>
                                    </div>
                                    <div className="col-span-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${app.status === 'Accepted' || app.status === 'Interviewing' ? 'bg-green-100 text-green-700 border-green-200' :
                                                app.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold ${app.ats_score >= 80 ? 'bg-green-100 text-green-700' :
                                                app.ats_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {app.ats_score}%
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center text-sm text-gray-600">
                                        {app.experience_years > 0 ? `${app.experience_years} Yrs` : 'Fresher'}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-indigo-600 hover:text-indigo-800 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Details
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (selectedJob) {
        return renderApplicantsList();
    }

    return (
        <div>
            {/* Mobile Search - if needed, but we have it in Header for desktop */}

            {renderJobsList()}
        </div>
    );

};

export default HrJobBoard;
