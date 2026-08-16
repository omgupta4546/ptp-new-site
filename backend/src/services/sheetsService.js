const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// ── In-memory cache ────────────────────────────────────────────────────────────
let cachedData = null;       // Array of student objects
let lastFetchedAt = null;    // Timestamp of last fetch
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache for fast responses

// ── Column header → JS key mapping ────────────────────────────────────────────
const mapHeadersToKeys = (headers) => {
  return headers.map(h => {
    if (!h) return '';
    const clean = h.toLowerCase().trim();
    
    // Core fields
    if (clean.includes('university roll') || clean.includes('university_roll') || clean.includes('roll_number') || clean === 'roll number') return 'rollNumber';
    if (clean.includes('college roll') || clean.includes('college_roll')) return 'collegeRollNo';
    if (clean.includes('student_name') || clean === 'student name') return 'studentName';
    if (clean.includes('branch')) return 'branch';
    if (clean.includes('current_year_sem') || clean.includes('current year') || clean.includes('year/sem')) return 'currentYearSem';
    if (clean.includes('email_id') || clean.includes('email id')) return 'emailId';
    if (clean.includes('phone_number') || clean.includes('phone number')) return 'phoneNumber';
    
    // Schooling & Diploma
    if (clean.includes('class 10') || clean.includes('10th')) return 'class10';
    if (clean.includes('class 12') || clean.includes('12th')) return 'class12';
    if (clean.includes('diploma')) return 'diploma';
    
    // B.Tech
    if (clean.includes('b.tech')) {
      const semMatch = clean.match(/(\d)(st|nd|rd|th)\s+sem/);
      if (semMatch) {
        const semNum = semMatch[1];
        if (clean.startsWith('sgpa')) return `btech_sgpaSem${semNum}`;
        if (clean.startsWith('result')) return `btech_resultSem${semNum}`;
        if (clean.includes('obtained')) return `btech_backObtainedSem${semNum}`;
        if (clean.includes('pending')) return `btech_backPendingSem${semNum}`;
      }
    }
    
    // MBA
    if (clean.includes('mba')) {
      if (clean.includes('first specialization')) return 'mba_firstSpecialization';
      if (clean.includes('second specialization')) return 'mba_secondSpecialization';
      
      const semMatch = clean.match(/(\d)(st|nd|rd|th)\s+sem/);
      if (semMatch) {
        const semNum = semMatch[1];
        if (clean.startsWith('sgpa')) return `mba_sgpaSem${semNum}`;
        if (clean.startsWith('result')) return `mba_resultSem${semNum}`;
        if (clean.includes('back paper')) return `mba_backSem${semNum}`;
      }
      
      if (clean.includes('total agrr. cgpa') || clean.includes('cgpa in mba')) return 'mba_cgpa';
      if (clean.includes('total pending back')) return 'mba_pendingBacks';
    }
    
    // M.Tech
    if (clean.includes('m.tech')) {
      if (clean.includes('branch/specialization')) return 'mtech_specialization';
      if (clean.includes('dissertation thesis')) return 'mtech_thesisTitle';
      
      const semMatch = clean.match(/(\d)(st|nd|rd|th)\s+sem/);
      if (semMatch) {
        const semNum = semMatch[1];
        if (clean.includes('percentage/sgpa')) return `mtech_sgpaSem${semNum}`;
        if (clean.startsWith('result')) return `mtech_resultSem${semNum}`;
        if (clean.includes('back paper pending')) return `mtech_backSem${semNum}`;
      }
      
      if (clean.includes('percentage/cgpa in m.tech')) return 'mtech_cgpa';
      if (clean.includes('back paper pending in m.tech') || clean.includes('number of back paper pending in m.tech')) return 'mtech_pendingBacks';
    }
    
    // General / fallback
    return clean.replace(/[^a-z0-9]/g, '_');
  });
};

/**
 * Build and return an authenticated Google Sheets API client
 */
const getSheetsClient = () => {
  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (parseErr) {
      throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: ' + parseErr.message);
    }
  } else {
    const keyPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './service-account.json');
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Service account key file not found at: ${keyPath}`);
    }
    const raw = fs.readFileSync(keyPath, 'utf-8');
    credentials = JSON.parse(raw);
  }

  const { JWT } = require('google-auth-library');
  const auth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
};

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
  const headers = lines[0].split(',');
  const jsKeys = mapHeadersToKeys(headers);

  // Simple CSV parser for lines
  const students = lines.slice(1).map((line) => {
    // Handle quoted fields
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const student = {};
    jsKeys.forEach((jsKey, idx) => {
      let val = values[idx] !== undefined ? String(values[idx]).trim() : '';
      val = val.replace(/^"|"$/g, ''); // strip quotes
      if (jsKey) student[jsKey] = val;
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
    const range = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A1:BT';

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
      cachedData = [];
      lastFetchedAt = now;
      return cachedData;
    }

    const headers = rows[0];
    const jsKeys = mapHeadersToKeys(headers);
    const students = rows.slice(1).map((row) => {
      const student = {};
      jsKeys.forEach((jsKey, idx) => {
        if (jsKey) student[jsKey] = row[idx] !== undefined ? String(row[idx]).trim() : '';
      });
      return student;
    });

    const filtered = students.filter((s) => s.emailId || s.rollNumber);
    cachedData = filtered;
    lastFetchedAt = now;
    console.log(`📊 Loaded ${filtered.length} student records live from Google Sheets`);
    return filtered;
  } catch (err) {
    console.warn(`⚠️  Google Sheets API Sync Notice: ${err.message}`);
    console.log('🔄 Falling back to local student records (students_sample.csv)...');

    const fallbackData = fetchFallbackLocalCSV();
    cachedData = fallbackData;
    lastFetchedAt = now;
    return cachedData;
  }
};

/**
 * Find a single student by email address (case-insensitive)
 */
const findStudentByEmail = async (email) => {
  const students = await fetchAllStudents();
  if (!email) return null;
  const target = email.trim().toLowerCase();
  return students.find((s) => s.emailId && s.emailId.trim().toLowerCase() === target) || null;
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
