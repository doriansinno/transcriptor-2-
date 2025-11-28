import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import licenseRoutes from './routes/license.js';
import improveRoutes from './routes/improve.js';
import emergencyRoutes from './routes/emergency.js';
import { loadLicenses } from './controllers/licenseController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';

// --- Rate Limit ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------------------
// 1) PUBLIC DASHBOARD FILES
// ---------------------------
app.use('/admin-dashboard', express.static(path.join(__dirname, 'dashboard')));

// ---------------------------
// 2) ADMIN API PROTECTION
// ---------------------------
function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// ---------------------------
// 3) LICENSE API PROTECTED
// ---------------------------
app.use('/admin-api/license', requireAdmin, licenseRoutes);

// ---------------------------
// 4) NORMAL PUBLIC APIs
// ---------------------------
app.use('/license', licenseRoutes); // License check (public)
app.use('/api/improve-notes', improveRoutes);
app.use('/api/emergency-help', emergencyRoutes);

// ---------------------------
// 5) HEALTH CHECK
// ---------------------------
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Transcriptor backend running',
    endpoints: [
      '/license/check',
      '/api/improve-notes',
      '/api/emergency-help'
    ]
  });
});

// ---------------------------
// LOAD LICENSES ON START
// ---------------------------
loadLicenses();

// ---------------------------
// START SERVER
// ---------------------------
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
