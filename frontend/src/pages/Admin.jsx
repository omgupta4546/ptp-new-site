import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { LogOut, CalendarCheck, Copy, XCircle } from 'lucide-react';
import useAdminStore from '../store/adminStore';

export default function Admin() {
  const navigate = useNavigate();
  const adminToken = useAdminStore((s) => s.adminToken);
  const adminUser = useAdminStore((s) => s.adminUser);
  const logoutAdmin = useAdminStore((s) => s.logoutAdmin);

  // ── Attendance Control State ──
  const [attForm, setAttForm] = useState({ name: '', date: '', time: '', expertName: '', topic: '' });
  const [attEventId, setAttEventId] = useState('');
  const [attVolunteerLink, setAttVolunteerLink] = useState('');
  const [attLoading, setAttLoading] = useState(false);
  const [attOpen, setAttOpen] = useState(false);

  // Protected check
  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login', { replace: true });
    }
  }, [adminToken, navigate]);

  useEffect(() => {
    if (adminToken) {
      // Restore active attendance session (if any)
      axios.get('/api/attendance/current', {
        headers: { Authorization: `Bearer ${adminToken}` },
      }).then((res) => {
        if (res.data.event) {
          const ev = res.data.event;
          setAttEventId(ev._id);
          setAttForm({ name: ev.name, date: ev.date, time: ev.time, expertName: ev.expertName, topic: ev.topic });
          setAttVolunteerLink(res.data.link);
          setAttOpen(true);
        }
      }).catch(() => { });
    }
  }, [adminToken]);

  // ── Attendance Functions ──
  const handleAttChange = (e) => setAttForm({ ...attForm, [e.target.name]: e.target.value });

  const handleStartAttendance = async () => {
    if (!attForm.name || !attForm.date || !attForm.time || !attForm.expertName || !attForm.topic) {
      return toast.error('Please fill all event fields');
    }
    try {
      setAttLoading(true);
      const res = await axios.post('/api/attendance/start', attForm, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const { event } = res.data;
      setAttEventId(event._id);
      const linkRes = await axios.get(`/api/attendance/${event._id}/link`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setAttVolunteerLink(linkRes.data.link);
      setAttOpen(true);
      toast.success('Attendance started! Share the volunteer link.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to start attendance');
    } finally {
      setAttLoading(false);
    }
  };

  const handleCloseAttendance = async () => {
    try {
      setAttLoading(true);
      await axios.post(`/api/attendance/${attEventId}/close`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      toast.success('Attendance closed successfully');
      setAttVolunteerLink('');
      setAttEventId('');
      setAttOpen(false);
      setAttForm({ name: '', date: '', time: '', expertName: '', topic: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to close attendance');
    } finally {
      setAttLoading(false);
    }
  };

  const copyVolunteerLink = () => {
    navigator.clipboard.writeText(attVolunteerLink);
    toast.success('Volunteer link copied to clipboard!');
  };

  // Handle Logout
  const handleLogout = () => {
    logoutAdmin();
    toast.success('Logged out of Admin Portal');
    navigate('/admin/login', { replace: true });
  };

  if (!adminToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-rtu-gradient text-white shadow-rtu-lg border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-rtu-gold text-2xl font-bold shadow-inner">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight font-display">RTU Placement Cell</h1>
                <span className="bg-rtu-gold text-rtu-navy text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Logged in as: <span className="font-semibold text-white">{adminUser?.username || 'Administrator'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
            >
              Student Portal →
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white text-xs font-semibold transition shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-6">
        
        {/* Attendance Control Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              <span>QR Code Attendance Control</span>
              {attOpen && (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  ● LIVE
                </span>
              )}
            </h2>
          </div>

          <div className="p-6">
            {!attOpen ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 mb-1">Event Name</label>
                    <input name="name" placeholder="e.g., TCS Recruitment Drive" value={attForm.name} onChange={handleAttChange}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 mb-1">Event Date</label>
                    <input name="date" type="date" value={attForm.date} onChange={handleAttChange}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 mb-1">Start Time</label>
                    <input name="time" type="time" value={attForm.time} onChange={handleAttChange}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 mb-1">Speaker / Expert Name</label>
                    <input name="expertName" placeholder="e.g., Dr. Ajay Sharma" value={attForm.expertName} onChange={handleAttChange}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  </div>
                  <div className="flex flex-col sm:col-span-2 lg:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 mb-1">Event Topic</label>
                    <input name="topic" placeholder="e.g., Pre-placement Talk & Mock Interviews" value={attForm.topic} onChange={handleAttChange}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  </div>
                </div>
                <button onClick={handleStartAttendance} disabled={attLoading}
                  className="inline-flex items-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition shadow-sm disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0">
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  {attLoading ? 'Starting Session...' : 'Start Attendance Session'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-emerald-900 mb-1">✅ Attendance is LIVE for: {attForm.name}</p>
                  <p className="text-xs text-emerald-700">Share the volunteer link below so volunteers can scan student QR codes.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <input type="text" readOnly value={attVolunteerLink}
                    className="flex-1 bg-transparent text-sm text-blue-700 font-mono outline-none truncate" />
                  <button onClick={copyVolunteerLink}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition">
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
                  </button>
                </div>
                <button onClick={handleCloseAttendance} disabled={attLoading}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition shadow-sm disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0">
                  <XCircle className="w-4 h-4 mr-2" />
                  {attLoading ? 'Closing Session...' : 'Close Attendance Session'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} Rajasthan Technical University, Kota — Training & Placement Cell</p>
          <p>Designed & Developed with ❤️ by <span className="font-semibold text-rtu-blue">Om Gupta</span></p>
        </div>
      </footer>
    </div>
  );
}
