require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');
const { verifyMailerConnection } = require('./services/mailer');

// Route imports
const authRoutes    = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for express-rate-limit behind Render load balancers
app.set('trust proxy', 1);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🎓 RTU Placement Cell API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/attendance', require('./routes/attendance'));

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ── Bootstrap ──────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await verifyMailerConnection();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   🎓  RTU Placement Cell Portal — Backend API    ║
║   🚀  Server running at http://localhost:${PORT}   ║
║   🌿  Environment: ${(process.env.NODE_ENV || 'development').padEnd(13)}               ║
╚══════════════════════════════════════════════════╝
    `);
  });
};

startServer();

module.exports = app;
