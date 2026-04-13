/* PhishGuard AI — Auth — forms, validation, sessions
   auth.js */

// ═══════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════
const AUTH_DELAY_MS = 450;
let loginBusy = false;
let registerBusy = false;
let authBootMessage = '';
let loginEscBound = false;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function setAuthMessage(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;

  if (!message) {
    el.textContent = '';
    el.className = 'error-msg';
    el.style.display = 'none';
    return;
  }

  el.textContent = message;
  el.className = 'error-msg ' + type;
  el.style.display = 'block';
}

function setFieldHint(id, message, state = 'neutral') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || '';
  el.className = state === 'neutral' ? 'field-hint' : 'field-hint ' + state;
}

function setInputValidity(id, state) {
  const el = document.getElementById(id);
  if (!el) return;

  if (state === 'invalid') {
    el.setAttribute('aria-invalid', 'true');
  } else if (state === 'valid') {
    el.setAttribute('aria-invalid', 'false');
  } else {
    el.removeAttribute('aria-invalid');
  }
}

function setAuthButtonLabel(buttonId, labelId, busy, busyLabel, idleLabel) {
  const button = document.getElementById(buttonId);
  const label = document.getElementById(labelId);

  if (button) {
    button.dataset.busy = busy ? 'true' : 'false';
  }
  if (label) {
    label.innerHTML = busy ? '<span class="spinner"></span> ' + busyLabel : idleLabel;
  }
}

