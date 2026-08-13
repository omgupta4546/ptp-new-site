const Event = require('../models/event');
const Attendance = require('../models/attendance');
const User = require('../models/User');
const { generateToken } = require('../utils/tokenGenerator');
const { appendAttendanceRow } = require('../utils/googleSheet');

// Get the currently open event (if any) – used to restore admin UI state after refresh
exports.getCurrentEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ status: 'open' }).sort({ createdAt: -1 });
    if (!event) {
      return res.json({ success: true, event: null });
    }
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const link = `${baseUrl}/attendance/${event._id}/${event.token}`;
    res.json({ success: true, event, link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Start attendance for an event (create or update event status to 'open' and generate token)
exports.startAttendance = async (req, res) => {
  try {
    const { name, date, time, expertName, topic } = req.body;
    // Create new event
    const event = await Event.create({
      name,
      date,
      time,
      expertName,
      topic,
      status: 'open',
      token: generateToken(),
      createdBy: req.admin.id,
    });
    res.json({ success: true, event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Close attendance: mark status closed and invalidate token
exports.closeAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    event.status = 'closed';
    event.token = undefined;
    await event.save();
    res.json({ success: true, message: 'Attendance closed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get volunteer link (shareable URL)
exports.getVolunteerLink = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Event not open' });
    }
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const link = `${baseUrl}/attendance/${eventId}/${event.token}`;
    res.json({ success: true, link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Volunteer scans QR code (student identifier sent from front‑end)
exports.scanQRCode = async (req, res) => {
  try {
    const { eventId, token } = req.params;
    const { studentIdentifier } = req.body; // could be enrollment number or roll number

    const event = await Event.findOne({ _id: eventId, token, status: 'open' });
    if (!event) return res.status(403).json({ success: false, message: 'Invalid or closed event' });

    const student = await User.findOne({
      $or: [
        { rollNumber: studentIdentifier },
        { rtuEnrollmentNo: studentIdentifier },
      ],
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Prevent duplicate scans for same event
    const existing = await Attendance.findOne({ event: eventId, student: student._id });
    if (existing) return res.json({ success: true, message: 'Already scanned' });

    const attendance = await Attendance.create({ event: eventId, student: student._id });

    // Append row to Google Sheet
    // await appendAttendanceRow(event, student, attendance.scannedAt);

    res.json({ success: true, message: 'Attendance recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get list of scanned students for a given event (used by volunteer UI for realtime view)
exports.getScannedList = async (req, res) => {
  try {
    const { eventId } = req.params;
    const scans = await Attendance.find({ event: eventId })
      .populate('student', 'rollNumber studentName rtuEnrollmentNo branch currentYearSem phoneNumber')
      .sort({ scannedAt: -1 });
    res.json({ success: true, scans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
