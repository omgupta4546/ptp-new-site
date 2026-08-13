const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  checkEmail,
  sendOTP,
  verifyOTP,
  setPassword,
  login,
} = require('../controllers/authController');

// Rate limiters
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many OTP requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
router.post('/check-email',           checkEmail);
router.post('/send-otp',    otpLimiter, sendOTP);
router.post('/verify-otp',  otpLimiter, verifyOTP);
router.post('/set-password',           setPassword);
router.post('/login',     loginLimiter, login);

// Alias: resend-otp → send-otp (same logic, rate-limited)
router.post('/resend-otp',  otpLimiter, sendOTP);

module.exports = router;
