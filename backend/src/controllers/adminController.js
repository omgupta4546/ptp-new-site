const mongoose    = require('mongoose');
const jwt         = require('jsonwebtoken');
const Discrepancy = require('../models/Discrepancy');

const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * POST /api/admin/login
 * Verifies admin credentials and issues admin JWT token
 */
const adminLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const inputIdentifier = (username || email || '').trim().toLowerCase();
    const inputPassword   = password || '';

    const validUser = (process.env.ADMIN_USERNAME || 'admin@rtu.ac.in').toLowerCase();
    const validPass = process.env.ADMIN_PASSWORD || 'Admin@RTU2026';

    // Allow login with either admin@rtu.ac.in, admin, or any configured username
    const isUserValid =
      inputIdentifier === validUser ||
      inputIdentifier === 'admin' ||
      inputIdentifier === 'admin@rtu.ac.in';

    const isPasswordValid = inputPassword === validPass;

    if (!isUserValid || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator ID or password. Access denied.',
      });
    }

    const token = jwt.sign(
      {
        id: 'admin_root',
        email: validUser,
        role: 'admin',
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      admin: {
        id: 'admin_root',
        username: validUser,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('adminLogin error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

/**
 * GET /api/admin/discrepancies
 * Returns all submitted student discrepancy reports.
 */
const getAllDiscrepancies = async (req, res) => {
  try {
    let reports = [];

    if (isDBConnected()) {
      reports = await Discrepancy.find().sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    console.error('getAllDiscrepancies error:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching discrepancy reports.' });
  }
};

/**
 * PATCH /api/admin/discrepancies/:id
 * Updates report status (pending, under_review, resolved, rejected) and adminNote.
 */
const updateDiscrepancyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['pending', 'under_review', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    let updated = null;
    if (isDBConnected()) {
      updated = await Discrepancy.findByIdAndUpdate(
        id,
        {
          status,
          adminNote: adminNote || '',
          resolvedAt: ['resolved', 'rejected'].includes(status) ? new Date() : null,
        },
        { new: true }
      );
    }

    if (!updated && isDBConnected()) {
      return res.status(404).json({ success: false, message: 'Discrepancy report not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Report marked as ${status}.`,
      data: updated,
    });
  } catch (err) {
    console.error('updateDiscrepancyStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
};

module.exports = { adminLogin, getAllDiscrepancies, updateDiscrepancyStatus };
