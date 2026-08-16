import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { LogOut, RefreshCw, Search, GraduationCap, ShieldAlert, CalendarCheck, Copy, XCircle } from 'lucide-react';
import useAdminStore from '../store/adminStore';
import { adminAPI } from '../services/api';

const FIELD_LABELS = {
  CGPA: 'Current CGPA',
  SGPA_Sem1: 'SGPA — Semester 1',
  SGPA_Sem2: 'SGPA — Semester 2',
  SGPA_Sem3: 'SGPA — Semester 3',
  SGPA_Sem4: 'SGPA — Semester 4',
  SGPA_Sem5: 'SGPA — Semester 5',
  SGPA_Sem6: 'SGPA — Semester 6',
  Active_Backlogs_Count: 'Active Backlogs Count',
  Backlog_Details: 'Backlog Details',
  Branch: 'Branch',
  Phone_Number: 'Phone Number',
  RTU_Enrollment_No: 'RTU Enrollment No.',
  Other: 'Other / General Issue',
};

const formatField = (field) => {
  if (!field) return 'Academic Record';
  return FIELD_LABELS[field] || field.replace(/_/g, ' ');
};

export default function Admin() {
  const navigate = useNavigate();
  const adminToken = useAdminStore((s) => s.adminToken);
  const adminUser = useAdminStore((s) => s.adminUser);
  const logoutAdmin = useAdminStore((s) => s.logoutAdmin);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

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

  // Fetch all reports
  const fetchReports = async (showToast = false) => {
    if (!adminToken) return;
    try {
      setLoading(true);
      const res = await adminAPI.getDiscrepancies();
      if (res.data && res.data.data) {
        setReports(res.data.data);
        if (showToast) toast.success(`Loaded ${res.data.data.length} reports successfully`);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Admin session expired or invalid. Please log in again.');
        logoutAdmin();
        navigate('/admin/login');
      } else {
        toast.error('Failed to load reports from database');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchReports();
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

  // Update status and/or admin note
  const handleUpdateStatus = async (id, newStatus, note = '') => {
    try {
      setUpdatingId(id);
      const res = await adminAPI.updateDiscrepancyStatus(id, newStatus, note);
      if (res.data && res.data.success) {
        toast.success(`Report marked as ${newStatus.replace('_', ' ').toUpperCase()}`);
        // update locally
        setReports((prev) =>
          prev.map((r) =>
            r._id === id
              ? { ...r, status: newStatus, adminNote: note, updatedAt: new Date().toISOString() }
              : r
          )
        );
        if (activeReportModal && activeReportModal._id === id) {
          setActiveReportModal((prev) => ({ ...prev, status: newStatus, adminNote: note }));
        }
      }
    } catch (err) {
      console.error('Update status error:', err);
      toast.error(err.response?.data?.message || 'Failed to update report status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter & Search logic
  const filteredReports = reports.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const studentMessage = r.additionalMessage || r.reason || '';
    const fieldName = r.field || r.fieldName || '';
    const expVal = r.expectedValue || r.requestedValue || '';

    const matchesSearch =
      !searchQuery ||
      r.rollNumber?.toLowerCase().includes(q) ||
      r.studentName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      fieldName.toLowerCase().includes(q) ||
      expVal.toLowerCase().includes(q) ||
      studentMessage.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // KPI counts
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const reviewCount = reports.filter((r) => r.status === 'under_review').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const rejectedCount = reports.filter((r) => r.status === 'rejected').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            ⏳ Pending
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            🔍 Under Review
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✅ Resolved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            ❌ Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
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
            <button
              onClick={() => fetchReports(true)}
              disabled={loading}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Reports
            </button>

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div
            onClick={() => setFilterStatus('all')}
            className={`cursor-pointer rounded-2xl p-4 transition shadow-sm border ${filterStatus === 'all'
                ? 'bg-white border-navy-800 ring-2 ring-navy-800'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</p>
            <p className="text-2xl font-black text-navy-900 mt-1">{totalCount}</p>
            <div className="text-[11px] text-slate-400 mt-0.5">All student requests</div>
          </div>

          <div
            onClick={() => setFilterStatus('pending')}
            className={`cursor-pointer rounded-2xl p-4 transition shadow-sm border ${filterStatus === 'pending'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500'
                : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
          >
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">⏳ Pending</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
            <div className="text-[11px] text-amber-600 mt-0.5">Needs action</div>
          </div>

          <div
            onClick={() => setFilterStatus('under_review')}
            className={`cursor-pointer rounded-2xl p-4 transition shadow-sm border ${filterStatus === 'under_review'
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500'
                : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
          >
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">🔍 Under Review</p>
            <p className="text-2xl font-black text-blue-900 mt-1">{reviewCount}</p>
            <div className="text-[11px] text-blue-600 mt-0.5">Being verified</div>
          </div>

          <div
            onClick={() => setFilterStatus('resolved')}
            className={`cursor-pointer rounded-2xl p-4 transition shadow-sm border ${filterStatus === 'resolved'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500'
                : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
          >
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">✅ Resolved</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{resolvedCount}</p>
            <div className="text-[11px] text-emerald-600 mt-0.5">Updated in Sheet</div>
          </div>

          <div
            onClick={() => setFilterStatus('rejected')}
            className={`cursor-pointer rounded-2xl p-4 transition shadow-sm border ${filterStatus === 'rejected'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500'
                : 'bg-white border-slate-200 hover:border-rose-300'
              }`}
          >
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">❌ Rejected</p>
            <p className="text-2xl font-black text-rose-900 mt-1">{rejectedCount}</p>
            <div className="text-[11px] text-rose-600 mt-0.5">Invalid claims</div>
          </div>
        </div>

        {/* ── Attendance Control Section ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              <span>QR Code Attendance</span>
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
                  <input name="name" placeholder="Event Name" value={attForm.name} onChange={handleAttChange}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  <input name="date" type="date" value={attForm.date} onChange={handleAttChange}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  <input name="time" type="time" value={attForm.time} onChange={handleAttChange}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  <input name="expertName" placeholder="Expert / Speaker Name" value={attForm.expertName} onChange={handleAttChange}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition" />
                  <input name="topic" placeholder="Event Topic" value={attForm.topic} onChange={handleAttChange}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-sm outline-none transition sm:col-span-2 lg:col-span-2" />
                </div>
                <button onClick={handleStartAttendance} disabled={attLoading}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition shadow-sm disabled:opacity-50">
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  {attLoading ? 'Starting...' : 'Start Attendance'}
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
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition">
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                  </button>
                </div>
                <button onClick={handleCloseAttendance} disabled={attLoading}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition shadow-sm disabled:opacity-50">
                  <XCircle className="w-4 h-4 mr-2" />
                  {attLoading ? 'Closing...' : 'Close Attendance'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Roll No, Name, Email, Field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field input-icon-left text-xs py-2.5"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['all', 'pending', 'under_review', 'resolved', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${filterStatus === st
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Discrepancies Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>📋 Student Discrepancy Reports</span>
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {filteredReports.length}
              </span>
            </h2>
            <div className="text-xs text-slate-500">
              Database: <span className="font-mono font-medium text-navy-800">rtu_placement.discrepancies</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-navy-900 border-t-transparent"></div>
              <p className="mt-3 text-sm text-slate-500 font-medium">Loading discrepancy reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-base font-bold text-slate-800">No Discrepancy Reports Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search terms or filter.'
                  : 'No student reports have been submitted yet. When a student reports an issue from their dashboard, it will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Student Info</th>
                    <th className="py-3.5 px-4">Field in Error</th>
                    <th className="py-3.5 px-4">Current → Expected</th>
                    <th className="py-3.5 px-4">Student Explanation</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => {
                    const rawField = report.field || report.fieldName;
                    const fieldTitle = formatField(rawField);
                    const currentVal = report.currentValue || '(none)';
                    const expVal = report.expectedValue || report.requestedValue || '(none)';
                    const studentMsg = report.additionalMessage || report.reason || '';

                    return (
                      <tr key={report._id} className="hover:bg-slate-50/80 transition">
                        {/* Student Info */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">
                            {report.studentName || 'Student'}
                          </div>
                          <div className="font-mono text-xs text-navy-800 font-semibold mt-0.5">
                            {report.rollNumber || 'N/A'}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[180px]">
                            {report.email}
                          </div>
                        </td>

                        {/* Field */}
                        <td className="py-4 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-navy-50 text-navy-800 font-semibold text-xs border border-navy-100">
                            {fieldTitle}
                          </span>
                        </td>

                        {/* Values Comparison */}
                        <td className="py-4 px-4">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <span className="font-semibold text-slate-400">Current:</span>
                              <span className="line-through bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                                {currentVal}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-emerald-600">Expected:</span>
                              <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">
                                {expVal}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Reason / Explanation */}
                        <td className="py-4 px-4 max-w-xs">
                          {studentMsg ? (
                            <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                              "{studentMsg}"
                            </p>
                          ) : (
                            <span className="text-xs text-slate-400 italic">(No additional comment)</span>
                          )}
                          {report.adminNote && (
                            <div className="mt-1.5 text-[11px] text-navy-800 bg-amber-50/80 p-1.5 rounded border border-amber-200">
                              <span className="font-bold text-amber-900">Admin Note:</span> {report.adminNote}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {getStatusBadge(report.status)}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                            : 'Recent'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setActiveReportModal(report);
                              setAdminNoteInput(report.adminNote || '');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold transition shadow-sm hover:shadow"
                          >
                            Review / Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Review / Status Update Modal */}
      {activeReportModal && (() => {
        const rawField = activeReportModal.field || activeReportModal.fieldName;
        const fieldTitle = formatField(rawField);
        const currentVal = activeReportModal.currentValue || '(none)';
        const expVal = activeReportModal.expectedValue || activeReportModal.requestedValue || '(none)';
        const studentMsg = activeReportModal.additionalMessage || activeReportModal.reason || '';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Manage Discrepancy Report</h3>
                  <p className="text-xs text-slate-500">
                    Student: <span className="font-semibold text-slate-800">{activeReportModal.studentName || 'Student'}</span> ({activeReportModal.rollNumber || 'N/A'})
                  </p>
                </div>
                <button
                  onClick={() => setActiveReportModal(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Email:</span>
                    <p className="font-semibold text-slate-800">{activeReportModal.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Target Field:</span>
                    <p className="font-bold text-navy-900">{fieldTitle}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Current Value (Sheet):</span>
                    <p className="font-mono text-rose-700 font-bold">{currentVal}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Expected / Requested Value:</span>
                    <p className="font-mono text-emerald-700 font-bold">{expVal}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Student Explanation & Details
                  </label>
                  <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-800 font-medium leading-relaxed">
                    {studentMsg ? `"${studentMsg}"` : <span className="text-slate-400 italic">No additional explanation provided by student.</span>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Admin Resolution Remarks (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="e.g., Verified marks from revised university gazette. Updated row in Google Sheet."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-navy-600 focus:ring-2 focus:ring-navy-100 text-xs outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Update Report Status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      disabled={updatingId === activeReportModal._id}
                      onClick={() => handleUpdateStatus(activeReportModal._id, 'pending', adminNoteInput)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${activeReportModal.status === 'pending'
                          ? 'bg-amber-500 text-white border-amber-600 shadow'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                    >
                      ⏳ Pending
                    </button>

                    <button
                      disabled={updatingId === activeReportModal._id}
                      onClick={() => handleUpdateStatus(activeReportModal._id, 'under_review', adminNoteInput)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${activeReportModal.status === 'under_review'
                          ? 'bg-blue-600 text-white border-blue-700 shadow'
                          : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                        }`}
                    >
                      🔍 Under Review
                    </button>

                    <button
                      disabled={updatingId === activeReportModal._id}
                      onClick={() => handleUpdateStatus(activeReportModal._id, 'resolved', adminNoteInput)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${activeReportModal.status === 'resolved'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                    >
                      ✅ Resolved
                    </button>

                    <button
                      disabled={updatingId === activeReportModal._id}
                      onClick={() => handleUpdateStatus(activeReportModal._id, 'rejected', adminNoteInput)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${activeReportModal.status === 'rejected'
                          ? 'bg-rose-600 text-white border-rose-700 shadow'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ID: <span className="font-mono">{activeReportModal._id}</span>
                </span>
                <button
                  onClick={() => setActiveReportModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
