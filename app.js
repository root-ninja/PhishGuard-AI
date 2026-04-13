/* PhishGuard AI — App Init — users, auth UI, session restore
   app.js */

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
initUsers();
initAuthUI();

if (restoreSession()) {
  loadApp();
} else {
  applyInitialAuthView();
  const bootMessage = consumeAuthBootMessage();
  if (bootMessage) {
    showLogin(bootMessage, 'info');
  }
}


function renderAuditLog() {
  const log = getAuditLog();
  const el  = document.getElementById('audit-log-list');
  const emp = document.getElementById('audit-empty');
  if (log.length === 0) { emp.style.display = 'block'; el.innerHTML = ''; return; }
  emp.style.display = 'none';
  el.innerHTML = log.map(e => `
    <div class="log-entry">
      <div class="log-dot" style="background:${e.color}"></div>
      <div class="log-time">${e.time}</div>
      <div class="log-user">${e.user}</div>
      <div class="log-action"><strong style="color:${e.color}">${e.action}</strong>${e.target ? ' — ' + e.target : ''}</div>
    </div>`).join('');
}

function clearAuditLog() {
  saveAuditLog([]);
  renderAuditLog();
  showToast('Audit log cleared.', 'info');
}
