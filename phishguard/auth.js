/* PhishGuard AI — Auth — doLogin, doRegister, doLogout, enterAsVisitor
   auth.js */

// ═══════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-error');
  err.style.display = 'none';

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.pass === pass);
  if (!user) {
    err.style.display = 'block';
    return;
  }
  currentUser = user;
  sessionStorage.setItem('phishguard_session', JSON.stringify(user));
  loadApp();
}

function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const err   = document.getElementById('reg-error');
  err.style.display = 'none';

  if (!name || !email || !pass) {
    err.textContent = '⚠ All fields are required.';
    err.style.display = 'block'; return;
  }
  if (pass.length < 6) {
    err.textContent = '⚠ Password must be at least 6 characters.';
    err.style.display = 'block'; return;
  }
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    err.textContent = '⚠ An account with this email already exists.';
    err.style.display = 'block'; return;
  }
  users.push({ name, email, pass, role: 'user', joined: new Date().toLocaleDateString(), banned: false });
  saveUsers(users);
  showToast('Account created! Please sign in.', 'success');
  showLogin();
}

function doLogout() {
  if (currentUser && currentUser.role !== 'visitor') {
    logAction('LOGOUT', currentUser.email);
    sessionStorage.removeItem('phishguard_session');
  }
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('signin-page').style.display = 'flex';
  document.getElementById('register-page').style.display = 'none';
}

function enterAsVisitor() {
  currentUser = { name: 'Visitor', email: '', role: 'visitor', joined: '' };
  // Don't persist visitor session — always fresh
  loadApp();
}

function showRegister() {
  document.getElementById('signin-page').style.display = 'none';
  document.getElementById('register-page').style.display = 'flex';
}
function showLogin() {
  document.getElementById('register-page').style.display = 'none';
  document.getElementById('signin-page').style.display = 'flex';
  // Clear register fields
  ['reg-name','reg-email','reg-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('reg-error').style.display = 'none';
}
