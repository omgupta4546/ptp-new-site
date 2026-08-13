import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAdminStore from '../store/adminStore';

const AttendanceControl = () => {
  const adminToken = useAdminStore((s) => s.adminToken);
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    expertName: '',
    topic: '',
  });
  const [eventId, setEventId] = useState('');
  const [volunteerLink, setVolunteerLink] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startAttendance = async () => {
    try {
      const res = await axios.post(
        '/api/attendance/start',
        form,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const { event } = res.data;
      setEventId(event._id);
      const linkRes = await axios.get(
        `/api/attendance/${event._id}/link`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setVolunteerLink(linkRes.data.link);
      toast.success('Attendance started and link generated');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to start attendance');
    }
  };

  const closeAttendance = async () => {
    try {
      await axios.post(
        `/api/attendance/${eventId}/close`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success('Attendance closed');
      setVolunteerLink('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to close attendance');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4">QR Code Attendance</h2>
      <div className="space-y-4">
        <input
          name="name"
          placeholder="Event Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="time"
          type="time"
          value={form.time}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="expertName"
          placeholder="Expert Name"
          value={form.expertName}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          name="topic"
          placeholder="Event Topic"
          value={form.topic}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={startAttendance}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Start Attendance
        </button>
        {volunteerLink && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-medium">Volunteer Link (share with volunteers):</p>
            <a href={volunteerLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
              {volunteerLink}
            </a>
            <button
              onClick={closeAttendance}
              className="mt-2 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              Close Attendance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceControl;
