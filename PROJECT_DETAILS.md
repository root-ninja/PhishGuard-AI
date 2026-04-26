# PhishGuard-AI Project Details

Generated on: 2026-04-26

## 1. Project Summary

PhishGuard-AI is a static browser-based phishing detection dashboard. It provides:

- A pre-login landing screen with login, registration, visitor mode, and scroll animations.
- Demo and Firebase-backed authentication flows.
- Role-based app access for visitor, standard user, and admin.
- Email and URL phishing analysis using frontend rule-based heuristics.
- Dashboard statistics, history, analytics, settings, audit logs, and admin user management.
- Cloudflare Pages friendly deployment from the repository root.

The current repository is primarily a frontend application. There is no backend server, Python service, trained model artifact, database schema, or API route implementation inside this repo.

## 2. High-Level Architecture

```text
Browser
  |
  |-- index.html
  |-- styles.css
  |-- JavaScript modules loaded as classic scripts
  |
  |-- localStorage/sessionStorage
  |     |-- users
  |     |-- history
  |     |-- settings
  |     |-- audit log
  |     |-- session
  |
  |-- Firebase CDN modules, used by auth.js
        |-- Firebase App
        |-- Firebase Auth
        |-- Firebase Firestore
```

The app is not bundled. Files are loaded directly by `index.html`, so global functions and variables are shared across scripts.

## 3. Technology Stack

### Runtime

- HTML5
- CSS3
- Vanilla JavaScript
- Browser Web APIs
- Firebase JavaScript SDK

### Dependency

From `package.json`:

```json
{
  "dependencies": {
    "firebase": "^12.12.0"
  }
}
```

From `package-lock.json`, installed Firebase package version:

- `firebase`: `12.12.0`

### Fonts

Loaded from Google Fonts in `index.html`:

- `Space Mono`
- `Syne`
- `JetBrains Mono`

## 4. Main Entry Points

### `index.html`

Primary page for the entire app. It contains:

- Landing/pre-login page.
- Login modal.
- Registration screen.
- Main authenticated app shell.
- Sidebar navigation.
- Visitor panels.
- Dashboard panel.
- Analyse panel.
- History panel.
- Analytics panel.
- Settings panel.
- About panel.
- User management panel.
- Audit log panel.
- User and delete confirmation modals.
- Toast container.
- Script loading order.

### `signin.html`

Redirect page for sign-in. It redirects to:

```text
index.html?view=signin
```

### `register.html`

Redirect page for registration. It redirects to:

```text
index.html?view=register
```

## 5. Script Loading Order

`index.html` loads scripts in this order:

```html
<script src="data.js"></script>
<script src="utils.js"></script>
<script src="audit.js"></script>
<script src="analysis.js"></script>
<script src="auth.js"></script>
<script src="loadapp.js"></script>
<script src="navigation.js"></script>
<script src="dashboard.js"></script>
<script src="history.js"></script>
<script src="analytics.js"></script>
<script src="settings.js"></script>
<script src="users.js"></script>
<script src="visitor.js"></script>
<script src="prelogin.js"></script>
<script src="app.js"></script>
```

This order matters because later files depend on global functions and variables from earlier files.

## 6. File-by-File Breakdown

### `data.js`

Handles local data storage and shared auth/session state.

Main constants:

- `USERS_KEY = 'phishguard_users'`
- `HISTORY_KEY = 'phishguard_history'`
- `SETTINGS_KEY = 'phishguard_settings'`
- `SESSION_KEY = 'phishguard_session'`

Main variables:

- `currentUser`
- `currentTab`
- `historyData`

Main functions:

- `initUsers()`
- `normalizeEmail(email)`
- `sanitizeUser(user)`
- `getUsers()`
- `saveUsers(users)`
- `findUserByEmail(email)`
- `getSessionUser()`
- `saveSessionUser(user)`
- `clearSessionUser()`
- `getHistory()`
- `saveHistory(history)`
- `getSettings()`
- `saveSettingsData(settings)`

Default demo users:

| Name | Email | Password | Role |
| --- | --- | --- | --- |
| Admin User | `admin@phishguard.ai` | `admin123` | `admin` |
| Standard User | `user@demo.com` | `demo123` | `user` |

