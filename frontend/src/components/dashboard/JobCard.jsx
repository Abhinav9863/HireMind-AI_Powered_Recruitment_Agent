import React, { useState } from 'react';
import { MapPin, DollarSign, Briefcase, CheckCircle, ChevronRight, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';
import { API_URL } from '../../config';

const JobCard = ({ job, myApplications, handleApply }) => {
    const [showDescription, setShowDescription] = useState(false);

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col group relative overflow-hidden h-full">
            {/* Top Gradient Line decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            {/* Standard Card Content */}
            <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-bold text-lg text-indigo-600 shadow-sm">
                        {job.company.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">
                            {job.job_type}
                        </span>
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${job.work_location === 'Remote' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                            {job.work_location || 'In-Office'}
                        </span>
                        {job.experience_required !== undefined && (
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${job.experience_required === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {job.experience_required === 0 ? 'Freshers Welcome' : `${job.experience_required}+ Years Required`}
                            </span>
                        )}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">{job.title}</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">{job.company}</p>

                <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <MapPin size={16} className="text-indigo-300" />
                        <span className="font-medium text-gray-700">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <DollarSign size={16} className="text-indigo-300" />
                        <span className="font-medium text-gray-700">{job.salary_range}</span>
                    </div>
                </div>

                {/* View JD Toggle Button */}
                <button
                    onClick={() => setShowDescription(true)}
                    className="flex items-center gap-2 text-indigo-600 text-xs font-bold mb-4 hover:text-indigo-800 transition-colors w-fit"
                >
                    <ChevronDown size={14} />
                    View JD
                </button>

                <div className="mt-auto pt-4 border-t border-gray-50">
                    {myApplications.some(app => app.job_title === job.title && app.company_name === job.company) ? (
                        <button
                            disabled
                            className="w-full bg-emerald-50 text-emerald-600 text-sm font-bold px-6 py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} /> Applied
                        </button>
                    ) : (
                        <button
                            onClick={() => handleApply(job)}
                            className="w-full bg-indigo-950 text-white text-sm font-bold px-6 py-4 rounded-xl hover:bg-indigo-900 hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            Apply <ChevronRight size={16} />
                        </button>
                    )}

                    {job.policy_path && (
                        <a
                            href={`${API_URL}/${job.policy_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-center items-center gap-1 text-indigo-400 hover:text-indigo-600 text-xs mt-3 font-medium transition-colors"
                        >
                            <FileText size={12} /> View Company Policy
                        </a>
                    )}
                </div>
            </div>

            {/* FULL CARD OVERLAY for Description */}
            {showDescription && (
                <div className="absolute inset-0 bg-white z-20 p-6 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                        <h4 className="text-sm uppercase tracking-wide text-gray-900 font-bold">Job Description</h4>
                        <button
                            onClick={() => setShowDescription(false)}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                            {job.description || "No description available provided by the recruiter."}
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        {/* Replicated Apply Button for convenience inside the overlay */}
                        {myApplications.some(app => app.job_title === job.title && app.company_name === job.company) ? (
                            <button
                                disabled
                                className="w-full bg-emerald-50 text-emerald-600 text-sm font-bold px-6 py-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} /> Applied
                            </button>
                        ) : (
                            <button
                                onClick={() => handleApply(job)}
                                className="w-full bg-indigo-950 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-indigo-900 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                Apply Now <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobCard;
