/* PhishGuard AI — Navigation — showPanel, panelMeta, role routing
   navigation.js */

// ═══════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════
const panelMeta = {
  welcome:   ['Welcome',         '// visitor: limited access — create an account for full features'],
  quickscan: ['Quick URL Scan',  '// visitor: check any URL for phishing — no login required'],
  dashboard: ['Dashboard',       '// threat overview & recent activity'],
  analyse:   ['Analyse',         '// submit email or URL for analysis'],
  history:   ['History',         '// all past analyses and results'],
  users:     ['User Management', '// admin: manage all system users'],
  analytics: ['Analytics',       '// model performance & system metrics'],
  auditlog:  ['Audit Log',       '// admin: all system events and actions'],
  settings:  ['Settings',        '// profile and system configuration'],
  about:     ['About',           '// system information & tech stack'],
};

function showPanel(name) {
  const role = currentUser ? currentUser.role : 'visitor';

  // Define what each role can see
  const visitorAllowed  = ['welcome','quickscan','about'];
  const userAllowed     = ['dashboard','analyse','history','settings','about'];
  const adminAllowed    = ['dashboard','analyse','history','users','analytics','auditlog','settings','about'];

  let allowed;
  if (role === 'visitor') allowed = visitorAllowed;
  else if (role === 'user') allowed = userAllowed;
  else allowed = adminAllowed;

  if (!allowed.includes(name)) {
    if (role === 'visitor') {
      showToast('Create a free account to access this feature.', 'info');
    } else {
      showToast('Access restricted.', 'error');
    }
    return;
  }

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + name);
  if (!panel) return;
  panel.classList.add('active');

  // Update active nav state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = {
    welcome:'nav-welcome', quickscan:'nav-quickscan',
    dashboard:'nav-dashboard', analyse:'nav-analyse', history:'nav-history',
    users:'nav-users', analytics:'nav-analytics', auditlog:'nav-auditlog',
    settings:'nav-settings', about:'nav-about'
  };
  const navEl = document.getElementById(navMap[name]);
  if (navEl) navEl.classList.add('active');

  const meta = panelMeta[name];
  if (meta) {
    document.getElementById('page-title').textContent = meta[0];
    document.getElementById('page-sub').textContent   = meta[1];
  }

  if (name === 'dashboard') refreshDashboard();
  if (name === 'history')   renderHistory();
  if (name === 'analytics') renderAnalytics();
  if (name === 'users')     { renderUsersTable(); filterUsers(); }
  if (name === 'auditlog')  renderAuditLog();
}