Important note: local demo user passwords are stored in `localStorage` in plain text.

### `utils.js`

Provides shared UI helper behavior.

Main function:

- `showToast(message, type)`

Toast types used:

- `info`
- `success`
- `error`

### `audit.js`

Stores and renders audit event data.

Storage key:

- `AUDIT_KEY = 'phishguard_audit'`

Main functions:

- `getAuditLog()`
- `saveAuditLog(log)`
- `logAction(action, target)`

Audit log entries include:

- Time
- User
- Action
- Target
- UI color

Retention:

- Latest 200 entries are kept.

### `analysis.js`

Contains the frontend phishing analysis engine.

Main functions:

- `switchTab(tab)`
- `analyseEmail(text)`
- `analyseURL(url)`
- `getLevel(score)`
- `runAnalysis()`

Detection constants:

- `URGENT_WORDS`
- `SCAM_DOMAINS`
- `SUSPICIOUS_TLDS`
- `LEGIT_DOMAINS`

Risk levels:

| Score range | Level |
| --- | --- |
| `0-30` | `SAFE` |
| `31-65` | `SUSPICIOUS` |
| `66-100` | `PHISHING` |

Email signals checked:

- Urgent or threatening language.
- Suspicious sender domain.
- Display name mismatch.
- Suspicious links.
- Credential or financial request.
- Hidden HTML content.
- Fallback safe indicators when no red flags are found.

URL signals checked:

- Raw IP address used as domain.
- Long URL length.
- Sensitive keywords.
- Typosquatting or brand impersonation.
- Suspicious top-level domains.
- Excessive special characters.
- Missing HTTPS.
- Simulated domain age.
- Known legitimate domain adjustment.

Important note: the current analysis engine is rule-based and simulated. It does not call a live ML model or threat intelligence API.

### `auth.js`

Handles login, registration, session restoration, Firebase auth integration, and auth UI state.

Firebase config:

```js
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCQSSNUO70O_SrNUclqvZMkzFS1BAXOxJA',
  authDomain: 'phishguard-ai-9d72c.firebaseapp.com',
  projectId: 'phishguard-ai-9d72c',
  storageBucket: 'phishguard-ai-9d72c.firebasestorage.app',
  messagingSenderId: '770700382655',
  appId: '1:770700382655:web:26db3e241eb6a13710510a',
  measurementId: 'G-37MGS0BMJH',
};
```

Firebase modules dynamically imported from CDN:

- `https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js`
- `https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js`
- `https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js`

Firebase functions used:

- `initializeApp`
- `getApps`
- `getApp`
- `getAuth`
- `createUserWithEmailAndPassword`
- `signInWithEmailAndPassword`
- `updateProfile`
- `deleteUser`
- `getFirestore`
- `doc`
- `getDoc`
- `setDoc`
- `serverTimestamp`

Auth behavior:

- Login first checks local demo users.
- If local login fails, it attempts Firebase Auth sign-in.
- Registration creates a Firebase Auth user and Firestore `users/{uid}` document.
- Registered Firebase user profile is mirrored into localStorage.
- Session is stored in `sessionStorage`.
- Visitor mode creates a temporary in-memory visitor user.
- Banned users cannot log in.

Main functions:

- `getFirebaseServices()`
- `isValidEmailAddress(email)`
- `mapRegisterError(error)`
- `syncLocalUserProfile(user)`
- `setAuthMessage(id, message, type)`
- `setFieldHint(id, message, state)`
- `setInputValidity(id, state)`
- `hideLogin()`
- `showLogin(message, type)`
- `showRegister()`
- `doLogin(event)`
- `doRegister(event)`
- `doLogout()`
- `enterAsVisitor()`
- `applyInitialAuthView()`
- `restoreSession()`
- `initAuthUI()`

### `loadapp.js`

Initializes the main app after login or visitor entry.

Main function:

- `loadApp()`

Responsibilities:

- Hides auth screens.
- Shows the main app shell.
- Fills user sidebar data.
- Loads settings for authenticated users.
- Reads history from localStorage.
- Shows role-specific navigation.
- Routes visitors to `welcome`.
- Routes users and admins to `dashboard`.
- Logs login events for non-visitors.
- Refreshes dashboard, history, and analytics.

