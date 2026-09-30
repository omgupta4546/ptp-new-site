const express = require('express');
const router  = express.Router();
const { adminLogin, forgotPassword, resetPassword, getSettings, updateSettings } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/authMiddleware');

// Public Admin Login endpoint
router.post('/login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected Admin routes
router.get('/settings', adminProtect, getSettings);
router.post('/settings', adminProtect, updateSettings);

module.exports = router;
