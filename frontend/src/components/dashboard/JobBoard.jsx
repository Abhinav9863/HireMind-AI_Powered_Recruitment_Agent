import React, { useState } from 'react';
import { Search, Briefcase, Filter } from 'lucide-react';
import JobCard from './JobCard';

const JobBoard = ({ jobs, searchQuery, myApplications, handleApply }) => {
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'applied' | 'unapplied'
    // Coerce IDs to strings to avoid mismatched types (e.g. string vs number)
    const appliedJobIds = new Set(myApplications.map(app => String(app.job_id)));

    const filteredJobs = jobs.filter(job => {
        // 1. Search Filter
        const matchesSearch =
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.job_type.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Status Filter
        const isApplied = appliedJobIds.has(String(job.id));
        let matchesStatus = true;

        if (filterStatus === 'applied') {
            matchesStatus = isApplied;
        } else if (filterStatus === 'unapplied') {
            matchesStatus = !isApplied;
        }

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        const isAppliedA = appliedJobIds.has(String(a.id));
        const isAppliedB = appliedJobIds.has(String(b.id));
        if (isAppliedA === isAppliedB) return 0;
        return isAppliedA ? 1 : -1; // Unapplied (false) comes first
    });

    if (filteredJobs.length === 0 && searchQuery) {
        return (
            <div className="h-full overflow-y-auto p-8 text-center text-gray-500">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-gray-700">No Jobs Found</h3>
                <p>Try adjusting your search terms</p>
            </div>
        );
    }

    if (filteredJobs.length === 0 && filterStatus !== 'all') {
        return (
            <div className="h-full overflow-y-auto p-8 text-center text-gray-500">
                <Filter size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-gray-700">No Jobs Match Filter</h3>
                <p>Try changing your filter to "All Jobs"</p>
            </div>
        );
    }

    if (filteredJobs.length === 0) {
        return (
            <div className="h-full overflow-y-auto p-8 text-center text-gray-500">
                <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-gray-700">No Openings Found</h3>
                <p>Check back later for new opportunities.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 font-sans">Available Opportunities</h2>

                {/* Filter Dropdown */}
                <div className="relative">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-sm cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                    >
                        <option value="all">All Jobs</option>
                        <option value="applied">Applied</option>
                        <option value="unapplied">Not Applied</option>
                    </select>
                    <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(job => (
                    <JobCard
                        key={job.id}
                        job={job}
                        myApplications={myApplications}
                        handleApply={handleApply}
                    />
                ))}
            </div>
        </div>
    );
};

export default JobBoard;
