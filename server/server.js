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

app.use('/license', licenseRoutes);
app.use('/api/improve-notes', improveRoutes);
app.use('/api/emergency-help', emergencyRoutes);

app.use('/admin-dashboard', (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).send('Unauthorized');
  }
  next();
});

app.use('/admin-dashboard', express.static(path.join(__dirname, 'dashboard')));

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Transcriptor backend running',
    endpoints: ['/license/check', '/api/improve-notes', '/api/emergency-help']
  });
});

loadLicenses();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