function syncAuthRoute(view) {
  if (!window.history || !window.history.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set('view', view === 'register' ? 'register' : 'signin');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

function getLoginOverlay() {
  return document.getElementById('login-overlay');
}

function getSigninPage() {
  return document.getElementById('signin-page');
}

function isLoginVisible() {
  return getLoginOverlay()?.classList.contains('open');
}

function hideLogin() {
  const overlay = getLoginOverlay();
  const signinPage = getSigninPage();
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (signinPage) {
    signinPage.classList.remove('modal-open');
  }
  document.body.classList.remove('auth-modal-open');
}

function handleLoginOverlay(event) {
  if (event.target === getLoginOverlay()) {
    hideLogin();
  }
}

function updateLoginState() {
  const email = normalizeEmail(document.getElementById('login-email')?.value);
  const pass = document.getElementById('login-pass')?.value || '';
  const emailOk = isValidEmailAddress(email);
  const button = document.getElementById('login-btn');

  if (!email) {
    setFieldHint('login-email-hint', 'Use a registered email or one of the demo accounts above.');
    setInputValidity('login-email', 'neutral');
  } else if (!emailOk) {
    setFieldHint('login-email-hint', 'Enter a valid email address.', 'invalid');
    setInputValidity('login-email', 'invalid');
  } else {
    setFieldHint('login-email-hint', 'Email format looks good.', 'valid');
    setInputValidity('login-email', 'valid');
  }

  if (!pass) {
    setFieldHint('login-pass-hint', 'Enter your password to continue.');
    setInputValidity('login-pass', 'neutral');
  } else {
    setFieldHint('login-pass-hint', 'Password entered.');
    setInputValidity('login-pass', 'valid');
  }

  if (button) {
    button.disabled = loginBusy || !emailOk || !pass;
  }
}

function updateRegisterState() {
  const name = document.getElementById('reg-name')?.value.trim() || '';
  const email = normalizeEmail(document.getElementById('reg-email')?.value);
  const pass = document.getElementById('reg-pass')?.value || '';
  const button = document.getElementById('reg-btn');
  const nameOk = name.length >= 2;
  const emailOk = isValidEmailAddress(email);
  const passOk = pass.length >= 6;
  const duplicate = emailOk && !!findUserByEmail(email);

  if (!name) {
    setFieldHint('reg-name-hint', 'Use the name you want displayed in the dashboard.');
    setInputValidity('reg-name', 'neutral');
  } else if (!nameOk) {
    setFieldHint('reg-name-hint', 'Enter at least 2 characters for your name.', 'invalid');
    setInputValidity('reg-name', 'invalid');
  } else {
    setFieldHint('reg-name-hint', 'Name looks good.', 'valid');
    setInputValidity('reg-name', 'valid');
  }

  if (!email) {
    setFieldHint('reg-email-hint', 'We will use this email as your sign-in.');
    setInputValidity('reg-email', 'neutral');
  } else if (!emailOk) {
    setFieldHint('reg-email-hint', 'Enter a valid email address.', 'invalid');
    setInputValidity('reg-email', 'invalid');
  } else if (duplicate) {
    setFieldHint('reg-email-hint', 'An account with this email already exists.', 'invalid');
    setInputValidity('reg-email', 'invalid');
  } else {
    setFieldHint('reg-email-hint', 'Email is available.', 'valid');
    setInputValidity('reg-email', 'valid');
  }

  if (!pass) {
    setFieldHint('reg-pass-hint', 'Use at least 6 characters.');
    setInputValidity('reg-pass', 'neutral');
  } else if (!passOk) {
    setFieldHint('reg-pass-hint', 'Password must be at least 6 characters.', 'invalid');
    setInputValidity('reg-pass', 'invalid');
  } else {
    setFieldHint('reg-pass-hint', 'Password length is valid.', 'valid');
    setInputValidity('reg-pass', 'valid');
  }

  if (button) {
    button.disabled = registerBusy || !nameOk || !emailOk || !passOk || duplicate;
  }

  return { name, email, pass, nameOk, emailOk, passOk, duplicate };
}

async function doLogin(event) {
  if (event) event.preventDefault();
  if (loginBusy) return;

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-pass');
  const email = normalizeEmail(emailInput?.value);
  const pass = passInput?.value || '';

  setAuthMessage('login-error', '');
  updateLoginState();

  if (!email || !pass) {
    setAuthMessage('login-error', 'Enter both email and password.');
    if (!email) emailInput?.focus();
    else passInput?.focus();
    return;
  }

  if (!isValidEmailAddress(email)) {
    setAuthMessage('login-error', 'Enter a valid email address.');
    emailInput?.focus();
    return;
  }

  loginBusy = true;
  updateLoginState();
  setAuthButtonLabel('login-btn', 'login-btn-text', true, 'Signing in...', 'Sign In ->');

  try {
    await wait(AUTH_DELAY_MS);

    const user = findUserByEmail(email);
    if (!user || user.pass !== pass) {
      setAuthMessage('login-error', 'Invalid email or password. Please try again.');
      passInput?.focus();
      passInput?.select();
      return;
    }

    if (user.banned) {
      setAuthMessage('login-error', 'This account has been blocked. Contact an administrator.');
      return;
    }

    currentUser = sanitizeUser(user);
    saveSessionUser(currentUser);
    setAuthMessage('login-error', '');
    hideLogin();
    loadApp();
    showToast('Welcome back, ' + currentUser.name + '.', 'success');
  } finally {
    loginBusy = false;
    updateLoginState();
    setAuthButtonLabel('login-btn', 'login-btn-text', false, 'Signing in...', 'Sign In ->');
  }
}

async function doRegister(event) {
  if (event) event.preventDefault();
  if (registerBusy) return;

  const state = updateRegisterState();
  const { name, email, pass, nameOk, emailOk, passOk, duplicate } = state;

  setAuthMessage('reg-error', '');

  if (!nameOk) {
    setAuthMessage('reg-error', 'Enter your full name before creating an account.');
    document.getElementById('reg-name')?.focus();
    return;
  }
  if (!emailOk) {
    setAuthMessage('reg-error', 'Enter a valid email address.');
    document.getElementById('reg-email')?.focus();
    return;
  }
  if (duplicate) {
    setAuthMessage('reg-error', 'An account with this email already exists.');
    document.getElementById('reg-email')?.focus();
    return;
  }
  if (!passOk) {
    setAuthMessage('reg-error', 'Password must be at least 6 characters.');
    document.getElementById('reg-pass')?.focus();
    return;
  }

  registerBusy = true;
  updateRegisterState();
  setAuthButtonLabel('reg-btn', 'reg-btn-text', true, 'Creating account...', 'Create Account ->');

  try {
    await wait(AUTH_DELAY_MS);

    const users = getUsers();
    if (users.some(user => normalizeEmail(user.email) === email)) {
      setAuthMessage('reg-error', 'An account with this email already exists.');
      return;
    }

    users.push({
      name,
      email,
      pass,
      role: 'user',
      joined: new Date().toLocaleDateString(),
      banned: false,
    });
    saveUsers(users);
    logAction('CREATE ACCOUNT', email);

    showLogin('Account created. Sign in with your new credentials.', 'success');
    document.getElementById('login-email').value = email;
    document.getElementById('login-pass').value = '';
    updateLoginState();
    showToast('Account created successfully.', 'success');
  } finally {
    registerBusy = false;
    updateRegisterState();
    setAuthButtonLabel('reg-btn', 'reg-btn-text', false, 'Creating account...', 'Create Account ->');
  }
}

function doLogout() {
  if (currentUser && currentUser.role !== 'visitor') {
    logAction('LOGOUT', currentUser.email);
  }

  clearSessionUser();
  currentUser = null;

  document.getElementById('app').style.display = 'none';
  document.getElementById('login-pass').value = '';
  showLogin();
}

function enterAsVisitor() {
  clearSessionUser();
  currentUser = { name: 'Visitor', email: '', role: 'visitor', joined: '' };
  loadApp();
}

function showRegister() {
  hideLogin();
  document.getElementById('signin-page').style.display = 'none';
  document.getElementById('register-page').style.display = 'flex';

  ['reg-name', 'reg-email', 'reg-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  setAuthMessage('login-error', '');
  setAuthMessage('reg-error', '');
  updateRegisterState();
  syncAuthRoute('register');
}

function showLogin(message = '', type = 'error') {
  document.getElementById('register-page').style.display = 'none';
  document.getElementById('signin-page').style.display = 'flex';

  ['reg-name', 'reg-email', 'reg-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  setAuthMessage('reg-error', '');
  setAuthMessage('login-error', message, type);
  updateRegisterState();
  updateLoginState();
  getLoginOverlay()?.classList.add('open');
  getLoginOverlay()?.setAttribute('aria-hidden', 'false');
  getSigninPage()?.classList.add('modal-open');
  document.body.classList.add('auth-modal-open');
  syncAuthRoute('signin');

  window.setTimeout(() => {
    const emailInput = document.getElementById('login-email');
    emailInput?.focus();
    emailInput?.select();
  }, 50);
}

function applyInitialAuthView() {
  const requestedView = new URLSearchParams(window.location.search).get('view');
  if (requestedView === 'register') {
    hideLogin();
    document.getElementById('signin-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'flex';
    updateRegisterState();
    return;
  }

  document.getElementById('register-page').style.display = 'none';
  document.getElementById('signin-page').style.display = 'flex';
  hideLogin();
  updateLoginState();
}

function restoreSession() {
  const savedUser = getSessionUser();
  if (!savedUser || savedUser.role === 'visitor') {
    clearSessionUser();
    return false;
  }

  const freshUser = findUserByEmail(savedUser.email);
  if (!freshUser) {
    clearSessionUser();
    authBootMessage = 'Your previous session expired. Please sign in again.';
    return false;
  }

  if (freshUser.banned) {
    clearSessionUser();
    authBootMessage = 'This account is currently blocked. Contact an administrator.';
    return false;
  }

  currentUser = sanitizeUser(freshUser);
  saveSessionUser(currentUser);
  return true;
}

function consumeAuthBootMessage() {
  const message = authBootMessage;
  authBootMessage = '';
  return message;
}

function initAuthUI() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm && !loginForm.dataset.bound) {
    loginForm.addEventListener('submit', doLogin);
    loginForm.dataset.bound = 'true';
  }

  if (registerForm && !registerForm.dataset.bound) {
    registerForm.addEventListener('submit', doRegister);
    registerForm.dataset.bound = 'true';
  }

  ['login-email', 'login-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) return;
    el.addEventListener('input', () => {
      setAuthMessage('login-error', '');
      updateLoginState();
    });
    el.addEventListener('blur', updateLoginState);
    el.dataset.bound = 'true';
  });

  ['reg-name', 'reg-email', 'reg-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) return;
    el.addEventListener('input', () => {
      setAuthMessage('reg-error', '');
      updateRegisterState();
    });
    el.addEventListener('blur', updateRegisterState);
    el.dataset.bound = 'true';
  });

  if (!loginEscBound) {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isLoginVisible()) {
        hideLogin();
      }
    });
    loginEscBound = true;
  }

  updateLoginState();
  updateRegisterState();
}
