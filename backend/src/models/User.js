const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    rollNumber: {
      type: String,
      default: null,
    },
    studentName: {
      type: String,
      default: null,
    },
    rtuEnrollmentNo: {
      type: String,
      default: null,
    },
    branch: {
      type: String,
      default: null,
    },
    currentYearSem: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
