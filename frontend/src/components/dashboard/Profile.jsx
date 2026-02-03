import React from 'react';
import { User, UploadCloud, FileText } from 'lucide-react';
import { API_URL } from '../../config';

const Profile = ({
    profile,
    previewUrl,
    setPreviewUrl,
    photoLoading,
    saveLoading,
    formData,
    setFormData,
    handleProfileUpdate,
    photoFile,
    setPhotoFile,
    resumeFile,
    setResumeFile,
    resumePreviewUrl,
    setResumePreviewUrl
}) => {
    if (!profile) return null;

    return (
        <div className="h-full overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>
            <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

                {/* Photo Section */}
                <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border-2 border-white shadow-sm">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : profile.profile_picture ? (
                                <img
                                    src={profile.profile_picture.startsWith('http') ? profile.profile_picture : `${API_URL}/${profile.profile_picture}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                                />
                            ) : (
                                <User size={40} />
                            )}
                        </div>
                        <button
                            onClick={() => document.getElementById('pfp-input').click()}
                            disabled={photoLoading}
                            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition"
                            title="Change Photo"
                        >
                            {photoLoading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <UploadCloud size={16} />}
                        </button>
                        <input
                            id="pfp-input"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    setPhotoFile(e.target.files[0]);
                                    setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                }
                            }}
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{profile.full_name || 'No Name Set'}</h3>
                        <p className="text-gray-500">{profile.email}</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input type="text"
                                value={formData.phone_number}
                                placeholder="+1 234 567 8900"
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">University / College</label>
                        <input type="text"
                            value={formData.university_or_company}
                            onChange={(e) => setFormData({ ...formData, university_or_company: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition" />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={saveLoading}
                            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {saveLoading ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                    </div>
                </form>

                <div className="border-t border-gray-100 my-8 pt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Resume Management</h3>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                <FileText size={24} />
                            </div>
                            <div className="flex-1">
                                {resumeFile ? (
                                    <div>
                                        <p className="font-bold text-indigo-700 text-sm">Selected for Upload:</p>
                                        <p className="text-gray-900 font-medium truncate">{resumeFile.name}</p>
                                        {resumePreviewUrl && (
                                            <a href={resumePreviewUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 underline mt-1 block">
                                                Preview New Resume
                                            </a>
                                        )}
                                    </div>
                                ) : profile.resume_path ? (
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Current Resume</p>
                                        <a href={`${API_URL}/${profile.resume_path}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-1 block">
                                            View Uploaded Resume
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-sm">No resume uploaded yet</p>
                                )}
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('resume-upload').click()}
                                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
                                >
                                    {resumeFile ? 'Change Selection' : 'Upload Resume'}
                                </button>
                                <input
                                    id="resume-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            const file = e.target.files[0];
                                            setResumeFile(file);
                                            setResumePreviewUrl(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        {resumeFile && (
                            <div className="bg-indigo-50 text-indigo-800 text-xs px-3 py-2 rounded-md border border-indigo-100 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                Click "Save Profile Changes" below to upload this resume.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
