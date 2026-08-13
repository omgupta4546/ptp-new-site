const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scannedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
