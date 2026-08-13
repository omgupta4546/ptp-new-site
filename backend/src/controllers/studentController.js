const mongoose      = require('mongoose');
const Discrepancy   = require('../models/Discrepancy');
const { findStudentByEmail, refreshCache } = require('../services/sheetsService');

const isDBConnected = () => mongoose.connection.readyState === 1;
const memoryDiscrepancies = [];

/**
 * GET /api/student/me
 */
const getMyProfile = async (req, res) => {
  try {
    const email = req.user.email;

    const student = await findStudentByEmail(email);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student data not found in the placement database. Please contact the T&P Office.',
      });
    }

    const parseSGPA = (val) => {
      const n = parseFloat(val);
      return isNaN(n) || n <= 0 ? null : parseFloat(n.toFixed(2));
    };

    const sem1 = parseSGPA(student.sgpaSem1);
    const sem2 = parseSGPA(student.sgpaSem2);
    const sem3 = parseSGPA(student.sgpaSem3);
    const sem4 = parseSGPA(student.sgpaSem4);
    const sem5 = parseSGPA(student.sgpaSem5);
    const sem6 = parseSGPA(student.sgpaSem6);

    const validSGPAs = [sem1, sem2, sem3, sem4, sem5, sem6].filter((s) => s !== null && s > 0);

    // RTU Official CGPA Calculation (Average of valid completed semester SGPAs)
    let computedCGPA = null;
    if (validSGPAs.length > 0) {
      const sum = validSGPAs.reduce((acc, curr) => acc + curr, 0);
      computedCGPA = parseFloat((sum / validSGPAs.length).toFixed(2));
    }

    const effectiveCGPA = computedCGPA !== null ? computedCGPA : parseSGPA(student.currentCGPA);
    const activeBacklogs = parseInt(student.activeBacklogsCount, 10) || 0;

    const profile = {
      rollNumber:         student.rollNumber,
      studentName:        student.studentName,
      rtuEnrollmentNo:    student.rtuEnrollmentNo,
      branch:             student.branch,
      currentYearSem:     student.currentYearSem,
      email:              student.emailId,
      phoneNumber:        student.phoneNumber,

      sgpa: {
        sem1,
        sem2,
        sem3,
        sem4,
        sem5,
        sem6,
      },
      currentCGPA:         effectiveCGPA,
      calculatedFromSGPAs: validSGPAs.length > 0,
      completedSemestersCount: validSGPAs.length,
      activeBacklogsCount: activeBacklogs,
      backlogDetails:      student.backlogDetails || '',

      isEligibleForPlacements: (effectiveCGPA || 0) >= 7.0 && activeBacklogs === 0,
    };

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error('getMyProfile error:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

/**
 * POST /api/student/discrepancy
 */
const reportDiscrepancy = async (req, res) => {
  try {
    const email = req.user.email;
    const rawField    = req.body.field || req.body.fieldName;
    const currentVal  = req.body.currentValue;
    const expectedVal = req.body.expectedValue || req.body.requestedValue;
    const msg         = req.body.additionalMessage || req.body.reason || req.body.message || '';

    if (!rawField || currentVal === undefined || expectedVal === undefined) {
      return res.status(400).json({
        success: false,
        message: 'field, currentValue, and expectedValue are required.',
      });
    }

    const student = await findStudentByEmail(email);

    let reportId = Date.now().toString();
    if (isDBConnected()) {
      const discrepancy = await Discrepancy.create({
        email,
        rollNumber:        student?.rollNumber || req.user.rollNumber || '',
        studentName:       student?.studentName || '',
        field:             rawField,
        currentValue:      String(currentVal),
        expectedValue:     String(expectedVal),
        additionalMessage: String(msg),
      });
      reportId = discrepancy._id;
    } else {
      memoryDiscrepancies.push({
        id: reportId,
        email,
        rollNumber:        student?.rollNumber || '',
        studentName:       student?.studentName || '',
        field:             rawField,
        currentValue:      String(currentVal),
        expectedValue:     String(expectedVal),
        additionalMessage: String(msg),
        createdAt: new Date(),
      });
      console.log('📌 [MEMORY DISCREPANCY LOGGED]:', { email, field: rawField, currentVal, expectedVal });
    }

    res.status(201).json({
      success: true,
      message: 'Discrepancy report submitted successfully. The T&P Office will review it shortly.',
      data: { id: reportId },
    });
  } catch (err) {
    console.error('reportDiscrepancy error:', err.message);
    res.status(500).json({ success: false, message: 'Server error submitting discrepancy.' });
  }
};

/**
 * POST /api/student/refresh-data
 */
const refreshSheetData = async (req, res) => {
  try {
    await refreshCache();
    res.status(200).json({ success: true, message: 'Student data refreshed.' });
  } catch (err) {
    console.error('refreshSheetData error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to refresh data.' });
  }
};

module.exports = { getMyProfile, reportDiscrepancy, refreshSheetData };
