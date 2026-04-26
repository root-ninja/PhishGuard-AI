/* PhishGuard AI — Data Store — localStorage keys, getters, setters
   data.js */

// ═══════════════════════════════════════════════
//  DATA STORE
// ═══════════════════════════════════════════════
const USERS_KEY = 'phishguard_users';
const HISTORY_KEY = 'phishguard_history';
const SETTINGS_KEY = 'phishguard_settings';
const SESSION_KEY = 'phishguard_session';
const FEEDBACK_KEY = 'phishguard_feedback';
const DOMAINS_KEY = 'phishguard_domain_lists';
let currentUser = null;
let currentTab = 'email';
let historyData = [];

// Default users
function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([
      { name:'Admin User', email:'admin@phishguard.ai', passHash:'240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role:'admin', joined: new Date().toLocaleDateString(), banned: false, demo: true },
      { name:'Standard User', email:'user@demo.com', passHash:'d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', role:'user', joined: new Date().toLocaleDateString(), banned: false, demo: true }
    ]));
  }
  migratePlaintextPasswords();
  initDomainLists();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    name: user.name,
    email: normalizeEmail(user.email),
    role: user.role,
    joined: user.joined || '',
    banned: !!user.banned,
    uid: user.uid || '',
    demo: !!user.demo,
  };
}

async function hashPassword(password) {
  const value = String(password || '');
  if (window.crypto && window.crypto.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return 'fallback-' + Math.abs(hash);
}

function migratePlaintextPasswords() {
  const users = getUsers();
  let changed = false;
  users.forEach(user => {
    if (user.pass && !user.passHash) {
      if (user.pass === 'admin123') user.passHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
      else if (user.pass === 'demo123') user.passHash = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791';
      delete user.pass;
      changed = true;
    }
  });
  if (changed) saveUsers(users);
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}
function saveUsers(u) {
  const normalizedUsers = (u || []).map(user => ({
    ...user,
    email: normalizeEmail(user.email),
    banned: !!user.banned,
  }));
  normalizedUsers.forEach(user => { delete user.pass; });
  localStorage.setItem(USERS_KEY, JSON.stringify(normalizedUsers));
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return getUsers().find(user => normalizeEmail(user.email) === normalized) || null;
}

function getSessionUser() {
  try {
    return sanitizeUser(JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'));
  } catch (error) {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSessionUser(user) {
  if (!user) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sanitizeUser(user)));
}

function clearSessionUser() {
  sessionStorage.removeItem(SESSION_KEY);
}

function getHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}
function saveHistory(h) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  historyData = h;
}

function getSettings() {
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
}
function saveSettingsData(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

function getFeedback() {
  return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
}
function saveFeedback(items) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify((items || []).slice(0, 200)));
}

function initDomainLists() {
  if (!localStorage.getItem(DOMAINS_KEY)) {
    saveDomainLists({
      blacklist: ['paypa1-secure.login-verify.com', 'account-verify.example'],
      whitelist: ['google.com', 'microsoft.com', 'apple.com', 'github.com'],
    });
  }
}
function getDomainLists() {
  const data = JSON.parse(localStorage.getItem(DOMAINS_KEY) || '{}');
  return {
    blacklist: data.blacklist || data.domain_blacklist || [],
    whitelist: data.whitelist || data.domain_whitelist || [],
  };
}
function saveDomainLists(data) {
  localStorage.setItem(DOMAINS_KEY, JSON.stringify({
    blacklist: data.blacklist || data.domain_blacklist || [],
    whitelist: data.whitelist || data.domain_whitelist || [],
  }));
}
