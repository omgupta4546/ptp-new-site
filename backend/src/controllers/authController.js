const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

const User           = require('../models/User');
const OTP            = require('../models/OTP');
const { sendOTPEmail, sendResetPasswordEmail }        = require('../services/mailer');
const { emailExistsInSheet, findStudentByEmail } = require('../services/sheetsService');

// ── Persistent Dev Fallback Store (Saves to .dev_users.json so Nodemon restarts keep user accounts)
const devUsersFile = path.resolve(__dirname, '../../.dev_users.json');

const loadMemoryUsers = () => {
  try {
    if (fs.existsSync(devUsersFile)) {
      const raw = fs.readFileSync(devUsersFile, 'utf-8');
      const data = JSON.parse(raw);
      return new Map(Object.entries(data));
    }
  } catch (err) {
    console.warn('Notice reading .dev_users.json:', err.message);
  }
  return new Map();
};

const saveMemoryUsers = (map) => {
  try {
    const obj = Object.fromEntries(map);
    fs.writeFileSync(devUsersFile, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Notice writing .dev_users.json:', err.message);
  }
};

const memoryUsers = loadMemoryUsers();
const memoryOTPs  = new Map(); // email -> { hashedOTP, expiresAt, attempts, isUsed, resendCount }

const isDBConnected = () => mongoose.connection.readyState === 1;

/** Generate a cryptographically random 6-digit OTP */
const generateOTP = () => String(crypto.randomInt(100000, 999999));

/** Sign a JWT for a User payload */
const signJWT = (payload) =>
  jwt.sign(
    { id: payload._id || payload.email, email: payload.email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/check-email
 */
const checkEmail = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // 1. Check sheet / fallback CSV
    const inSheet = await emailExistsInSheet(email);
    if (!inSheet) {
      return res.status(404).json({
        success: false,
        message: 'Email ID not registered with the RTU Placement Cell. Please contact the T&P Office.',
      });
    }

    // 2. Check if already registered
    let existingUser = null;
    if (isDBConnected()) {
      existingUser = await User.findOne({ email });
    } else {
      existingUser = memoryUsers.get(email);
    }

    if (existingUser && existingUser.isVerified) {
      return res.status(200).json({
        success: true,
        alreadyRegistered: true,
        message: 'You are already registered. Please log in.',
      });
    }

    // 3. Get student name for response
    const student = await findStudentByEmail(email);

    return res.status(200).json({
      success: true,
      alreadyRegistered: false,
      studentName: student?.studentName || '',
      message: 'Email verified. Proceed to send OTP.',
    });
  } catch (err) {
    console.error('checkEmail error:', err.message);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
};

/**
 * POST /api/auth/send-otp
 */
const sendOTP = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 2) * 60 * 1000);
    const hashedOTP = await bcrypt.hash(otp, 10);

    if (isDBConnected()) {
      const recentOTP = await OTP.findOne({ email });
      if (recentOTP && recentOTP.resendCount >= 5) {
        return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again later.' });
      }

      await OTP.findOneAndUpdate(
        { email },
        { hashedOTP, expiresAt, attempts: 0, isUsed: false, $inc: { resendCount: 1 } },
        { upsert: true, new: true }
      );
    } else {
      const current = memoryOTPs.get(email) || { resendCount: 0 };
      if (current.resendCount >= 5) {
        return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again later.' });
      }
      memoryOTPs.set(email, {
        hashedOTP,
        expiresAt,
        attempts: 0,
        isUsed: false,
        resendCount: current.resendCount + 1,
      });
    }

    const student = await findStudentByEmail(email);
    
    // Log OTP to terminal
    console.log(`\n🔑 [DEVELOPMENT OTP] Code for ${email}: >>> ${otp} <<< (Expires in 2 mins)\n`);

    try {
      await sendOTPEmail(email, otp, student?.studentName || 'Student');
    } catch (mailErr) {
      console.warn(`⚠️  Email delivery notice: ${mailErr.message}. Use terminal OTP code above.`);
    }

    res.status(200).json({
      success: true,
      message: `OTP generated for ${email}. (Check email or terminal logs for code)`,
      expiresAt,
    });
  } catch (err) {
    console.error('sendOTP error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp   = (req.body.otp   || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    let otpRecord = null;
    if (isDBConnected()) {
      otpRecord = await OTP.findOne({ email });
    } else {
      otpRecord = memoryOTPs.get(email);
    }

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
    }

    if (otpRecord.isUsed) {
      return res.status(400).json({ success: false, message: 'OTP already used. Please request a new one.' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.hashedOTP);
    if (!isMatch) {
      if (isDBConnected()) {
        await OTP.findOneAndUpdate({ email }, { $inc: { attempts: 1 } });
      } else {
        otpRecord.attempts += 1;
      }
      return res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
    }

    // Mark used
    if (isDBConnected()) {
      await OTP.findOneAndUpdate({ email }, { isUsed: true });
    } else {
      otpRecord.isUsed = true;
    }

    const verifiedToken = jwt.sign(
      { email, purpose: 'set-password' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '15m' }
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      verifiedToken,
    });
  } catch (err) {
    console.error('verifyOTP error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

/**
 * POST /api/auth/set-password
 */
const setPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Verification token missing.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    if (decoded.purpose !== 'set-password') {
      return res.status(401).json({ success: false, message: 'Invalid token purpose.' });
    }

    const email    = decoded.email;
    const password = (req.body.password || '').trim();

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const student = await findStudentByEmail(email);

    if (isDBConnected()) {
      await User.findOneAndUpdate(
        { email },
        {
          email,
          hashedPassword,
          rollNumber:      student?.rollNumber || '',
          rtuEnrollmentNo: student?.collegeRollNo || '',
          collegeRollNo:   student?.collegeRollNo || '',
          studentName:     student?.studentName || '',
          branch:          student?.branch || '',
          currentYearSem:  student?.currentYearSem || '',
          phoneNumber:     student?.phoneNumber || '',
          isVerified:      true,
        },
        { upsert: true, new: true }
      );
    } else {
      memoryUsers.set(email, {
        email,
        hashedPassword,
        rollNumber:      student?.rollNumber || '',
        rtuEnrollmentNo: student?.collegeRollNo || '',
        collegeRollNo:   student?.collegeRollNo || '',
        studentName:     student?.studentName || '',
        isVerified:      true,
      });
      saveMemoryUsers(memoryUsers);
    }

    res.status(200).json({
      success: true,
      message: 'Password set successfully. You can now log in.',
    });
  } catch (err) {
    console.error('setPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let user = null;
    if (isDBConnected()) {
      user = await User.findOne({ email });
    } else {
      user = memoryUsers.get(email);
    }

    if (!user || !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account not registered.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Backfill missing profile fields from Google Sheets (for users registered before this fix)
    if (isDBConnected() && user._id && !user.collegeRollNo) {
      const student = await findStudentByEmail(email);
      if (student) {
        user.collegeRollNo   = student.collegeRollNo || '';
        user.rtuEnrollmentNo = student.collegeRollNo || '';
        user.studentName     = student.studentName || '';
        user.branch          = student.branch || '';
        user.currentYearSem  = student.currentYearSem || '';
        user.phoneNumber     = student.phoneNumber || '';
        if (!user.rollNumber) user.rollNumber = student.rollNumber || '';
        await user.save();
      }
    }

    const token = signJWT(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id:    user._id || user.email,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // 1. Check if user is registered and verified
    let user = null;
    if (isDBConnected()) {
      user = await User.findOne({ email });
    } else {
      user = memoryUsers.get(email);
    }

    if (!user || !user.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'No registered student account found with this email.',
      });
    }

    // 2. Generate Reset JWT
    const resetToken = jwt.sign(
      { email, purpose: 'reset-password' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '15m' }
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}&role=student`;

    console.log(`\n🔑 [RESET LINK] link for student ${email}: >>> ${resetLink} <<<\n`);

    try {
      await sendResetPasswordEmail(email, resetLink, user.studentName || 'Student');
    } catch (mailErr) {
      console.warn(`⚠️ Email delivery notice: ${mailErr.message}. Link: ${resetLink}`);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.',
    });
  } catch (err) {
    console.error('forgotPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to request password reset.' });
  }
};

/**
 * POST /api/auth/reset-password
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

    if (decoded.purpose !== 'reset-password' && decoded.purpose !== 'set-password') {
      return res.status(401).json({ success: false, message: 'Invalid token purpose.' });
    }

    const email = decoded.email;
    const password = (req.body.password || '').trim();

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (isDBConnected()) {
      const updatedUser = await User.findOneAndUpdate(
        { email },
        { hashedPassword },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }
    } else {
      const u = memoryUsers.get(email);
      if (!u) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }
      u.hashedPassword = hashedPassword;
      memoryUsers.set(email, u);
      saveMemoryUsers(memoryUsers);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in.',
    });
  } catch (err) {
    console.error('resetPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

module.exports = { checkEmail, sendOTP, verifyOTP, setPassword, login, forgotPassword, resetPassword };
