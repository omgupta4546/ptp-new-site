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
    password: {
      type: String,
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
    collegeRollNo: {
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
