/* PhishGuard AI — App Load — loadApp function
   loadapp.js */

// ═══════════════════════════════════════════════
//  APP LOAD
// ═══════════════════════════════════════════════
function loadApp() {
  document.getElementById('signin-page').style.display = 'none';
  document.getElementById('register-page').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Set user info in sidebar
  document.getElementById('user-name-display').textContent = currentUser.name;
  document.getElementById('user-avatar').textContent = currentUser.name[0].toUpperCase();
  const roleLabel = document.getElementById('role-label');
  const roleDot   = document.getElementById('role-dot');
  if (roleLabel) roleLabel.textContent = currentUser.role;
  if (roleDot) {
    roleDot.style.background = currentUser.role === 'admin' ? 'var(--accent)'
                             : currentUser.role === 'user'  ? 'var(--yellow)'
                             : 'var(--green)';
  }

  // Load settings (skip for visitors — they can't access settings)
  if (currentUser.role !== 'visitor') {
    const s = getSettings();
    if (s.thresh) document.getElementById('set-thresh').value = s.thresh;
    if (s.rate)   document.getElementById('set-rate').value = s.rate;
    if (s.alerts  !== undefined) document.getElementById('tog-alerts').checked    = s.alerts;
    if (s.phishtank!==undefined) document.getElementById('tog-phishtank').checked = s.phishtank;
    if (s.gsb     !==undefined) document.getElementById('tog-gsb').checked        = s.gsb;
    if (s.retrain !== undefined) document.getElementById('tog-retrain').checked   = s.retrain;
    if (s.log     !== undefined) document.getElementById('tog-log').checked       = s.log;
    document.getElementById('set-name').value  = currentUser.name;
    document.getElementById('set-email').value = currentUser.email;
    document.getElementById('set-role').value  = currentUser.role;
  }

  historyData = getHistory();

  // Show correct nav section for role
  document.getElementById('nav-visitor-section').style.display = 'none';
  document.getElementById('nav-user-section').style.display    = 'none';
  document.getElementById('nav-admin-section').style.display   = 'none';

  const role = currentUser.role;
  if (role === 'visitor') {
    document.getElementById('nav-visitor-section').style.display = 'block';
    showPanel('welcome');
  } else if (role === 'user') {
    document.getElementById('nav-user-section').style.display = 'block';
    showPanel('dashboard');
  } else if (role === 'admin') {
    document.getElementById('nav-admin-section').style.display = 'block';
    showPanel('dashboard');
  }

  // Add joined date if missing (skip for visitors)
  if (currentUser.role !== 'visitor') {
    const users = getUsers();
    const idx = users.findIndex(u => u.email === currentUser.email);
    if (idx >= 0 && !users[idx].joined) {
      users[idx].joined = new Date().toLocaleDateString();
      saveUsers(users);
    }
  }

  if (currentUser.role !== 'visitor') {
    logAction('LOGIN', currentUser.email);
  }
  refreshDashboard();
  renderHistory();
  renderAnalytics();
}
