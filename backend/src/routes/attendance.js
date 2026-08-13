const express = require('express');
const router = express.Router();
const { startAttendance, closeAttendance, getVolunteerLink, scanQRCode, getScannedList, getCurrentEvent } = require('../controllers/attendanceController');
const { adminProtect } = require('../middleware/authMiddleware'); // super‑admin protection

// Get currently open event (for restoring state after page refresh)
router.get('/current', adminProtect, getCurrentEvent);

// Super‑admin creates and opens attendance for an event
router.post('/start', adminProtect, startAttendance);

// Super‑admin closes attendance for an event (eventId in URL)
router.post('/:eventId/close', adminProtect, closeAttendance);

// Super‑admin obtains shareable volunteer link
router.get('/:eventId/link', adminProtect, getVolunteerLink);

// Volunteer scans QR code – token validated via URL params
router.post('/:eventId/:token/scan', scanQRCode);

// Volunteer (or super‑admin) can view real‑time scanned list for an event
router.get('/:eventId/scanned', adminProtect, getScannedList);

module.exports = router;
