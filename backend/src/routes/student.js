const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getMyProfile,
  refreshSheetData,
} = require('../controllers/studentController');

// All routes protected by JWT
router.get( '/me',           protect, getMyProfile);
router.post('/refresh-data', protect, refreshSheetData);

module.exports = router;
