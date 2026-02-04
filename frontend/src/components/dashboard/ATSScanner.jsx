import React from 'react';
import { UploadCloud } from 'lucide-react';

const ATSScanner = ({
    atsJobTitle,
    setAtsJobTitle,
    atsJd,
    setAtsJd,
    atsFileInputRef,
    handleAtsAnalyze,
    atsLoading,
    atsResult,
    pdfPreviewUrl,
    atsHistory
}) => {
    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto space-y-12">
                {/* Analyzer Section */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Free ATS Resume Checker</h2>
                    <p className="text-gray-500 mb-8">Upload your resume and a job description to see how well you match.</p>

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={atsJobTitle}
                                onChange={(e) => setAtsJobTitle(e.target.value)}
                                placeholder="e.g. Full Stack Developer, Data Scientist..."
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Description (Optional)</label>
                            <textarea
                                value={atsJd}
                                onChange={(e) => setAtsJd(e.target.value)}
                                placeholder="Paste the job description here for better accuracy..."
                                className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm"
                            />
                        </div>

                        <div className="flex justify-center">
                            <input
                                type="file"
                                ref={atsFileInputRef}
                                onChange={handleAtsAnalyze}
                                className="hidden"
                                accept=".pdf"
                            />
                            <button
                                onClick={() => atsFileInputRef.current?.click()}
                                disabled={atsLoading}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {atsLoading ? (
                                    <>Processing...</>
                                ) : (
                                    <><UploadCloud size={20} /> Upload Resume & Analyze</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Logic for Result Display */}
                    {atsResult && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Score Card */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">ATS Compatibility Score</h3>
                                    <p className="text-sm text-gray-500">Based on keyword match and formatting</p>
                                </div>
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#E0E7FF"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={atsResult.score > 70 ? "#16A34A" : atsResult.score > 40 ? "#CA8A04" : "#DC2626"}
                                            strokeWidth="3"
                                            strokeDasharray={`${atsResult.score}, 100`}
                                        />
                                    </svg>
                                    <span className="absolute text-2xl font-bold text-gray-800">{atsResult.score}%</span>
                                </div>
                            </div>

                            {/* Split Screen Concept: Resume Preview + Detailed Feedback */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
                                {/* Left: Resume Preview */}
                                <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                                    {pdfPreviewUrl ? (
                                        <iframe
                                            src={pdfPreviewUrl}
                                            className="w-full h-full"
                                            title="Resume Preview"
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            <p>No PDF uploaded</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Feedback */}
                                <div className="overflow-y-auto pr-2 space-y-6">
                                    {/* Missing Critical */}
                                    {atsResult.missing_critical_keywords && atsResult.missing_critical_keywords.length > 0 && (
                                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                                            <h3 className="text-red-800 font-bold mb-3 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                Missing Critical Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {atsResult.missing_critical_keywords.map((kw, i) => (
                                                    <span key={i} className="bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-medium border border-red-100 shadow-sm">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Detailed Feedback */}
                                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                                        <h3 className="text-indigo-900 font-bold mb-2">AI Critique</h3>
                                        <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-line">
                                            {atsResult.feedback}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="border-t border-gray-100 pt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Past Analysis History</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Job Title</th>
                                        <th className="px-6 py-3">Score</th>
                                        <th className="px-6 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atsHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-4 text-center">No history found.</td>
                                        </tr>
                                    ) : (
                                        atsHistory.map((item) => (
                                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.job_title}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.score > 70 ? 'bg-green-100 text-green-700' : item.score > 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                        {item.score}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="md:hidden">
                            {atsHistory.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">No history found.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {atsHistory.map((item) => (
                                        <div key={item.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{item.job_title}</h4>
                                                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.score > 70 ? 'bg-green-100 text-green-700' : item.score > 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.score}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ATSScanner;
