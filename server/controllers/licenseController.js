import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'licenses.json');

let licenses = [];

export function loadLicenses() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.ensureFileSync(DATA_PATH);
      fs.writeJsonSync(DATA_PATH, []);
    }
    licenses = fs.readJsonSync(DATA_PATH);
  } catch (error) {
    console.error('Failed to load licenses', error);
    licenses = [];
  }
}

function persistLicenses() {
  try {
    fs.writeJsonSync(DATA_PATH, licenses, { spaces: 2 });
  } catch (error) {
    console.error('Failed to persist licenses', error);
  }
}

export function validateLicense(key) {
  const now = new Date();
  const license = licenses.find((l) => l.key === key);
  if (!license) {
    return { valid: false, message: 'Lizenzschlüssel nicht gefunden.' };
  }

  const expires = new Date(license.expires);
  if (Number.isNaN(expires.getTime()) || expires < now) {
    return { valid: false, message: 'Lizenz ist abgelaufen.' };
  }

  if (license.used === true) {
    return { valid: false, message: 'Lizenz wurde bereits verwendet.' };
  }

  if (license.maxRequests && license.requestsMade >= license.maxRequests) {
    return { valid: false, message: 'Anfragelimit erreicht.' };
  }

  return { valid: true, license };
}

export function incrementUsage(license) {
  license.requestsMade = (license.requestsMade || 0) + 1;
  persistLicenses();
}

export function markUsed(license) {
  license.used = true;
  persistLicenses();
}

export function remainingRequests(license) {
  if (!license.maxRequests) return Infinity;
  return Math.max(license.maxRequests - (license.requestsMade || 0), 0);
}

export function addLicense({ key, expires, maxRequests = 1000 }) {
  licenses.push({ key, expires, used: false, maxRequests, requestsMade: 0 });
  persistLicenses();
  return licenses[licenses.length - 1];
}

export function removeLicense(key) {
  const before = licenses.length;
  licenses = licenses.filter((l) => l.key !== key);
  if (licenses.length !== before) {
    persistLicenses();
    return true;
  }
  return false;
}

export function getLicenses() {
  return licenses;
}

export function resetData(newLicenses) {
  licenses = newLicenses;
  persistLicenses();
}
