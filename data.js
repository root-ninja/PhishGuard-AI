/* PhishGuard AI — Data Store — localStorage keys, getters, setters
   data.js */

// ═══════════════════════════════════════════════
//  DATA STORE
// ═══════════════════════════════════════════════
const USERS_KEY = 'phishguard_users';
const HISTORY_KEY = 'phishguard_history';
const SETTINGS_KEY = 'phishguard_settings';
const SESSION_KEY = 'phishguard_session';
let currentUser = null;
let currentTab = 'email';
let historyData = [];

// Default users
function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([
      { name:'Admin User',   email:'admin@phishguard.ai', pass:'admin123', role:'admin', joined: new Date().toLocaleDateString(), banned: false },
      { name:'Standard User',email:'user@demo.com',       pass:'demo123',  role:'user',  joined: new Date().toLocaleDateString(), banned: false }
    ]));
  }
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
  };
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
