const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  login,
  googleLogin,
  setPassword,
} = require('../controllers/authController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
router.post('/login', loginLimiter, login);
router.post('/google', loginLimiter, googleLogin);
router.post('/set-password', loginLimiter, setPassword);

module.exports = router;
