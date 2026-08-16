const mongoose = require('mongoose');

const discrepancySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      default: '',
    },
    studentName: {
      type: String,
      default: '',
    },
    field: {
      type: String,
      required: true,
      enum: [
        'CGPA',
        'SGPA_Sem1',
        'SGPA_Sem2',
        'SGPA_Sem3',
        'SGPA_Sem4',
        'SGPA_Sem5',
        'SGPA_Sem6',
        'Active_Backlogs_Count',
        'Backlog_Details',
        'Branch',
        'Phone_Number',
        'RTU_Enrollment_No',
        'College_Roll_No',
        'Other',
      ],
    },
    currentValue: {
      type: String,
      required: true,
    },
    expectedValue: {
      type: String,
      required: true,
    },
    additionalMessage: {
      type: String,
      default: '',
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Discrepancy', discrepancySchema);
