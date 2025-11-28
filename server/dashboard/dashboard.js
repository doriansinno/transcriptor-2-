const passwordInput = document.getElementById('password');
const savePasswordBtn = document.getElementById('savePassword');
const createBtn = document.getElementById('createBtn');
const refreshBtn = document.getElementById('refreshBtn');
const tableBody = document.getElementById('licenseTable');
const keyInput = document.getElementById('key');
const expiresInput = document.getElementById('expires');
const maxRequestsInput = document.getElementById('maxRequests');

function getAuthHeaders() {
  const token = localStorage.getItem('adminToken') || '';
  return { Authorization: `Bearer ${token}` };
}

function setStatus(row, license) {
  const now = new Date();
  const expires = new Date(license.expires);
  let status = '<span class="badge valid">aktiv</span>';
  if (license.used) status = '<span class="badge used">verwendet</span>';
  if (expires < now || Number.isNaN(expires.getTime())) status = '<span class="badge expired">abgelaufen</span>';
  if (license.maxRequests && license.requestsMade >= license.maxRequests) status = '<span class="badge limit">Limit</span>';
  row.querySelector('.status').innerHTML = status;
}

async function fetchLicenses() {
  tableBody.innerHTML = '<tr><td colspan="5">Lade...</td></tr>';
  try {
    const res = await fetch('/license/list', { headers: getAuthHeaders() });
    if (res.status === 401) {
      tableBody.innerHTML = '<tr><td colspan="5">Unauthorized – Passwort prüfen.</td></tr>';
      return;
    }
    const data = await res.json();
    renderLicenses(data.licenses || []);
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5">Fehler: ${error.message}</td></tr>`;
  }
}

function renderLicenses(licenses) {
  if (!licenses.length) {
    tableBody.innerHTML = '<tr><td colspan="5">Keine Lizenzen vorhanden.</td></tr>';
    return;
  }

  tableBody.innerHTML = '';
  licenses.forEach((license) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${license.key}</td>
      <td>${license.expires}</td>
      <td>${license.requestsMade || 0}/${license.maxRequests || '∞'}</td>
      <td class="status"></td>
      <td><button class="action-btn" data-key="${license.key}">Löschen</button></td>
    `;
    setStatus(row, license);
    row.querySelector('button').addEventListener('click', () => deleteLicense(license.key));
    tableBody.appendChild(row);
  });
}

async function createLicense() {
  const key = keyInput.value.trim();
  const expires = expiresInput.value;
  const maxRequests = Number(maxRequestsInput.value) || 1000;
  if (!key || !expires) {
    alert('Key und Ablaufdatum sind Pflicht.');
    return;
  }

  const res = await fetch('/license/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ key, expires, maxRequests })
  });

  if (!res.ok) {
    const text = await res.text();
    alert(`Fehler: ${text}`);
    return;
  }

  keyInput.value = '';
  expiresInput.value = '';
  maxRequestsInput.value = '1000';
  fetchLicenses();
}

async function deleteLicense(key) {
  if (!confirm('Lizenz wirklich löschen?')) return;
  const res = await fetch('/license/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ key })
  });

  if (!res.ok) {
    const text = await res.text();
    alert(`Fehler: ${text}`);
    return;
  }

  fetchLicenses();
}

savePasswordBtn.addEventListener('click', () => {
  const value = passwordInput.value.trim();
  if (!value) return alert('Passwort darf nicht leer sein.');
  localStorage.setItem('adminToken', value);
  fetchLicenses();
});

createBtn.addEventListener('click', createLicense);
refreshBtn.addEventListener('click', fetchLicenses);

fetchLicenses();
