import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Plus, Trash2, Video, Edit2, X } from 'lucide-react';
import { API_URL } from './config';

const HrSchedule = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit modal state
    const [editingSlot, setEditingSlot] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [updating, setUpdating] = useState(false);

    // Notification state
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchSlots();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchSlots = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/schedule/slots`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSlots(response.data);
        } catch (error) {
            console.error("Error fetching slots:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const startISO = new Date(`${date}T${startTime}`).toISOString();
            const endISO = new Date(`${date}T${endTime}`).toISOString();

            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/schedule/slots`, {
                start_time: startISO,
                end_time: endISO
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchSlots();
            setStartTime('');
            setEndTime('');
            showNotification('Slot added successfully!');
        } catch (error) {
            console.error("Error adding slot:", error);
            showNotification('Failed to add slot', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (slot) => {
        setEditingSlot(slot);
        const slotDate = new Date(slot.start_time);
        setEditDate(slotDate.toISOString().split('T')[0]);
        setEditStartTime(slotDate.toTimeString().slice(0, 5));
        const endDate = new Date(slot.end_time);
        setEditEndTime(endDate.toTimeString().slice(0, 5));
    };

    const handleUpdateSlot = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const startISO = new Date(`${editDate}T${editStartTime}`).toISOString();
            const endISO = new Date(`${editDate}T${editEndTime}`).toISOString();

            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/schedule/slots/${editingSlot.id}`, {
                start_time: startISO,
                end_time: endISO
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchSlots();
            setEditingSlot(null);

            if (editingSlot.status === 'BOOKED') {
                showNotification('Slot updated and candidate notified via email!', 'success');
            } else {
                showNotification('Slot updated successfully!');
            }
        } catch (error) {
            console.error("Error updating slot:", error);
            showNotification(error.response?.data?.detail || 'Failed to update slot', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteSlot = async (slot) => {
        const isBooked = slot.status === 'BOOKED';
        const confirmMessage = isBooked
            ? `This slot is booked with ${slot.candidate_name}. The candidate will be notified via email. Are you sure you want to delete it?`
            : 'Are you sure you want to delete this slot?';

        if (!window.confirm(confirmMessage)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_URL}/schedule/slots/${slot.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchSlots();

            if (response.data.notified) {
                showNotification('Slot deleted and candidate notified via email!', 'success');
            } else {
                showNotification('Slot deleted successfully!');
            }
        } catch (error) {
            console.error("Error deleting slot:", error);
            showNotification(error.response?.data?.detail || 'Failed to delete slot', 'error');
        }
    };

    // Group slots by date
    const groupedSlots = slots.reduce((acc, slot) => {
        const dateKey = new Date(slot.start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
    }, {});

    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm h-full overflow-y-auto">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg animate-fade-in-up ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                    } text-white font-medium`}>
                    {notification.message}
                </div>
            )}

            {/* Edit Modal */}
            {editingSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditingSlot(null)}>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Edit Slot</h3>
                            <button onClick={() => setEditingSlot(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {editingSlot.status === 'BOOKED' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-amber-800">
                                    ⚠️ This slot is booked with <strong>{editingSlot.candidate_name}</strong>.
                                    They will be notified via email about the reschedule with an apology message.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleUpdateSlot} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                                        value={editStartTime}
                                        onChange={(e) => setEditStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                                        value={editEndTime}
                                        onChange={(e) => setEditEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {updating ? <Clock className="animate-spin" size={16} /> : <Edit2 size={16} />}
                                    {updating ? 'Updating...' : 'Update Slot'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingSlot(null)}
                                    className="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="text-purple-600" />
                Interview Availability
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Add Slot Form */}
                <div className="md:col-span-1 bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit">
                    <h3 className="font-semibold text-lg mb-4">Add Availability</h3>
                    <form onSubmit={handleAddSlot} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-2"
                        >
                            {submitting ? <Clock className="animate-spin" size={16} /> : <Plus size={16} />}
                            Add Slot
                        </button>
                    </form>
                </div>

                {/* Right: Slots List */}
                <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-4">Your Available Slots</h3>

                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading slots...</div>
                    ) : slots.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No availability set. Add slots to start scheduling interviews.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedSlots).map(([dateKey, dateSlots]) => (
                                <div key={dateKey}>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{dateKey}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {dateSlots.map(slot => {
                                            const start = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const end = new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const isBooked = slot.status === "BOOKED";

                                            return (
                                                <div
                                                    key={slot.id}
                                                    className={`p-4 rounded-xl border ${isBooked ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100 hover:border-gray-200'} transition-all`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${isBooked ? 'bg-purple-500' : 'bg-green-500'}`} />
                                                            <span className={`text-xs font-bold ${isBooked ? 'text-purple-700' : 'text-green-700'} uppercase`}>
                                                                {slot.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleEditClick(slot)}
                                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                title="Edit slot"
                                                            >
                                                                <Edit2 size={14} className="text-gray-600" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSlot(slot)}
                                                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                                                title="Delete slot"
                                                            >
                                                                <Trash2 size={14} className="text-red-500" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="text-lg font-bold text-gray-800 flex items-center gap-1">
                                                        {start} <span className="text-gray-400 text-sm font-normal">-</span> {end}
                                                    </div>

                                                    {isBooked ? (
                                                        <div className="mt-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                            <div className="text-sm font-semibold text-gray-900 mb-1">
                                                                {slot.candidate_name || `Candidate #${slot.candidate_id}`}
                                                            </div>
                                                            {slot.candidate_email && (
                                                                <div className="text-xs text-gray-500 mb-2 truncate">
                                                                    {slot.candidate_email}
                                                                </div>
                                                            )}
                                                            <a
                                                                href={slot.meet_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-xs font-medium text-purple-700 hover:text-purple-900 hover:underline mt-2"
                                                            >
                                                                <Video size={14} />
                                                                Join Interview
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                                                            Ready for Allocation
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
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

export default HrSchedule;
