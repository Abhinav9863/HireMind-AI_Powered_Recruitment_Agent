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
    renderApplicationDetail, // This is a function that returns JSX
    handleUpdateJob,
    handleDeleteJob
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingJob, setEditingJob] = React.useState(null);
    const [editFormData, setEditFormData] = React.useState({
        title: '', company: '', description: '', location: '', salary_range: '', job_type: 'Full-time', work_location: 'In-Office', experience_required: 0
    });


    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [jobToDelete, setJobToDelete] = React.useState(null);

    const handleEditClick = (e, job) => {
        e.stopPropagation();
        setEditingJob(job);
        setEditFormData({
            title: job.title,
            company: job.company,
            description: job.description,
            location: job.location,
            salary_range: job.salary_range,
            job_type: job.job_type,
            work_location: job.work_location,
            experience_required: job.experience_required
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (e, job) => {
        e.stopPropagation();
        setJobToDelete(job);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (jobToDelete) {
            handleDeleteJob(jobToDelete.id);
            setIsDeleteModalOpen(false);
            setJobToDelete(null);
        }
    };

    const submitEdit = (e) => {
        e.preventDefault();
        handleUpdateJob(editingJob.id, editFormData);
        setIsEditModalOpen(false);
    };

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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

                            <div className="flex items-center gap-2 relative z-20">
                                <button
                                    onClick={(e) => handleEditClick(e, job)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                    title="Edit Job"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </button>
                                <button
                                    onClick={(e) => handleDeleteClick(e, job)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Delete Job"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                                <div className="ml-2 flex items-center text-sm font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                                    View <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
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
                    {/* Table Header - Hidden on Mobile */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                                    className={`grid grid-cols-2 md:grid-cols-12 gap-4 p-4 items-center hover:bg-indigo-50/30 transition-colors cursor-pointer group ${!app.viewed ? 'bg-purple-50/30' : ''}`}
                                    onClick={() => fetchApplicationDetail(app.id)}
                                >
                                    {/* Candidate Name & Email */}
                                    <div className="col-span-2 md:col-span-3">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold text-gray-900 ${!app.viewed ? 'text-indigo-900' : ''}`}>{app.candidate_name}</h4>
                                            {!app.viewed && (
                                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse shadow-sm">NEW</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{app.candidate_email}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 md:col-span-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${app.status === 'Accepted' || app.status === 'Interviewing' ? 'bg-green-100 text-green-700 border-green-200' :
                                            app.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    {/* ATS Score */}
                                    <div className="col-span-1 md:col-span-2 flex md:justify-center">
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold ${app.ats_score >= 80 ? 'bg-green-100 text-green-700' :
                                            app.ats_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {app.ats_score}%
                                        </div>
                                    </div>

                                    {/* Experience */}
                                    <div className="col-span-1 md:col-span-2 md:text-center text-sm text-gray-600">
                                        <span className="md:hidden font-bold text-gray-400 text-xs mr-2">Exp:</span>
                                        {app.experience_years > 0 ? `${app.experience_years} Yrs` : 'Fresher'}
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-1 md:col-span-2 text-right">
                                        <span className="text-indigo-600 hover:text-indigo-800 text-xs font-bold md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                                            View <ChevronRight size={14} />
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

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => { e.stopPropagation(); }}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">Edit Job Posting</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Job Title</label>
                                    <input
                                        type="text"
                                        value={editFormData.title}
                                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={editFormData.company}
                                        onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={editFormData.location}
                                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Salary Range</label>
                                    <input
                                        type="text"
                                        value={editFormData.salary_range}
                                        onChange={(e) => setEditFormData({ ...editFormData, salary_range: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Job Type</label>
                                    <select
                                        value={editFormData.job_type}
                                        onChange={(e) => setEditFormData({ ...editFormData, job_type: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                                    >
                                        <option>Full-time</option>
                                        <option>Part-time</option>
                                        <option>Contract</option>
                                        <option>Internship</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Work Location</label>
                                    <select
                                        value={editFormData.work_location}
                                        onChange={(e) => setEditFormData({ ...editFormData, work_location: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                                    >
                                        <option>In-Office</option>
                                        <option>Remote</option>
                                        <option>Hybrid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Experience</label>
                                    <select
                                        value={editFormData.experience_required}
                                        onChange={(e) => setEditFormData({ ...editFormData, experience_required: parseInt(e.target.value) })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                                    >
                                        {[...Array(11).keys()].map(num => (
                                            <option key={num} value={num}>{num === 0 ? 'Fresher' : `${num} Years`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none min-h-[150px]"
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {
                isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => { e.stopPropagation(); }}>
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Job?</h3>
                                <p className="text-gray-500 text-sm">
                                    Are you sure you want to delete <span className="font-bold text-gray-800">"{jobToDelete?.title}"</span>? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );

};

export default HrJobBoard;
