const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const User     = require('../models/User');

/**
 * Middleware: verify JWT from Authorization: Bearer <token> header for Students
 * Attaches req.user = { id, email } on success
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // If database is connected and valid ID, attempt Mongoose lookup
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const user = await User.findById(decoded.id).select('-hashedPassword');
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Fallback: use decoded payload from JWT token (works offline or with memory store)
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }
};

/**
 * Middleware: verify JWT specifically for Administrator role
 */
const adminProtect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin authorization required. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Administrator credentials required.',
      });
    }

    req.admin = { id: decoded.id, email: decoded.email, role: 'admin' };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid admin token. Authorization denied.',
    });
  }
};

module.exports = { protect, adminProtect };
