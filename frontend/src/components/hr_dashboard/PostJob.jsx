import React from 'react';
import { MapPin, DollarSign, X } from 'lucide-react';

const PostJob = ({
    formData,
    handleInputChange,
    handleFileChange,
    handlePostJob,
    loading,
    message
}) => {
    return (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900">Details</h3>
                <p className="text-gray-500 text-sm">Please provide accurate information about the position.</p>
            </div>

            <form onSubmit={handlePostJob} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400"
                            placeholder="e.g. Senior React Developer"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                        <select
                            name="job_type"
                            value={formData.job_type}
                            onChange={handleInputChange}
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        >
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Location</label>
                        <select
                            name="work_location"
                            value={formData.work_location}
                            onChange={handleInputChange}
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        >
                            <option>Remote</option>
                            <option>Hybrid</option>
                            <option>In-Office</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                        <select
                            name="experience_required"
                            value={formData.experience_required}
                            onChange={handleInputChange}
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        >
                            {[...Array(11).keys()].map(num => (
                                <option key={num} value={num}>{num === 0 ? 'Fresher (0 years)' : `${num} year${num > 1 ? 's' : ''}`}</option>
                            ))}
                            <option value="11">10+ years</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                required
                                className="w-full pl-10 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400"
                                placeholder="e.g. Remote, NY"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="salary_range"
                                value={formData.salary_range}
                                onChange={handleInputChange}
                                required
                                className="w-full pl-10 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400"
                                placeholder="e.g. $100k - $120k"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Policy (PDF) - Optional</label>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows="6"
                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400"
                        placeholder="Enter detailed job description..."
                    ></textarea>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {message}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white font-bold py-4 px-12 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 transform hover:-translate-y-0.5"
                    >
                        {loading ? 'Posting...' : 'Post Job'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostJob;
