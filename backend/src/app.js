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
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://ptp-new-site-myen.vercel.app',
  'https://ptp-new-site.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.trim().replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(o => o.trim().replace(/\/$/, '') === cleanOrigin) ||
                      /\.vercel\.app$/.test(cleanOrigin) ||
                      cleanOrigin.includes('localhost') ||
                      cleanOrigin.includes('127.0.0.1');

    if (isAllowed) {
      return callback(null, true);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.options('*', cors());

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