### `navigation.js`

Controls role-based panel navigation.

Main function:

- `showPanel(name)`

Role access:

| Role | Allowed panels |
| --- | --- |
| Visitor | `welcome`, `quickscan`, `about` |
| User | `dashboard`, `analyse`, `history`, `settings`, `about` |
| Admin | `dashboard`, `analyse`, `history`, `users`, `analytics`, `auditlog`, `settings`, `about` |

Panel metadata controls the topbar title and subtitle.

### `dashboard.js`

Renders dashboard metrics from analysis history.

Main function:

- `refreshDashboard()`

Dashboard data:

- Total checks.
- Safe checks.
- Suspicious checks.
- Phishing checks.
- Today's checks.
- Donut chart percentages.
- Simulated weekly bar chart.
- Recent analyses table.

Important note: weekly bars are randomly generated each refresh.

### `history.js`

Handles analysis history table, filtering, deletion, and CSV export.

Main functions:

- `renderHistory(data)`
- `filterHistory()`
- `deleteEntry(id)`
- `exportHistory()`

CSV columns:

- Target
- Type
- Score
- Level
- Indicators
- Time

### `analytics.js`

Renders static/simulated analytics charts.

Main function:

- `renderAnalytics()`

Displayed analytics:

- Top phishing indicators.
- Detection by type.
- Model accuracy, false positive rate, average response time, and uptime are shown in the HTML.

Important note: analytics values are hard-coded or simulated, not calculated from a backend model monitoring system.

### `settings.js`

Handles profile and settings updates.

Main functions:

- `saveProfile()`
- `saveSettings()`
- `retrain()`

Settings stored:

- Risk threshold.
- Max requests per minute.
- Email alerts toggle.
- PhishTank API toggle.
- Google Safe Browsing toggle.
- Monthly auto-retrain toggle.
- Audit logging toggle.

Important note: the settings toggles are stored locally, but they do not currently enable real external API calls.

### `users.js`

Admin user management module.

Main functions:

- `renderUserStats()`
- `renderUsersTable(list)`
- `filterUsers()`
- `openAddUser()`
- `openEditUser(email)`
- `closeModal()`
- `saveUserModal()`
- `openDeleteUser(email)`
- `closeDeleteModal()`
- `confirmDelete()`
- `toggleBan(email)`
- `promoteUser(email)`

Admin features:

- View users.
- Search users.
- Filter by role.
- Filter by active/banned status.
- Add users.
- Edit users.
- Delete users.
- Ban/unban users.
- Promote/demote users.

Important note: admin user management currently edits localStorage users. It does not update Firebase Auth or Firestore users.

### `visitor.js`

Visitor quick URL scan module.

Main function:

- `runVisitorScan()`

Behavior:

- Accepts one URL.
- Calls `analyseURL(url)`.
- Renders risk result and indicators.
- Does not save to full user history.

### `prelogin.js`

Controls pre-login landing page scroll effects.

Main function:

- `initPreloginMotion()`

Browser APIs used:

- `IntersectionObserver`
- `requestAnimationFrame`
- Passive scroll listener
- DOM creation and class updates

Features:

- Adds a top scroll progress bar.
- Reveals `.reveal-on-scroll` items as they enter the viewport.
- Applies staggered animation delays.

### `app.js`

Bootstraps the project.

Startup flow:

1. Calls `initUsers()`.
2. Calls `initAuthUI()`.
3. Attempts `restoreSession()`.
4. If a valid session exists, calls `loadApp()`.
5. Otherwise applies the initial auth view.
6. Displays any session expiry or blocked account message.

Also defines:

- `renderAuditLog()`
- `clearAuditLog()`

### `styles.css`

Global styling for all views.

Major UI areas:

- Landing page.
- Login modal.
- Registration panel.
- Main app layout.
- Sidebar.
- Topbar.
- Cards.
- Dashboard stats.
- Analysis input/result UI.
- History tables.
- Settings controls.
- Toasts.
- Modals.
- Scrollbar and scroll animation styles.
- Responsive breakpoints.
- Reduced-motion support.

