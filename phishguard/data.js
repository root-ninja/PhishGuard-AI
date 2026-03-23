/* PhishGuard AI — Data Store — localStorage keys, getters, setters
   data.js */

// ═══════════════════════════════════════════════
//  DATA STORE
// ═══════════════════════════════════════════════
const USERS_KEY = 'phishguard_users';
const HISTORY_KEY = 'phishguard_history';
const SETTINGS_KEY = 'phishguard_settings';
let currentUser = null;
let currentTab = 'email';
let historyData = [];

// Default users
function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([
      { name:'Admin User',   email:'admin@phishguard.ai', pass:'admin123', role:'admin', joined: new Date().toLocaleDateString() },
      { name:'Standard User',email:'user@demo.com',       pass:'demo123',  role:'user',  joined: new Date().toLocaleDateString() }
    ]));
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

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
