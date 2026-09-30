const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const fs       = require('fs');
const path     = require('path');
const { OAuth2Client } = require('google-auth-library');

const User           = require('../models/User');
const { findStudentByEmail, getRollKey, getNameKey } = require('../services/sheetsService');

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

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID);
const isDBConnected = () => mongoose.connection.readyState === 1;

const signJWT = (payload) =>
  jwt.sign(
    { id: payload._id || payload.email, email: payload.email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const signTempToken = (email) =>
  jwt.sign({ email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '15m' });

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Google credential required.' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase().trim();

    const student = await findStudentByEmail(email);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Your email is not registered with the T&P Office.' });
    }

    const studentRoll = student[getRollKey(student)] || '';
    const studentName = student[getNameKey(student)] || '';

    let user = null;
    if (isDBConnected()) {
      user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ email, rollNumber: studentRoll, studentName: studentName });
      } else {
        user.rollNumber = studentRoll;
        user.studentName = studentName;
        await user.save();
      }
    } else {
      user = memoryUsers.get(email);
      if (!user) {
        user = { email, rollNumber: studentRoll, studentName: studentName };
      }
      memoryUsers.set(email, user);
      saveMemoryUsers(memoryUsers);
    }

    if (!user.password) {
      return res.status(200).json({
        success: true,
        requiresPasswordSetup: true,
        tempToken: signTempToken(email),
        message: 'Please set a password for your account.',
        user: { email: user.email, name: studentName || payload.name, picture: payload.picture }
      });
    }

    const token = signJWT(user);
    res.status(200).json({
      success: true,
      message: 'Access granted via Google.',
      token,
      user: { id: user._id || user.email, email: user.email, name: studentName || payload.name, picture: payload.picture },
    });
  } catch (err) {
    console.error('googleLogin error:', err.message);
    res.status(500).json({ success: false, message: 'Google authentication failed.' });
  }
};

const setPassword = async (req, res) => {
  try {
    const { tempToken, password } = req.body;
    if (!tempToken || !password) return res.status(400).json({ success: false, message: 'Token and password are required.' });
    
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'fallback_secret');
    } catch(err) {
      return res.status(401).json({ success: false, message: 'Session expired. Please verify with Google again.' });
    }

    const email = decoded.email;
    let user = null;
    if (isDBConnected()) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
    } else {
      user = memoryUsers.get(email);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      memoryUsers.set(email, user);
      saveMemoryUsers(memoryUsers);
    }

    const token = signJWT(user);
    res.status(200).json({
      success: true,
      message: 'Password set successfully. Access granted.',
      token,
      user: { id: user._id || user.email, email: user.email, name: user.studentName }
    });
  } catch (err) {
    console.error('setPassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });

    let user = null;
    if (isDBConnected()) {
      user = await User.findOne({ email });
    } else {
      user = memoryUsers.get(email);
    }

    if (!user) return res.status(404).json({ success: false, message: 'Email not registered. Please sign in with Google first.' });
    if (!user.password) return res.status(401).json({ success: false, message: 'Password not set. Please sign in with Google to set a password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password.' });

    const student = await findStudentByEmail(email);
    if (student) {
      const roll = student[getRollKey(student)] || user.rollNumber;
      const name = student[getNameKey(student)] || user.studentName;
      user.rollNumber = roll;
      user.studentName = name;
      if (isDBConnected()) {
        await user.save();
      } else {
        memoryUsers.set(email, user);
        saveMemoryUsers(memoryUsers);
      }
    }

    const token = signJWT(user);
    res.status(200).json({
      success: true,
      message: 'Access granted.',
      token,
      user: { id: user._id || user.email, email: user.email, name: user.studentName },
    });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

module.exports = { googleLogin, setPassword, login };
