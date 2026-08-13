const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

// Load service account credentials from env var (JSON string) or a file path
function getAuthClient() {
  // Prefer a JSON string in env (for Docker/CI), otherwise read from a file path.
  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
    const fs = require('fs');
    const raw = fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_PATH, 'utf-8');
    credentials = JSON.parse(raw);
  } else {
    throw new Error('Google service account credentials not configured');
  }
  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes,
  });
}

// Append a row to the attendance sheet (Sheet2).
// Columns: Roll_Number | Student_Name | RTU_Enrollment_No | Branch | Current_Year_Sem | Phone_Number | name of event | date of event | time of event | name of expert | event topic
async function appendAttendanceRow(event, student) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID not set in .env');
  }

  // If MongoDB student is missing fields, try to fill from Google Sheets
  let rollNumber      = student.rollNumber || '';
  let studentName     = student.studentName || '';
  let rtuEnrollmentNo = student.rtuEnrollmentNo || '';
  let branch          = student.branch || '';
  let currentYearSem  = student.currentYearSem || '';
  let phoneNumber     = student.phoneNumber || '';

  if (!rtuEnrollmentNo || !studentName) {
    try {
      const { findStudentByEmail } = require('../services/sheetsService');
      const sheetStudent = await findStudentByEmail(student.email);
      if (sheetStudent) {
        rollNumber      = rollNumber || sheetStudent.rollNumber || '';
        studentName     = studentName || sheetStudent.studentName || '';
        rtuEnrollmentNo = rtuEnrollmentNo || sheetStudent.rtuEnrollmentNo || '';
        branch          = branch || sheetStudent.branch || '';
        currentYearSem  = currentYearSem || sheetStudent.currentYearSem || '';
        phoneNumber     = phoneNumber || sheetStudent.phoneNumber || '';
      }
    } catch (e) {
      console.warn('Could not fetch student from sheets for attendance row:', e.message);
    }
  }

  // 11 columns matching Sheet2 headers exactly
  const values = [
    rollNumber,           // A: Roll_Number
    studentName,          // B: Student_Name
    rtuEnrollmentNo,      // C: RTU_Enrollment_No
    branch,               // D: Branch
    currentYearSem,       // E: Current_Year_Sem
    phoneNumber,          // F: Phone_Number
    event.name || '',     // G: name of event
    event.date || '',     // H: date of event
    event.time || '',     // I: time of event
    event.expertName || '',// J: name of expert
    event.topic || '',    // K: event topic
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet2!A2',  // Start from row 2 (row 1 = headers)
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });

  console.log(`📝 Attendance row appended to Sheet2 for: ${studentName} (${rollNumber})`);
}

module.exports = { appendAttendanceRow };
