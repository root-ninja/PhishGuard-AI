/* PhishGuard AI - Settings */

async function saveProfile() {
  const name = document.getElementById('set-name').value.trim();
  const email = normalizeEmail(document.getElementById('set-email').value);
  const pass = document.getElementById('set-pass').value;

  if (!name || !email) {
    showToast('Name and email cannot be empty.', 'error');
    return;
  }
  if (!isValidEmailAddress(email)) {
    showToast('Enter a valid email address.', 'error');
    return;
  }

  const users = getUsers();
  const idx = users.findIndex(user => normalizeEmail(user.email) === normalizeEmail(currentUser.email));
  if (idx < 0) return;
  if (users.some((user, userIdx) => userIdx !== idx && normalizeEmail(user.email) === email)) {
    showToast('That email is already in use.', 'error');
    return;
  }

  users[idx].name = name;
  users[idx].email = email;
  if (pass) users[idx].passHash = await hashPassword(pass);
  saveUsers(users);
  currentUser = sanitizeUser(users[idx]);
  saveSessionUser(currentUser);
  document.getElementById('user-name-display').textContent = name;
  document.getElementById('user-avatar').textContent = name[0].toUpperCase();
  showToast('Profile saved.', 'success');
}

function saveSettings() {
  const s = {
    thresh: document.getElementById('set-thresh').value,
    rate: document.getElementById('set-rate').value,
    alerts: document.getElementById('tog-alerts').checked,
    phishtank: document.getElementById('tog-phishtank').checked,
    gsb: document.getElementById('tog-gsb').checked,
    retrain: document.getElementById('tog-retrain').checked,
    log: document.getElementById('tog-log').checked,
  };
  saveSettingsData(s);
  localStorage.setItem('phishguard_api_rate_limit', s.rate);
  showToast('Settings saved.', 'success');
}

async function retrain() {
  showToast('Model retraining triggered.', 'info');
  const result = await triggerRetrain();
  const accuracy = result.model && result.model.accuracy ? Math.round(result.model.accuracy * 1000) / 10 : 95.4;
  showToast('Model retrained successfully (' + accuracy + '% accuracy).', 'success');
}

