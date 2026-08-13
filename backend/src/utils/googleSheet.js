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

// Append a row to the attendance sheet.
async function appendAttendanceRow(event, student, scannedAt) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  // Support both env var names for backwards compatibility.
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID not set in .env');
  }
  const values = [
    student.rollNumber || '',
    student.studentName || '',
    student.rtuEnrollmentNo || '',
    student.branch || '',
    student.currentYearSem || '',
    student.phoneNumber || '',
    event.name,
    event.date,
    event.time,
    event.expertName,
    event.topic,
    scannedAt ? new Date(scannedAt).toISOString() : new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet2!A1', // attendance rows now go to Sheet2
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

module.exports = { appendAttendanceRow };
