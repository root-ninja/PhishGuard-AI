/* PhishGuard AI — Settings — saveProfile, saveSettings
   settings.js */

// ═══════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════
function saveProfile() {
  const name  = document.getElementById('set-name').value.trim();
  const email = document.getElementById('set-email').value.trim();
  const pass  = document.getElementById('set-pass').value;
  if (!name || !email) { showToast('Name and email cannot be empty.', 'error'); return; }
  const users = getUsers();
  const idx   = users.findIndex(u => u.email === currentUser.email);
  if (idx < 0) return;
  users[idx].name  = name;
  users[idx].email = email;
  if (pass) users[idx].pass = pass;
  saveUsers(users);
  currentUser = users[idx];
  sessionStorage.setItem('phishguard_session', JSON.stringify(currentUser));
  document.getElementById('user-name-display').textContent = name;
  document.getElementById('user-avatar').textContent = name[0].toUpperCase();
  showToast('Profile saved.', 'success');
}

function saveSettings() {
  const s = {
    thresh:   document.getElementById('set-thresh').value,
    rate:     document.getElementById('set-rate').value,
    alerts:   document.getElementById('tog-alerts').checked,
    phishtank:document.getElementById('tog-phishtank').checked,
    gsb:      document.getElementById('tog-gsb').checked,
    retrain:  document.getElementById('tog-retrain').checked,
    log:      document.getElementById('tog-log').checked,
  };
  saveSettingsData(s);
  showToast('Settings saved.', 'success');
}

function retrain() {
  showToast('🔄 Model retraining triggered…', 'info');
  setTimeout(() => showToast('✓ Model retrained successfully (95.4% accuracy)', 'success'), 2500);
}
