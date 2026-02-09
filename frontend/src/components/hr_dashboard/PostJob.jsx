import React from 'react';
import { MapPin, DollarSign, X, CheckCircle, AlertCircle } from 'lucide-react';

const PostJob = ({
    formData,
    handleInputChange,
    handleFileChange,
    handlePostJob,
    loading,
    message,
    currentUser // ✅ NEW: Receive currentUser
}) => {
    // Local state for the "Use Profile Policy" checkbox


    // Wrapper for handlePostJob to inject the useProfilePolicy flag
    const onSubmit = (e) => {
        e.preventDefault();
        // We need to pass this flag up. Since handlePostJob likely takes the event object,
        // we might need to modify how handlePostJob works in the parent OR inject it into a FormData object there.
        // Assuming handlePostJob in parent handles the form submission logic:

        // We can create a synthetic event or just append data if the parent uses FormData constructor on e.target
        // But the parent creates FormData manually from state usually.
        // Let's look at parent logic... wait, I don't have parent logic visible right now.
        // Strategy: We'll attach it to the form data in the parent if possible, BUT
        // the cleanest way without changing parent signature too much is to handle it here if we could.

        // Actually, looking at the previous code, handlePostJob is likely an onSubmit handler.
        // Let's assume standard form submission. To support the new field without changing parent's intricate logic too much,
        // we can inject a hidden input if proper form submission is used, or just pass the state if the parent reads state.

        // BETTER APPROACH: The parent `handlePostJob` probably reads `formData` and `policyFile` state.
        // We need the parent to know about `useProfilePolicy`.
        // Since we can't easily change the parent's state from here without a setter,
        // we should probably have passed `setUseProfilePolicy` from parent OR
        // we treat this component as a UI wrapper and rely on a hidden input for native FormData!

        // Yes, if the parent uses `new FormData(e.target)`, a hidden input works perfectly.
        // If the parent constructs it manually from React state, we are in trouble.
        // Let's check parent `HrDashboard.jsx` logic again... 
        // Parent: `const formData = new FormData(); ... formData.append('policy_file', policyFile);`
        // Parent constructs it MANUALLY.

        // So we MUST pass the flag to the parent.
        // Let's change the pattern: The parent should separate the data gathering from the API call.
        // OR: We pass the flag as an argument to `handlePostJob`.

        // BUT `handlePostJob` is an event handler `(e) => ...`
        // We can wrap it:

        // Let's add a hidden input "use_profile_policy" -> Parent might not read it if it uses state variables.
        // Parent `handlePostJob` logic:
        /*
        const handlePostJob = async (e) => {
            e.preventDefault();
            // ...
            const data = new FormData();
            // appends form fields from state
            if (policyFile) data.append('policy_file', policyFile);
            // ...
        }
        */

        // It seems the parent uses STATE `formData` and `policyFile`.
        // It does NOT read from the event target (the form).
        // So a hidden input won't work unless we change parent to read from form, or we pass the state up.

        // Modifying the parent `HrDashboard` is safer.
        // I will revert this specific plan for a moment and update `HrDashboard` to hold this state?
        // NO, that makes `HrDashboard` even bigger.

        // let's use the `handleInputChange` generic handler!
        // `handleInputChange` does `setFormData({...formData, [e.target.name]: e.target.value})`
        // If we add `use_profile_policy` to `formData` in the parent, we can control it here!

        // Checks `HrDashboard.jsx` state init:
        /*
        const [formData, setFormData] = useState({
            title: '',
            // ...
        });
        */
        // It does NOT have `use_profile_policy`.

        // SOLUTION: I will use `handlePostJob` wrapper here to inject the value into the parent's function call? No, it expects an event.

        // WAIT. I can just add `use_profile_policy` to the parent's `formData` state!
        // In `HrDashboard`, I need to init it.
        // But here I can just call `handleInputChange` with a synthetic event!
    };

    // Simpler: Just render the inputs. 
    // I'll add a boolean `use_profile_policy` to `formData` in `HrDashboard` (implicitly works if I just change the state there).
    // Or simpler: I will assume I can update `formData` via `handleInputChange`.

    // Let's modify the component to render the checkbox and call `handleInputChange` when toggled.
    // AND I need to handle the File Input disable logic.

    const hasProfilePolicy = currentUser?.company_policy_path;

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
                            <option>In-Office</option>
                            <option>Remote</option>
                            <option>Hybrid</option>
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

                <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3 block">Company Policy Document</label>

                    {/* Option 1: Use Profile Policy */}
                    {/* Option 1: Use Profile Policy */}
                    <div className={`transition-all duration-300 ${!hasProfilePolicy ? 'opacity-80' : ''}`}>
                        <div className={`flex items-start gap-3 mb-4 p-4 rounded-xl border transition-all ${formData.use_profile_policy
                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                            : hasProfilePolicy
                                ? 'bg-white border-gray-200 hover:border-indigo-200'
                                : 'bg-gray-50 border-gray-200 border-dashed'
                            }`}>
                            <div className="mt-0.5">
                                <input
                                    type="checkbox"
                                    name="use_profile_policy"
                                    id="use_profile_policy"
                                    disabled={!hasProfilePolicy}
                                    checked={formData.use_profile_policy || false}
                                    onChange={(e) => handleInputChange({ target: { name: 'use_profile_policy', value: e.target.checked } })}
                                    className={`w-5 h-5 rounded focus:ring-indigo-500 border-gray-300 transition-colors ${!hasProfilePolicy ? 'cursor-not-allowed text-gray-400 bg-gray-100' : 'text-indigo-600 cursor-pointer'}`}
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="use_profile_policy" className={`text-sm font-medium block ${!hasProfilePolicy ? 'text-gray-500 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}`}>
                                    Use existing Company Policy from my Profile
                                </label>

                                {hasProfilePolicy ? (
                                    <span className="block text-xs text-indigo-600 mt-1 font-medium flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        <span>Active: <span className="underline">{currentUser.company_policy_path.split('/').pop()}</span></span>
                                    </span>
                                ) : (
                                    <div className="mt-1.5 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 inline-block">
                                        <AlertCircle size={14} />
                                        <span>
                                            No policy found in profile.
                                            <button
                                                type="button"
                                                onClick={() => document.querySelector('[data-tab="profile"]')?.click() || (window.location.hash = 'profile')}
                                                className="ml-1 font-bold underline hover:text-amber-800"
                                            >
                                                Go to Profile
                                            </button> to upload one.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Option 2: Upload New File */}
                    <div className={`transition-opacity ${formData.use_profile_policy ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            {formData.use_profile_policy ? 'Or upload a specific policy for this job (Disabled)' : 'Upload a specific policy (PDF)'}
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={formData.use_profile_policy}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                    </div>
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