## 7. APIs Used

### Firebase App API

Used to initialize or reuse a Firebase app.

Functions:

- `initializeApp`
- `getApps`
- `getApp`

Files:

- `auth.js`
- `index.html`

### Firebase Auth API

Used for remote sign-in and registration.

Functions:

- `getAuth`
- `createUserWithEmailAndPassword`
- `signInWithEmailAndPassword`
- `updateProfile`
- `deleteUser`

Used in:

- `auth.js`

### Firebase Firestore API

Used to create and read user profile documents.

Functions:

- `getFirestore`
- `doc`
- `getDoc`
- `setDoc`
- `serverTimestamp`

Collection/document pattern:

```text
users/{uid}
```

Stored fields on registration:

- `name`
- `email`
- `role`
- `createdAt`

Used in:

- `auth.js`

### Firebase Analytics API

`index.html` imports:

- `getAnalytics`

and calls:

- `getAnalytics(app)`

Important implementation note: `index.html` imports Firebase using bare module specifiers:

```js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
```

In a plain static browser page without a bundler or import map, these bare imports may not resolve. `auth.js` uses CDN module URLs, which are more appropriate for this static setup.

### Browser Storage APIs

Used for local app state.

APIs:

- `localStorage`
- `sessionStorage`

Stored data:

- Demo users.
- Mirrored Firebase users.
- Analysis history.
- Settings.
- Audit logs.
- Current session.

### Browser DOM and UI APIs

Used throughout the app:

- `document.getElementById`
- `document.querySelectorAll`
- `classList`
- Inline event handlers in HTML.
- Form event listeners.
- Keyboard event listener for Escape.
- `setTimeout`
- `Promise`

### Browser History and URL APIs

Used in `auth.js`:

- `URL`
- `URLSearchParams`
- `window.history.replaceState`

Used for:

- `?view=signin`
- `?view=register`

### Blob and Object URL APIs

Used in `history.js` for CSV export:

- `Blob`
- `URL.createObjectURL`
- Dynamic anchor click

### IntersectionObserver API

Used in `prelogin.js` for reveal-on-scroll animation.

### APIs Mentioned in the UI but Not Implemented as Live Calls

The UI mentions these integrations, but the current code does not make live network requests to them:

- PhishTank API
- Google Safe Browsing API
- WHOIS domain age lookup
- DNS anomaly detection
- SPF/DKIM/DMARC verification
- Email NLP service
- ML inference service
- PostgreSQL
- Redis + Celery
- Docker
- JWT Auth

These appear as feature descriptions, tech chips, settings toggles, or simulated indicators.

## 8. Models and Detection Logic

### Implemented Model

The implemented detection engine is a frontend rule-based scoring model.

Implemented in:

- `analysis.js`

It uses:

- Keyword matching.
- Suspicious domain substring matching.
- Suspicious TLD matching.
- URL regex checks.
- Sender parsing.
- Display name/domain mismatch checks.
- Credential request phrase checks.
- Randomized score jitter for demo realism.

### Email Scoring Model

Signals and score contributions:

| Signal | Approximate score impact |
| --- | --- |
| 3 or more urgent words | `+25` |
| Suspicious sender domain | `+30` |
| Excessive subdomain depth | `+12` |
| Display name mismatch | `+25` |
| Suspicious email links | `+20` |
| Credential/financial request | `+20` |
| Hidden HTML content | `+8` |
| Random jitter | `+0` to `+7` |

### URL Scoring Model

Signals and score contributions:

| Signal | Approximate score impact |
| --- | --- |
| Raw IP address URL | `+30` |
| URL longer than 75 characters | `+12` |
| Multiple sensitive keywords | `+18` |
| Typosquatting/brand impersonation | `+35` |
| Suspicious TLD | `+15` |
| More than 2 special characters | `+10` |
| Missing HTTPS | `+15` |
| Simulated newly registered domain | `+10` |
| Known legitimate domain | `-10`, minimum score 3 |
| Random jitter | `+0` to `+5` |

### Claimed or Displayed Model

The UI and About panel mention:

