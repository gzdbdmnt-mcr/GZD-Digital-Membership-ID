// ===== Configuration =====
// Paste the "Publish to web" CSV URL of your Google Sheet here.
// File > Share > Publish to web > select the members sheet/tab > CSV > Publish.
const CONFIG = {
  sheetCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSg_yHJWaLTudlypnbhqZvpvNbtAwBnVc34Zo3EVnJBXz3HD2uv1rdbCSsYKFt3KAYJ4B9f5q_FZmIi/pub?output=csv',
  clubName: 'GZD Badminton Club',
  clubSiteUrl: 'https://gzdbadminton.club',
  logoUrl: 'https://gzdbadminton.club/assets/images/club-badge.png',
};

// Expected sheet columns (header row, any order):
// MemberID, FullName, PhotoURL, Tier, JoinDate, ExpiryDate, Status

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  const header = rows.shift().map(h => h.trim());
  return rows.filter(r => r.some(v => v.trim() !== '')).map(r => {
    const obj = {};
    header.forEach((h, idx) => { obj[h] = (r[idx] || '').trim(); });
    return obj;
  });
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function isMemberActive(member) {
  const status = (member.Status || '').trim().toLowerCase();
  if (status && status !== 'active') return false;
  const expiry = parseDate(member.ExpiryDate);
  if (expiry) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiry < today) return false;
  }
  return true;
}

function formatDate(str) {
  const d = parseDate(str);
  if (!d) return str || '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function fetchMembers() {
  if (!CONFIG.sheetCsvUrl || CONFIG.sheetCsvUrl.includes('PASTE_YOUR')) {
    throw new Error('CONFIG.sheetCsvUrl is not set yet. See README.md.');
  }
  const res = await fetch(CONFIG.sheetCsvUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load member data (HTTP ' + res.status + ').');
  const text = await res.text();
  return parseCSV(text);
}

function renderCard(member) {
  const active = isMemberActive(member);
  const photo = member.PhotoURL
    ? `<img src="${member.PhotoURL}" alt="${member.FullName}" class="card-photo">`
    : `<div class="card-photo card-photo-placeholder">${(member.FullName || '?').trim().charAt(0).toUpperCase()}</div>`;

  return `
    <div class="id-card ${active ? 'is-active' : 'is-inactive'}">
      <div class="id-card-head">
        <img src="${CONFIG.logoUrl}" alt="${CONFIG.clubName}" class="id-card-logo">
        <span class="id-card-brand">${CONFIG.clubName}</span>
      </div>
      ${photo}
      <h2 class="id-card-name">${member.FullName || 'Unknown Member'}</h2>
      <p class="id-card-id">ID: ${member.MemberID || '—'}</p>
      ${member.Tier ? `<span class="id-card-tier">${member.Tier}</span>` : ''}
      <div class="id-card-status ${active ? 'status-active' : 'status-inactive'}">
        ${active ? '✓ ACTIVE MEMBER' : '✕ NOT ACTIVE'}
      </div>
      <div class="id-card-meta">
        <div><span>Member since</span><strong>${formatDate(member.JoinDate)}</strong></div>
        <div><span>Valid until</span><strong>${formatDate(member.ExpiryDate)}</strong></div>
      </div>
      <p class="id-card-note">Sponsors &amp; partners: this card is only valid while status reads ACTIVE MEMBER. Verify at <strong>${new URL(CONFIG.clubSiteUrl).hostname}</strong>.</p>
    </div>
  `;
}

function renderError(message) {
  return `<div class="id-error"><p>${message}</p></div>`;
}

async function showMember(id) {
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '<p class="loading">Looking up member…</p>';
  try {
    const members = await fetchMembers();
    const match = members.find(
      m => (m.MemberID || '').toLowerCase() === id.toLowerCase()
    );
    if (!match) {
      resultEl.innerHTML = renderError(`No member found with ID "${id}". Double-check the ID and try again.`);
      return;
    }
    resultEl.innerHTML = renderCard(match);
  } catch (err) {
    resultEl.innerHTML = renderError(err.message || 'Something went wrong loading member data.');
  }
}

function init() {
  const form = document.getElementById('lookup-form');
  const input = document.getElementById('member-id-input');
  const params = new URLSearchParams(window.location.search);
  const idFromUrl = params.get('id');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const id = input.value.trim();
    if (!id) return;
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.replaceState({}, '', url);
    showMember(id);
  });

  if (idFromUrl) {
    input.value = idFromUrl;
    showMember(idFromUrl);
  }
}

document.addEventListener('DOMContentLoaded', init);
