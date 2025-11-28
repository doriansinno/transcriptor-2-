import { Router } from 'express';
import {
  validateLicense,
  incrementUsage,
  remainingRequests,
  addLicense,
  removeLicense,
  getLicenses
} from '../controllers/licenseController.js';

const router = Router();

function requireAdmin(req, res, next) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

router.post('/check', (req, res) => {
  const { key } = req.body || {};
  if (!key) {
    return res.status(400).json({ valid: false, message: 'Lizenzschlüssel fehlt.' });
  }

  const validation = validateLicense(key);
  if (!validation.valid) {
    return res.status(401).json({ valid: false, message: validation.message });
  }

  incrementUsage(validation.license);
  return res.json({
    valid: true,
    message: 'Lizenz gültig.',
    expires: validation.license.expires,
    remainingRequests: remainingRequests(validation.license)
  });
});

router.post('/create', requireAdmin, (req, res) => {
  const { key, expires, maxRequests } = req.body || {};
  if (!key || !expires) {
    return res.status(400).json({ message: 'Key und Ablaufdatum sind erforderlich.' });
  }
  const license = addLicense({ key, expires, maxRequests: Number(maxRequests) || 1000 });
  return res.json({ message: 'Lizenz erstellt.', license });
});

router.post('/delete', requireAdmin, (req, res) => {
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ message: 'Key erforderlich.' });
  const removed = removeLicense(key);
  if (!removed) return res.status(404).json({ message: 'Lizenz nicht gefunden.' });
  return res.json({ message: 'Lizenz gelöscht.' });
});

router.get('/list', requireAdmin, (_req, res) => {
  return res.json({ licenses: getLicenses() });
});

export default router;
