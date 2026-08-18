const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { sendResetPasswordEmail } = require('../services/mailer');

const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * Get or initialize default Admin in DB
 */
const getOrInitializeAdmin = async () => {
  const defaultEmail = (process.env.ADMIN_USERNAME || 'placements@rtu.ac.in').toLowerCase();
  const defaultPass = process.env.ADMIN_PASSWORD || 'Admin@RTU2026';

  if (!isDBConnected()) {
    return { email: defaultEmail, passwordPlain: defaultPass };
  }

  let admin = await Admin.findOne({ email: defaultEmail });
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPass, salt);
    admin = await Admin.create({
      email: defaultEmail,
      hashedPassword
    });
  }
  return admin;
};

/**
 * POST /api/admin/login
 * Verifies admin credentials and issues admin JWT token
 */
const adminLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const inputIdentifier = (username || email || '').trim().toLowerCase();
    const inputPassword   = password || '';

    const admin = await getOrInitializeAdmin();
    
    let isUserValid = false;
    let isPasswordValid = false;

    if (isDBConnected() && admin.hashedPassword) {
      isUserValid = inputIdentifier === admin.email || inputIdentifier === 'admin';
      isPasswordValid = await bcrypt.compare(inputPassword, admin.hashedPassword);
    } else {
      isUserValid = inputIdentifier === admin.email || inputIdentifier === 'admin';
      isPasswordValid = inputPassword === admin.passwordPlain;
    }

    if (!isUserValid || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator ID or password. Access denied.',
      });
    }

    const token = jwt.sign(
      {
        id: 'admin_root',
        email: admin.email,
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
        username: admin.email,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('adminLogin error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

/**
 * POST /api/admin/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const admin = await getOrInitializeAdmin();
    const adminEmail = admin.email;

    if (email !== adminEmail) {
      return res.status(404).json({
        success: false,
        message: 'No administrator account found with this email.',
      });
    }

    const resetToken = jwt.sign(
      { email: adminEmail, role: 'admin', purpose: 'reset-password' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '15m' }
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}&role=admin`;

    console.log(`\n🔑 [RESET LINK] link for admin ${adminEmail}: >>> ${resetLink} <<<\n`);

    try {
      await sendResetPasswordEmail(adminEmail, resetLink, 'Placement Officer / Admin');
    } catch (mailErr) {
      console.warn(`⚠️ Email delivery notice: ${mailErr.message}. Link: ${resetLink}`);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to the administrator email.',
    });
  } catch (err) {
    console.error('admin forgotPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to request administrator password reset.' });
  }
};

/**
 * POST /api/admin/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Reset token missing.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    if ((decoded.purpose !== 'reset-password' && decoded.purpose !== 'set-password') || (decoded.role && decoded.role !== 'admin')) {
      return res.status(401).json({ success: false, message: 'Invalid token purpose or role.' });
    }

    const email = decoded.email;
    const password = (req.body.password || '').trim();

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (isDBConnected()) {
      const updatedAdmin = await Admin.findOneAndUpdate(
        { email },
        { hashedPassword },
        { new: true }
      );
      if (!updatedAdmin) {
        return res.status(404).json({ success: false, message: 'Administrator account not found.' });
      }
    } else {
      console.log('📝 Offline admin password reset to:', password);
    }

    res.status(200).json({
      success: true,
      message: 'Administrator password reset successful. You can now log in.',
    });
  } catch (err) {
    console.error('admin resetPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to reset administrator password.' });
  }
};

module.exports = { adminLogin, forgotPassword, resetPassword };
