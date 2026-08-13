# 🎓 RTU Kota — Placement Cell & Attendance Portal

A modern, responsive, full-stack Placement Cell and Attendance Verification Portal built for **Rajasthan Technical University (RTU), Kota**.

This portal enables students to register via email OTP verification against official records, set up secure passwords, access dynamic academic performance dashboards (SGPAs, CGPA, Backlogs, Eligibility), report data discrepancies, and allows event volunteers to scan student QR codes for instant event attendance tracking synced live with central Google Sheets.

---

## 🚀 Quick Feature Overview

1. **🔒 Secure Email OTP Registration & Hashed Auth**:
   - Validates student email against central database (Google Sheets/MongoDB) before dispatching 6-digit OTP.
   - Password strength metering with `bcryptjs` hashing and stateless JWT token management.

2. **📊 Dynamic Academic Dashboard**:
   - **Personal Info**: Roll Number, RTU Enrollment No, Branch, Email, Phone.
   - **Visual Performance Meters**: Semester-wise SGPA breakdown (Sem 1 to Sem 6), visual circular CGPA gauge.
   - **Eligibility & Backlogs**: Automated drive eligibility checks (CGPA ≥ 7.0 & 0 Active Backlogs) with color-coded backlog badges.
   - **Discrepancy Reporting**: Modal interface for students to flag academic/personal data corrections for T&P admins.

3. **📷 Volunteer QR Code Scanner & Attendance Tracking**:
   - Mobile-ready QR scanner interface for event volunteers (`/scanner/:eventId/:token`).
   - Scans student QR codes or enrollment numbers to record real-time attendance via backend API.

4. **⚡ Live Google Sheets & MongoDB Synchronization**:
   - Dynamic background data fetch from Google Sheets API v4.
   - Automatic fallback and sheet data sync.

---

## 📁 Repository Structure

```
ptp-new-site/
├── backend/
│   ├── src/
│   │   ├── config/             # MongoDB database connection setup
│   │   ├── controllers/        # Auth, Student, and Attendance business logic
│   │   ├── middleware/         # Auth guard & JWT validation
│   │   ├── models/             # Mongoose schemas (User, OTP, Discrepancy, Attendance)
│   │   ├── routes/             # API routes (/api/auth, /api/student, /api/attendance)
│   │   ├── services/           # Google Sheets API integration & Nodemailer mailer
│   │   └── app.js              # Express application entry point
│   ├── .env.example            # Backend environment variables template
│   ├── .gitignore              # Ignores sensitive keys & .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, CGPAMeter, SGPACard, BacklogBadge, DiscrepancyModal, etc.
│   │   ├── pages/              # Register, VerifyOTP, SetPassword, Login, Dashboard, VolunteerScanner
│   │   ├── services/           # Axios API client setup
│   │   ├── store/              # Zustand Auth Store with local storage persistence
│   │   ├── App.jsx             # React Router configuration
│   │   ├── index.css           # Custom Tailwind utilities & RTU color palette
│   │   └── main.jsx
│   ├── .env.example            # Frontend environment variables template
│   ├── .gitignore              # Ignores dist & .env
│   ├── tailwind.config.js      # RTU Kota official color theme configuration
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore                  # Root gitignore excluding secrets across the repository
├── README.md                   # Full setup & documentation guide
└── students_sample.csv         # Sample dataset template
```

---

## 🛠️ Step-by-Step Installation & Setup Guide

### 📋 Prerequisites
Before running the application, ensure you have installed:
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) OR a **MongoDB Atlas** connection string.
- **Google Cloud Service Account** *(Optional but recommended for live Google Sheets sync)*.

---

### ⚙️ Step 1: Clone the Repository

```bash
git clone https://github.com/omgupta4546/ptp-new-site.git
cd ptp-new-site
```

---

### ⚙️ Step 2: Backend Setup

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Create Environment File (`.env`)**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Configure your `backend/.env` file**:
   Open `backend/.env` and update the values:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development

   # MongoDB
   MONGO_URI=mongodb://localhost:27017/rtu_placement

   # JWT Hashing Secret
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # SMTP Credentials (Gmail App Password required)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_official_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   EMAIL_FROM="RTU Placement Cell <your_official_email@gmail.com>"

   # Google Sheets API (Syncing student academic records)
   GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json
   GOOGLE_SHEET_ID=your_google_sheet_id_here
   GOOGLE_SHEET_RANGE=Sheet1!A1:P500

   # Client URL for CORS
   CLIENT_URL=http://localhost:5173

   # OTP Expiry Settings
   OTP_EXPIRY_MINUTES=2
   OTP_MAX_ATTEMPTS=5
   ```

5. **Google Sheets Service Account Setup (For live sheet sync)**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Enable **Google Sheets API**.
   - Create a **Service Account**, generate a JSON key, and download it.
   - Rename the downloaded file to `service-account.json` and place it inside the `backend/` root directory (`backend/service-account.json`).
   - Share your central Google Sheet with the Service Account email address (`...gserviceaccount.com`) giving **Viewer** permissions.

6. **Start Backend Server**:
   ```bash
   npm run dev
   ```
   *Backend will run on `http://localhost:5000`.*

---

### ⚙️ Step 3: Frontend Setup

1. **Open a new terminal and navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Create Environment File (`.env`)**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Configure `frontend/.env`**:
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```

5. **Start Frontend Development Server**:
   ```bash
   npm run dev
   ```
   *Frontend will launch at `http://localhost:5173`.*

---

## 📊 Central Google Sheet Database Schema

If you choose to sync student records from a Google Sheet, format row 1 with these exact headers:

| Column Header | Sample Value | Description |
|---|---|---|
| `Roll_Number` | `20EICCS001` | Unique Student Roll Number |
| `Student_Name` | `Aarav Sharma` | Full Name |
| `RTU_Enrollment_No` | `20E1EICCS40P001` | Official RTU Enrollment ID |
| `Branch` | `Computer Science & Engineering` | Branch / Department |
| `Current_Year_Sem` | `7th Sem` | Current Semester |
| `Email_ID` | `aarav.sharma@rtu.ac.in` | Student Official Email (Primary Key for OTP) |
| `Phone_Number` | `9876543210` | Contact Phone Number |
| `SGPA_Sem1` - `SGPA_Sem6` | `8.50` | Individual semester SGPA scores |
| `Current_CGPA` | `8.55` | Cumulative Grade Point Average |
| `Active_Backlogs_Count` | `0` | Number of active backlogs |
| `Backlog_Details` | `Digital Comm (EC-502)` | Comma-separated list of active backlog subjects |

---

## 🔐 Security & Git Notice

> [!CAUTION]
> **Environment & Credential Safety**
> This repository strictly excludes secret files via `.gitignore`. 
> Make sure **NEVER** to commit or push `.env`, `.env.local`, or `backend/service-account.json` to GitHub or any public code host.

---

## 🎨 Design System & Theme Palette

- **Primary Colors**: RTU Royal Navy (`#003087`), Slate Blue (`#0047AB`)
- **Accent**: RTU Gold (`#FFB800`)
- **Backgrounds**: Slate Dark Gradient & Glassmorphism Card Containers
- **Typography**: Google Fonts Inter & Outfit

---

## 📜 License & Credits

Developed for **Training & Placement Cell, Rajasthan Technical University (RTU), Kota**.
