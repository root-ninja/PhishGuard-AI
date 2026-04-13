/* PhishGuard AI — User Management — CRUD, ban, promote, modals
   users.js */

// ═══════════════════════════════════════════════
//  USER MANAGEMENT
// ═══════════════════════════════════════════════
let editingEmail = null;
let deletingEmail = null;

function renderUserStats() {
  const users = getUsers();
  document.getElementById('um-total').textContent   = users.length;
  document.getElementById('um-admins').textContent  = users.filter(u => u.role === 'admin').length;
  document.getElementById('um-regular').textContent = users.filter(u => u.role === 'user').length;
  document.getElementById('um-banned').textContent  = users.filter(u => u.banned).length;
}

function renderUsersTable(list) {
  const tbody = document.getElementById('users-tbody');
  const empty = document.getElementById('users-empty');
  const users = list || getUsers();
  renderUserStats();
  if (users.length === 0) { tbody.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display = 'none';
  const h = getHistory();
  tbody.innerHTML = users.map((u, i) => {
    const analyses = h.filter(x => x.userEmail === u.email).length;
    const isSelf   = currentUser && normalizeEmail(u.email) === normalizeEmail(currentUser.email);
    const joined   = u.joined || 'N/A';
    return `<tr>
      <td style="padding:12px 20px;color:var(--muted);font-family:'JetBrains Mono',monospace">${i+1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--accent2),var(--accent));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#000;flex-shrink:0">${u.name[0].toUpperCase()}</div>
          <div>
            <div style="font-size:13px;font-weight:600">${u.name}${isSelf ? " (you)" : ""}</div>
          </div>
        </div>
      </td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted)">${u.email}</td>
      <td><span class="role-${u.role}">${u.role.toUpperCase()}</span></td>
      <td><span class="${u.banned ? 'status-banned' : 'status-active'}">${u.banned ? 'BANNED' : 'ACTIVE'}</span></td>
      <td style="font-family:'Space Mono',monospace;font-size:12px;color:var(--muted)">${analyses}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted)">${joined}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button onclick="openEditUser('${u.email}')" title="Edit" style="background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.2);border-radius:6px;color:var(--accent);cursor:pointer;padding:5px 10px;font-size:12px;transition:all 0.15s" onmouseover="this.style.background='rgba(0,229,255,0.18)'" onmouseout="this.style.background='rgba(0,229,255,0.08)'">✎ Edit</button>
          ${!isSelf ? `<button onclick="toggleBan('${u.email}')" title="${u.banned?'Unban':'Ban'}" style="background:rgba(255,204,0,0.08);border:1px solid rgba(255,204,0,0.2);border-radius:6px;color:var(--yellow);cursor:pointer;padding:5px 10px;font-size:12px;transition:all 0.15s" onmouseover="this.style.background='rgba(255,204,0,0.18)'" onmouseout="this.style.background='rgba(255,204,0,0.08)'">${u.banned ? '✓ Unban' : '⊘ Ban'}</button>` : ''}
          ${!isSelf ? `<button onclick="openDeleteUser('${u.email}')" title="Delete" style="background:rgba(255,61,90,0.08);border:1px solid rgba(255,61,90,0.2);border-radius:6px;color:var(--red);cursor:pointer;padding:5px 10px;font-size:12px;transition:all 0.15s" onmouseover="this.style.background='rgba(255,61,90,0.18)'" onmouseout="this.style.background='rgba(255,61,90,0.08)'">✕ Del</button>` : ''}
          ${!isSelf ? `<button onclick="promoteUser('${u.email}')" title="Toggle Role" style="background:rgba(107,128,153,0.08);border:1px solid var(--border);border-radius:6px;color:var(--muted);cursor:pointer;padding:5px 10px;font-size:12px;transition:all 0.15s" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">${u.role==='admin'?'↓ Demote':'↑ Promote'}</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterUsers() {
  const q      = document.getElementById('user-search').value.toLowerCase();
  const role   = document.getElementById('user-role-filter').value;
  const status = document.getElementById('user-status-filter').value;
  const users  = getUsers().filter(u =>
    (!q      || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (!role   || u.role === role) &&
    (!status || (status==='banned' ? u.banned : !u.banned))
  );
  renderUsersTable(users);
}

// ── ADD USER ──
function openAddUser() {
  editingEmail = null;
  document.getElementById('modal-title').textContent = '👤 Add New User';
  document.getElementById('modal-name').value  = '';
  document.getElementById('modal-email').value = '';
  document.getElementById('modal-pass').value  = '';
  document.getElementById('modal-role').value  = 'user';
  document.getElementById('modal-err').style.display = 'none';
  document.getElementById('modal-pass').placeholder = 'Password (required)';
  document.getElementById('user-modal').classList.add('open');
}

// ── EDIT USER ──
function openEditUser(email) {
  const u = findUserByEmail(email);
  if (!u) return;
  editingEmail = normalizeEmail(email);
  document.getElementById('modal-title').textContent = '✎ Edit User';
  document.getElementById('modal-name').value  = u.name;
  document.getElementById('modal-email').value = u.email;
  document.getElementById('modal-pass').value  = '';
  document.getElementById('modal-role').value  = u.role;
  document.getElementById('modal-err').style.display = 'none';
  document.getElementById('modal-pass').placeholder = 'Leave blank to keep current password';
  document.getElementById('user-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('user-modal').classList.remove('open');
  editingEmail = null;
}

function saveUserModal() {
  const name  = document.getElementById('modal-name').value.trim();
  const email = normalizeEmail(document.getElementById('modal-email').value);
  const pass  = document.getElementById('modal-pass').value;
  const role  = document.getElementById('modal-role').value;
  const errEl = document.getElementById('modal-err');
  errEl.style.display = 'none';

  if (!name || !email) { errEl.textContent = 'Name and email are required.'; errEl.style.display='block'; return; }
  if (!isValidEmailAddress(email)) { errEl.textContent = 'Enter a valid email address.'; errEl.style.display='block'; return; }

  const users = getUsers();

  if (editingEmail) {
    // Edit existing
    const idx = users.findIndex(u => normalizeEmail(u.email) === normalizeEmail(editingEmail));
    if (idx < 0) return;
    // Check email not taken by someone else
    if (email !== normalizeEmail(editingEmail) && users.find(u => normalizeEmail(u.email) === email)) {
      errEl.textContent = 'That email is already in use.'; errEl.style.display='block'; return;
    }
    users[idx].name  = name;
    users[idx].email = email;
    users[idx].role  = role;
    if (pass) users[idx].pass = pass;
    // Update session if editing self
    if (normalizeEmail(editingEmail) === normalizeEmail(currentUser.email)) {
      currentUser = sanitizeUser(users[idx]);
      saveSessionUser(currentUser);
      document.getElementById('user-name-display').textContent = name;
      document.getElementById('user-avatar').textContent = name[0].toUpperCase();
    }
    saveUsers(users);
    logAction('EDIT USER', name + ' (' + email + ')');
    showToast('User updated.', 'success');
  } else {
    // Add new
    if (!pass || pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display='block'; return; }
    if (users.find(u => normalizeEmail(u.email) === email)) { errEl.textContent = 'Email already exists.'; errEl.style.display='block'; return; }
    users.push({ name, email, pass, role, joined: new Date().toLocaleDateString(), banned: false });
    saveUsers(users);
    logAction('ADD USER', name + ' (' + email + ')');
    showToast('User added successfully.', 'success');
  }

  closeModal();
  renderUsersTable();
  filterUsers();
}

// ── DELETE ──
function openDeleteUser(email) {
  const u = findUserByEmail(email);
  if (!u) return;
  deletingEmail = normalizeEmail(email);
  document.getElementById('delete-name').textContent = u.name + ' (' + email + ')';
  document.getElementById('delete-modal').classList.add('open');
}
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
  deletingEmail = null;
}
function confirmDelete() {
  if (!deletingEmail) return;
  const users = getUsers();
  const u = users.find(x => normalizeEmail(x.email) === normalizeEmail(deletingEmail));
  const filtered = users.filter(x => normalizeEmail(x.email) !== normalizeEmail(deletingEmail));
  saveUsers(filtered);
  logAction('DELETE USER', u ? u.name + ' (' + deletingEmail + ')' : deletingEmail);
  showToast('User deleted.', 'info');
  closeDeleteModal();
  renderUsersTable();
  filterUsers();
}

// ── BAN / UNBAN ──
function toggleBan(email) {
  const users = getUsers();
  const idx = users.findIndex(u => normalizeEmail(u.email) === normalizeEmail(email));
  if (idx < 0) return;
  users[idx].banned = !users[idx].banned;
  saveUsers(users);
  logAction(users[idx].banned ? 'BAN USER' : 'UNBAN USER', users[idx].name + ' (' + email + ')');
  showToast(users[idx].banned ? 'User banned.' : 'User unbanned.', users[idx].banned ? 'error' : 'success');
  renderUsersTable();
  filterUsers();
}

// ── PROMOTE / DEMOTE ──
function promoteUser(email) {
  const users = getUsers();
  const idx = users.findIndex(u => normalizeEmail(u.email) === normalizeEmail(email));
  if (idx < 0) return;
  const prev = users[idx].role;
  users[idx].role = prev === 'admin' ? 'user' : 'admin';
  saveUsers(users);
  logAction('ROLE CHANGE', users[idx].name + ': ' + prev + ' → ' + users[idx].role);
  showToast('Role updated to ' + users[idx].role + '.', 'success');
  renderUsersTable();
  filterUsers();
}

// Close modals on overlay click
document.getElementById('user-modal').addEventListener('click', function(e){ if(e.target===this) closeModal(); });
document.getElementById('delete-modal').addEventListener('click', function(e){ if(e.target===this) closeDeleteModal(); });
