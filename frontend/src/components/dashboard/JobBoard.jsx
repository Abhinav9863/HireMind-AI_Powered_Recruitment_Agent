import React from 'react';
import { Search, Briefcase } from 'lucide-react';
import JobCard from './JobCard';

const JobBoard = ({ jobs, searchQuery, myApplications, handleApply }) => {
    const appliedJobIds = new Set(myApplications.map(app => app.job_id));

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.job_type.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        const isAppliedA = appliedJobIds.has(a.id);
        const isAppliedB = appliedJobIds.has(b.id);
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-sans">Available Opportunities</h2>
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
