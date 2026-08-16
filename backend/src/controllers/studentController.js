const mongoose = require('mongoose');
const Discrepancy = require('../models/Discrepancy');
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

    // 1. B.Tech Data Processing
    const btech_sgpa = {};
    const btech_semestersDetails = {};
    const btechSGPAs = [];
    let btechActiveBacklogs = 0;
    const btechBackDetailsList = [];
    for (let i = 1; i <= 8; i++) {
      const val = parseSGPA(student[`btech_sgpaSem${i}`]);
      btech_sgpa[`sem${i}`] = val;
      if (val !== null && val > 0) {
        btechSGPAs.push(val);
      }

      const pendingVal = parseInt(student[`btech_backPendingSem${i}`], 10) || 0;
      btechActiveBacklogs += pendingVal;

      const obtained = student[`btech_backObtainedSem${i}`] || '';
      if (obtained && obtained !== '0' && obtained.toLowerCase() !== 'none' && obtained.toLowerCase() !== 'na' && obtained.toLowerCase() !== 'nil') {
        btechBackDetailsList.push(`Sem ${i}: ${obtained}`);
      }

      let semResult = student[`btech_resultSem${i}`] || '';
      if (!semResult) {
        if (pendingVal > 0) {
          semResult = 'Fail';
        } else if (val) {
          semResult = 'Pass';
        }
      }

      btech_semestersDetails[`sem${i}`] = {
        sgpa: val,
        result: semResult,
        backObtained: obtained,
        backPending: pendingVal
      };
    }

    let btechComputedCGPA = null;
    if (btechSGPAs.length > 0) {
      const sum = btechSGPAs.reduce((acc, curr) => acc + curr, 0);
      btechComputedCGPA = parseFloat((sum / btechSGPAs.length).toFixed(2));
    }

    const btechData = {
      sgpa: btech_sgpa,
      semestersDetails: btech_semestersDetails,
      cgpa: btechComputedCGPA,
      activeBacklogsCount: btechActiveBacklogs,
      backlogDetails: btechBackDetailsList.join(', ') || student.backlogDetails || '',
      isEligibleForPlacements: (btechComputedCGPA || 0) >= 7.0 && btechActiveBacklogs === 0
    };

    // 2. MBA Data Processing
    const mba_sgpa = {};
    const mba_semestersDetails = {};
    let mbaActiveBacklogs = 0;
    const mbaBackDetailsList = [];
    for (let i = 1; i <= 4; i++) {
      const val = parseSGPA(student[`mba_sgpaSem${i}`]);
      mba_sgpa[`sem${i}`] = val;

      const backValRaw = student[`mba_backSem${i}`] || '';
      const backValNum = parseInt(backValRaw, 10);
      if (!isNaN(backValNum) && backValNum > 0) {
        mbaActiveBacklogs += backValNum;
      } else if (backValRaw && backValRaw !== '0' && backValRaw.toLowerCase() !== 'none' && backValRaw.toLowerCase() !== 'na' && backValRaw.toLowerCase() !== 'nil') {
        mbaActiveBacklogs += 1;
        mbaBackDetailsList.push(`Sem ${i}: ${backValRaw}`);
      }

      let semResult = student[`mba_resultSem${i}`] || '';
      if (!semResult) {
        if (backValNum > 0 || (backValRaw && backValRaw !== '0' && backValRaw.toLowerCase() !== 'none' && backValRaw.toLowerCase() !== 'na')) {
          semResult = 'Fail';
        } else if (val) {
          semResult = 'Pass';
        }
      }

      mba_semestersDetails[`sem${i}`] = {
        sgpa: val,
        result: semResult,
        back: backValRaw
      };
    }
    const mbaCGPA = parseSGPA(student.mba_cgpa);

    const mbaData = {
      sgpa: mba_sgpa,
      semestersDetails: mba_semestersDetails,
      cgpa: mbaCGPA,
      activeBacklogsCount: mbaActiveBacklogs,
      firstSpecialization: student.mba_firstSpecialization || '',
      secondSpecialization: student.mba_secondSpecialization || '',
      backlogDetails: mbaBackDetailsList.join(', ') || student.backlogDetails || '',
      isEligibleForPlacements: (mbaCGPA || 0) >= 7.0 && mbaActiveBacklogs === 0
    };

    // 3. M.Tech Data Processing
    const mtech_sgpa = {};
    const mtech_semestersDetails = {};
    let mtechActiveBacklogs = 0;
    const mtechBackDetailsList = [];
    for (let i = 1; i <= 4; i++) {
      const val = parseSGPA(student[`mtech_sgpaSem${i}`]);
      mtech_sgpa[`sem${i}`] = val;

      const backValRaw = student[`mtech_backSem${i}`] || '';
      const backValNum = parseInt(backValRaw, 10);
      if (!isNaN(backValNum) && backValNum > 0) {
        mtechActiveBacklogs += backValNum;
      } else if (backValRaw && backValRaw !== '0' && backValRaw.toLowerCase() !== 'none' && backValRaw.toLowerCase() !== 'na' && backValRaw.toLowerCase() !== 'nil') {
        mtechActiveBacklogs += 1;
        mtechBackDetailsList.push(`Sem ${i}: ${backValRaw}`);
      }

      let semResult = student[`mtech_resultSem${i}`] || '';
      if (!semResult) {
        if (backValNum > 0 || (backValRaw && backValRaw !== '0' && backValRaw.toLowerCase() !== 'none' && backValRaw.toLowerCase() !== 'na')) {
          semResult = 'Fail';
        } else if (val) {
          semResult = 'Pass';
        }
      }

      mtech_semestersDetails[`sem${i}`] = {
        sgpa: val,
        result: semResult,
        back: backValRaw
      };
    }
    const mtechCGPA = parseSGPA(student.mtech_cgpa);

    const mtechData = {
      sgpa: mtech_sgpa,
      semestersDetails: mtech_semestersDetails,
      cgpa: mtechCGPA,
      activeBacklogsCount: mtechActiveBacklogs,
      specialization: student.mtech_specialization || '',
      thesisTitle: student.mtech_thesisTitle || '',
      backlogDetails: mtechBackDetailsList.join(', ') || student.backlogDetails || '',
      isEligibleForPlacements: (mtechCGPA || 0) >= 7.0 && mtechActiveBacklogs === 0
    };

    // Determine primary course based on sheet columns
    let primaryCourse = 'btech';
    if (student.mba_firstSpecialization || student.mba_cgpa) {
      primaryCourse = 'mba';
    } else if (student.mtech_specialization || student.mtech_cgpa) {
      primaryCourse = 'mtech';
    }

    const activeCourseData = primaryCourse === 'mba' ? mbaData : (primaryCourse === 'mtech' ? mtechData : btechData);

    const profile = {
      rollNumber: student.rollNumber,
      studentName: student.studentName,
      rtuEnrollmentNo: student.collegeRollNo || '', // for legacy compatibility
      collegeRollNo: student.collegeRollNo || '',
      class10: student.class10 || '',
      class12: student.class12 || '',
      diploma: student.diploma || '',
      branch: student.branch,
      currentYearSem: student.currentYearSem,
      email: student.emailId,
      phoneNumber: student.phoneNumber,

      // Root details (backward compatibility)
      sgpa: activeCourseData.sgpa,
      currentCGPA: activeCourseData.cgpa,
      activeBacklogsCount: activeCourseData.activeBacklogsCount,
      backlogDetails: activeCourseData.backlogDetails || '',
      isEligibleForPlacements: activeCourseData.isEligibleForPlacements,

      // Dynamic courses payload
      courses: {
        btech: btechData,
        mba: mbaData,
        mtech: mtechData
      },
      primaryCourse
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
    const rawField = req.body.field || req.body.fieldName;
    const currentVal = req.body.currentValue;
    const expectedVal = req.body.expectedValue || req.body.requestedValue;
    const msg = req.body.additionalMessage || req.body.reason || req.body.message || '';

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
        rollNumber: student?.rollNumber || req.user.rollNumber || '',
        studentName: student?.studentName || '',
        field: rawField,
        currentValue: String(currentVal),
        expectedValue: String(expectedVal),
        additionalMessage: String(msg),
      });
      reportId = discrepancy._id;
    } else {
      memoryDiscrepancies.push({
        id: reportId,
        email,
        rollNumber: student?.rollNumber || '',
        studentName: student?.studentName || '',
        field: rawField,
        currentValue: String(currentVal),
        expectedValue: String(expectedVal),
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
