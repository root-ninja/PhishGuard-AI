# PhishGuard AI — Project Structure

## How to Run
1. Extract the zip into a folder
2. Open terminal in that folder and run: python3 -m http.server 8080
3. Open browser: http://localhost:8080

OR: Use VS Code Live Server — right-click index.html → "Open with Live Server"

> Browsers block loading .js files directly from the filesystem (file://).
> A local server is required for the separated version to work.

---

## Demo Accounts

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@phishguard.ai | admin123  |
| User  | user@demo.com       | demo123   |

Visitor: click "Visitor Mode" on sign-in page — no login needed.

---

## File Structure

  index.html      Main entry point — open this in browser
  styles.css      All CSS styles

  data.js         localStorage keys, getters, setters
  audit.js        Audit log: logAction, getAuditLog
  auth.js         Login, register, logout, enterAsVisitor
  loadapp.js      loadApp function — sets up UI after login
  navigation.js   showPanel, panelMeta, role-based routing
  analysis.js     Phishing detection engine (email + URL)
  dashboard.js    Stats, donut chart, bar chart, recent table
  history.js      History render, filter, delete, CSV export
  analytics.js    Model metrics and indicator charts
  settings.js     Save profile and system settings
  users.js        User management CRUD, ban, promote
  visitor.js      Visitor quick URL scan (no login)
  utils.js        showToast utility
  app.js          App init, session restore, Enter key

---

## Role Access

  Visitor  — Home, Quick Scan, About
  User     — Dashboard, Analyse, History, Settings, About
  Admin    — All above + User Management, Analytics, Audit Log

---

## JS Load Order
data.js -> utils.js -> audit.js -> analysis.js -> auth.js ->
loadapp.js -> navigation.js -> dashboard.js -> history.js ->
analytics.js -> settings.js -> users.js -> visitor.js -> app.js
