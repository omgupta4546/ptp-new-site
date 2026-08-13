const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// ── In-memory cache ────────────────────────────────────────────────────────────
let cachedData = null;       // Array of student objects
let lastFetchedAt = null;    // Timestamp of last fetch
const CACHE_TTL_MS = 10 * 1000; // 10 seconds for instant live updates

// ── Column header → JS key mapping ────────────────────────────────────────────
const COLUMN_MAP = {
  roll_number:           'rollNumber',
  student_name:          'studentName',
  rtu_enrollment_no:     'rtuEnrollmentNo',
  branch:                'branch',
  current_year_sem:      'currentYearSem',
  email_id:              'emailId',
  phone_number:          'phoneNumber',
  sgpa_sem1:             'sgpaSem1',
  sgpa_sem2:             'sgpaSem2',
  sgpa_sem3:             'sgpaSem3',
  sgpa_sem4:             'sgpaSem4',
  sgpa_sem5:             'sgpaSem5',
  sgpa_sem6:             'sgpaSem6',
  current_cgpa:          'currentCGPA',
  active_backlogs_count: 'activeBacklogsCount',
  backlog_details:       'backlogDetails',
};

/**
 * Build and return an authenticated Google Sheets API client
 */
const getSheetsClient = () => {
  const keyPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './service-account.json');
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Service account key file not found at: ${keyPath}`);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
};

/**
 * Normalise a header string to the COLUMN_MAP key format
 */
const normaliseHeader = (header) =>
  header.trim().toLowerCase().replace(/[\s-]/g, '_');

/**
 * Fallback CSV reader to load local students_sample.csv if Google Sheets API fails or key is missing
 */
const fetchFallbackLocalCSV = () => {
  const csvPath = path.resolve(__dirname, '../../../students_sample.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('⚠️  Fallback CSV file not found at:', csvPath);
    return [];
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse CSV headers
  const headers = lines[0].split(',').map(normaliseHeader);

  // Simple CSV parser for lines
  const students = lines.slice(1).map((line) => {
    // Handle quoted fields
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const student = {};
    headers.forEach((header, idx) => {
      const jsKey = COLUMN_MAP[header] || header;
      let val = values[idx] !== undefined ? String(values[idx]).trim() : '';
      val = val.replace(/^"|"$/g, ''); // strip quotes
      student[jsKey] = val;
    });
    return student;
  });

  const filtered = students.filter((s) => s.emailId || s.rollNumber);
  console.log(`📁 Loaded ${filtered.length} student records from local fallback CSV (students_sample.csv)`);
  return filtered;
};

/**
 * Fetch all students from the configured Google Sheet.
 * Falls back to local CSV if Google Sheets API fails or credentials are incomplete.
 */
const fetchAllStudents = async (force = false) => {
  const now = Date.now();
  if (!force && cachedData && lastFetchedAt && now - lastFetchedAt < CACHE_TTL_MS) {
    return cachedData;
  }

  try {
    const sheets = getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range   = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A1:P500';

    if (!sheetId || sheetId === 'sample_sheet_id') {
      throw new Error('GOOGLE_SHEET_ID is not configured in backend/.env');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      console.warn('⚠️  Google Sheet returned no data rows.');
      cachedData    = [];
      lastFetchedAt = now;
      return cachedData;
    }

    const headers = rows[0].map(normaliseHeader);
    const students = rows.slice(1).map((row) => {
      const student = {};
      headers.forEach((header, idx) => {
        const jsKey = COLUMN_MAP[header] || header;
        student[jsKey] = row[idx] !== undefined ? String(row[idx]).trim() : '';
      });
      return student;
    });

    const filtered = students.filter((s) => s.emailId || s.rollNumber);
    cachedData    = filtered;
    lastFetchedAt = now;
    console.log(`📊 Loaded ${filtered.length} student records live from Google Sheets`);
    return filtered;
  } catch (err) {
    console.warn(`⚠️  Google Sheets API Sync Notice: ${err.message}`);
    console.log('🔄 Falling back to local student records (students_sample.csv)...');

    const fallbackData = fetchFallbackLocalCSV();
    cachedData    = fallbackData;
    lastFetchedAt = now;
    return cachedData;
  }
};

/**
 * Find a single student by email address (case-insensitive)
 */
const findStudentByEmail = async (email) => {
  const students = await fetchAllStudents();
  const target   = email.trim().toLowerCase();
  return students.find((s) => s.emailId.toLowerCase() === target) || null;
};

/**
 * Check whether an email exists in the sheet (for registration gate)
 */
const emailExistsInSheet = async (email) => {
  const student = await findStudentByEmail(email);
  return student !== null;
};

/**
 * Force-refresh the in-memory cache
 */
const refreshCache = async () => {
  await fetchAllStudents(true);
};

module.exports = {
  fetchAllStudents,
  findStudentByEmail,
  emailExistsInSheet,
  refreshCache,
};
