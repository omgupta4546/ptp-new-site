# 🚀 Production Deployment Guide

This guide describes how to deploy the **RTU Placement Cell** portal to production.

---

## 📂 Architecture Overview
- **Backend:** Node.js Express API deployed on **Render** (Free Tier Web Service).
- **Frontend:** React + Vite Single Page Application deployed on **Vercel** or **Render Static Site**.

---

## 🛠️ Step 1: Prepare GitHub Repository
Create a repository on GitHub (private or public) and push the entire codebase. Make sure `node_modules`, `.env`, and build directories are ignored via `.gitignore`.

---

## 📦 Step 2: Deploy Backend on Render

1. Log in to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name:** `rtu-placement-backend`
   - **Region:** Choose closest to your users (e.g., Singapore/Oregon)
   - **Language:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install` (within the `backend` subdirectory; or set root directory to `backend`)
     > [!TIP]
     > If Render asks for Root Directory, set it to `backend`.
   - **Start Command:** `node src/app.js`
   - **Instance Type:** `Free`

### 🔑 Backend Environment Variables (`.env`)
In your Render dashboard, navigate to **Environment** tab, and add the following keys:

| Key | Recommended Value / Description |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` (Render handles this automatically, but safe to define) |
| `MONGO_URI` | `mongodb+srv://...` (Your MongoDB Atlas connection URI) |
| `JWT_SECRET` | Generate a random 64-character hex string (e.g., `907cf91a...`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | **Crucial:** Paste the *entire contents* of your `service-account.json` file here as a single-line JSON string (e.g., `{"type": "service_account", ...}`). This bypasses the need to upload credentials files to Render. |
| `GOOGLE_SHEET_ID` | `1_dFUvQpI9IamME0i_hh1UKqlHcLMjEeiAe1Ul6694ww` |
| `GOOGLE_SHEET_RANGE` | `Sheet1!A1:P500` |
| `CLIENT_URL` | The production URL of your Frontend (e.g., `https://rtu-placement.vercel.app`) |
| `OTP_EXPIRY_MINUTES` | `2` |
| `OTP_MAX_ATTEMPTS` | `5` |
| `EMAIL_USER` | `omgupta6325@gmail.com` |
| `GMAIL_CLIENT_ID` | `<YOUR_GMAIL_CLIENT_ID>` |
| `GMAIL_CLIENT_SECRET` | `<YOUR_GMAIL_CLIENT_SECRET>` |
| `GMAIL_REFRESH_TOKEN` | `<YOUR_GMAIL_REFRESH_TOKEN>` |
| `ADMIN_USERNAME` | `admin@rtu.ac.in` |
| `ADMIN_PASSWORD` | `Admin@RTU2026` |

---

## 🖥️ Step 3: Deploy Frontend on Vercel (Recommended)
Vercel offers the fastest static hosting and automatically serves your SPA correctly.

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. Configure Project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend` (crucial!)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `VITE_API_URL` | The HTTPS URL of your Render backend API (e.g., `https://rtu-placement-backend.onrender.com/api`) |
| `VITE_BACKEND_URL` | The HTTPS base URL of your Render backend (e.g., `https://rtu-placement-backend.onrender.com`) |

6. Click **Deploy**.

---

## 🔄 Step 4: Add Redirect Rule for Single Page Apps (SPAs)
If you deploy on Vercel or Render Static Sites, page reloads on routes (like `/dashboard`) will trigger a `404 Not Found` error because it's a client-side router.

### For Vercel:
Create a file named `vercel.json` in the root of the **frontend** directory with the following content:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### For Render (if hosting frontend on Render Static Site):
In the Render Static Site dashboard, navigate to **Redirects/Rewrites**:
- **Source:** `/*`
- **Destination:** `/index.html`
- **Action:** `Rewrite`

---

## 🧪 Step 5: Verification & Testing
Once both sites are deployed:
1. Verify the frontend loads at the Vercel URL.
2. Register a test student → Verify Gmail API delivers the OTP using Render logs.
3. Mark attendance using the QR code scanner → Verify that Sheet2 updates in real-time.
