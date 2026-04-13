/* PhishGuard AI — Audit Log — logAction, getAuditLog, saveAuditLog
   audit.js */

// ═══════════════════════════════════════════════
//  AUDIT LOG
// ═══════════════════════════════════════════════
const AUDIT_KEY = 'phishguard_audit';

function getAuditLog() { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); }
function saveAuditLog(l) { localStorage.setItem(AUDIT_KEY, JSON.stringify(l)); }

function logAction(action, target) {
  const log = getAuditLog();
  log.unshift({
    time: new Date().toLocaleString(),
    user: currentUser ? currentUser.email : 'system',
    action,
    target: target || '',
    color: action.includes('DELETE') || action.includes('BAN') ? '#ff3d5a'
         : action.includes('ADD') || action.includes('CREATE') ? '#00ff88'
         : action.includes('EDIT') || action.includes('ROLE') || action.includes('UNBAN') ? '#ffcc00'
         : '#00e5ff'
  });
  saveAuditLog(log.slice(0, 200));
}
