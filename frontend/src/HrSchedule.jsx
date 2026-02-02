import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Plus, Trash2, Video } from 'lucide-react';
import { API_URL } from './config';

const HrSchedule = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSlots();
    }, []);

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
            // Combine date and time to ISO format
            const startISO = new Date(`${date}T${startTime}`).toISOString();
            const endISO = new Date(`${date}T${endTime}`).toISOString();

            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/schedule/slots`, {
                start_time: startISO,
                end_time: endISO
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh list
            fetchSlots();
            // Reset form (keep date for convenience)
            setStartTime('');
            setEndTime('');

        } catch (error) {
            console.error("Error adding slot:", error);
            alert("Failed to add slot");
        } finally {
            setSubmitting(false);
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
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`w-2 h-2 rounded-full ${isBooked ? 'bg-purple-500' : 'bg-green-500'}`} />
                                                            <span className={`text-xs font-bold ${isBooked ? 'text-purple-700' : 'text-green-700'} uppercase`}>
                                                                {slot.status}
                                                            </span>
                                                        </div>
                                                        {isBooked && (
                                                            <Video size={16} className="text-purple-400" />
                                                        )}
                                                    </div>

                                                    <div className="text-lg font-bold text-gray-800 flex items-center gap-1">
                                                        {start} <span className="text-gray-400 text-sm font-normal">-</span> {end}
                                                    </div>

                                                    {isBooked ? (
                                                        <div className="mt-2 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded inline-block">
                                                            Assigned to Candidate #{slot.candidate_id}
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