- Random Forest classifier.
- Machine learning.
- NLP.
- Model accuracy of about `95.2%`.
- False positive rate under `2%`.
- Training samples: `11,055`.
- Last retrained: `15 Mar 2025`.
- Algorithm: `Random Forest`.
- scikit-learn.

Important note: no trained Random Forest model file, Python code, scikit-learn dependency, inference API, or dataset exists in this repository. These are currently UI/demo claims rather than implemented model assets.

## 9. Data Storage Details

### localStorage

| Key | Purpose |
| --- | --- |
| `phishguard_users` | Demo/local users and mirrored Firebase profile data |
| `phishguard_history` | Saved analysis results |
| `phishguard_settings` | User/system settings |
| `phishguard_audit` | Audit log events |

### sessionStorage

| Key | Purpose |
| --- | --- |
| `phishguard_session` | Current user session |

### Firebase Firestore

Used only for storing user profile records during registration and reading them during Firebase login.

Document path:

```text
users/{uid}
```

## 10. Roles and Permissions

### Visitor

Can access:

- Welcome page.
- Quick URL scan.
- About page.

Cannot access:

- Dashboard.
- Full email analysis.
- History.
- Settings.
- Admin areas.

### User

Can access:

- Dashboard.
- Analyse.
- History.
- Settings.
- About.

### Admin

Can access:

- Dashboard.
- Analyse.
- History.
- User Management.
- Analytics.
- Audit Log.
- Settings.
- About.

## 11. User Workflows

### Pre-login

1. User lands on the landing page.
2. User can choose visitor mode, login, or sign up.
3. Pre-login details explain access levels and app workflow.
4. Scroll animations reveal details.

### Visitor Scan

1. User enters visitor mode.
2. User opens Quick URL Scan.
3. User submits a URL.
4. App runs `analyseURL`.
5. Result is displayed with level, score, and indicators.

### Authenticated Analysis

1. User logs in or registers.
2. User opens Analyse.
3. User selects Email or URL.
4. User submits content.
5. App runs `analyseEmail` or `analyseURL`.
6. Result is displayed.
7. Result is saved to history.
8. Dashboard and audit log update.

### Admin User Management

1. Admin opens User Management.
2. Admin can add, edit, delete, ban, unban, promote, or demote local users.
3. Actions are logged in the audit log.

## 12. Deployment

The README describes Cloudflare Pages deployment.

Recommended settings:

- Framework preset: `None`
- Production branch: `main`
- Build command: `exit 0`
- Build output directory: `/`
- Root directory: `/`

Local preview:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## 13. Security and Implementation Notes

- Firebase config is public in frontend code. This is normal for Firebase web apps, but Firebase Security Rules must be configured correctly.
- Demo user passwords are stored in localStorage in plain text.
- Admin actions operate on localStorage users, not Firebase Auth users.
- Firebase registration writes to Firestore, but local admin edits do not sync to Firestore.
- `index.html` includes bare Firebase module imports that may fail in a static browser environment without a bundler/import map.
- The phishing engine is client-side and can be viewed or modified by users.
- The score includes random jitter, so repeated scans of the same input may produce slightly different scores.
- Several backend/ML/threat-intelligence features are represented in the UI but not implemented as live services.

## 14. Current Limitations

- No backend API routes.
- No server-side authentication enforcement.
- No trained ML model artifact.
- No real-time threat intelligence calls.
- No real WHOIS/DNS/SPF/DKIM/DMARC validation.
- No persistent multi-user database for history, settings, audit logs, or admin edits.
- No test suite.
- No build step.
- No linting or formatting scripts.

## 15. Suggested Future Improvements

- Add a backend phishing analysis API.
- Move analysis and history writes server-side.
- Add a real trained model or hosted inference service.
- Integrate Google Safe Browsing and PhishTank with secure backend API keys.
- Add WHOIS/DNS/email-authentication checks on the backend.
- Replace localStorage password storage with Firebase-only auth.
- Sync admin user management with Firebase Auth and Firestore.
- Add Firebase Security Rules documentation.
- Add test coverage for analysis scoring and role routing.
- Remove or fix bare Firebase imports in `index.html`.
- Add lint/build scripts.

