# PhishGuard-AI

PhishGuard-AI is a browser-based phishing detection dashboard and investigation workspace. It combines a static frontend app with optional backend support in `ai-service/` for more advanced phishing analysis and job management.

## Features

- Landing page with sign-in, registration, and visitor mode
- Email and URL phishing risk analysis
- Dashboard with history, analytics, settings, audit logs, and user management
- Role-based access: visitor, standard user, and admin
- Demo credentials included for quick testing
- Cloudflare Pages friendly static deployment from repository root

## Repository structure

- `index.html` — main application shell and entry page
- `styles.css` — styling for the app
- `app.js` — app initialization and routing
- `auth.js` — login, registration, and session handling
- `data.js` — local storage persistence for users, history, and settings
- `analysis.js` — phishing analysis logic and scoring
- `dashboard.js` — dashboard rendering and widgets
- `history.js` — scan history view and persistence
- `analytics.js` — analytics and charts
- `settings.js` — user preferences and configuration
- `audit.js` — audit logging and event recording
- `users.js` — admin user management
- `visitor.js` — visitor mode flows
- `prelogin.js` — landing page interactions and CTA handling
- `utils.js` — shared UI helpers
- `ai-service/` — optional Python FastAPI backend for API-based phishing services

## Quick start

### Preview locally

From the repository root:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080` in your browser.

### Install dependencies

This project uses a minimal `package.json` for frontend dependency tracking. Install Node dependencies if needed:

```powershell
npm install
```

### Run tests

```powershell
npm test
```

## Demo credentials

Use the included demo users for testing:

- Admin: `admin@phishguard.ai` / `admin123`
- Standard user: `user@demo.com` / `demo123`

> Note: demo credentials and session data are stored in browser/local storage for the frontend demo.

## Deployment

### Cloudflare Pages

Use the following settings:

- Framework preset: `None`
- Production branch: `main`
- Build command: `exit 0`
- Build output directory: `/`
- Root directory: `/`

### Alternative static hosting

Any static web host that serves `index.html` from the repository root will work.

## Optional backend: `ai-service/`

The `ai-service/` folder contains a Python FastAPI service for a more realistic phishing API backend. It is separate from the static frontend and can be run independently.

To start the backend:

```powershell
python -m uvicorn app.main:app --port 8000 --app-dir ai-service
```

Then visit:

- `http://127.0.0.1:8000/docs`

## Notes

- The frontend is built with vanilla JavaScript and loads scripts directly from `index.html`.
- Firebase is included as a dependency in `package.json` for authentication and optional data services.
- The app is not bundled; scripts are loaded in order so global functions and variables are shared across files.

## License

This repository does not include a license file. Add one if you want to publish or share the project with explicit reuse terms.
