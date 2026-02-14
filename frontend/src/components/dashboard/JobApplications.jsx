import React from 'react';

const JobApplications = ({ myApplications }) => {
    return (
        <div className="h-full overflow-y-auto p-4 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Job Applications</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Company</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Applied On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myApplications.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center">You haven't applied to any jobs yet.</td>
                                </tr>
                            ) : (
                                myApplications.map((app) => (
                                    <tr key={app.id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-gray-900">{app.company_name}</td>
                                        <td className="px-6 py-4">{app.job_title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${app.status === 'Accepted' || app.status === 'Interviewing' ? 'bg-green-100 text-green-700' :
                                                app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(app.applied_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {myApplications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            You haven't applied to any jobs yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {myApplications.map((app) => (
                                <div key={app.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{app.job_title}</h3>
                                            <p className="text-sm text-gray-500">{app.company_name}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${app.status === 'Accepted' || app.status === 'Interviewing' ? 'bg-green-100 text-green-700' :
                                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Applied on {new Date(app.applied_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobApplications;
