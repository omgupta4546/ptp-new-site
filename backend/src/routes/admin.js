const express = require('express');
const router  = express.Router();
const { adminLogin, getAllDiscrepancies, updateDiscrepancyStatus } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/authMiddleware');

// Public Admin Login endpoint
router.post('/login', adminLogin);

// Protected Admin API endpoints for Discrepancy Reports
router.get('/discrepancies', adminProtect, getAllDiscrepancies);
router.patch('/discrepancies/:id', adminProtect, updateDiscrepancyStatus);

module.exports = router;
