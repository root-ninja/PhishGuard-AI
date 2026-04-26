# PhishGuard AI: SRS vs Current Development Recheck

Generated on: 2026-04-26  
Rechecked on: 2026-04-26  
SRS reviewed from: `C:\Users\Sonuu\Downloads\24BECCS53.pdf`  
Codebase reviewed from: `D:\PhishGuard-AI`

## Executive Verdict

After rechecking the SRS against the current repository, the project is no longer just a static frontend prototype. It now includes a meaningful backend/API prototype under `ai-service`, plus frontend integration through `api.js`.

The current development now covers many core SRS workflows:

- Web UI for login, registration, visitor mode, email analysis, URL analysis, history, admin screens, analytics, settings, and reports.
- FastAPI backend with REST endpoints for URL analysis, email analysis, `.eml` upload, jobs, reports, history, false-positive feedback, blacklist/whitelist, analytics, retraining metadata, and auth verification.
- Local PDF-like report generation.
- Rate limiting middleware.
- Basic API auth token handling.
- `.eml` file upload.
- URL validation and a stronger URL feature extractor.
- Email parsing, link extraction, authentication-header inspection, and embedded URL analysis.
- Recommended actions in reports.
- History pagination and date/risk filtering.
- False-positive reporting.
- Admin blacklist/whitelist management.
- Firestore and Storage security rule files.
- A small unit test suite for detection behavior.

However, several SRS expectations are still not fully met:

- Backend is FastAPI/local JSON storage, not Firebase Cloud Functions with Firestore production persistence.
- API auth uses demo/local token handling and unverified JWT decoding, not secure Firebase Admin JWT verification.
- PhishTank and Google Safe Browsing are still not live integrations.
- WHOIS is still not implemented.
- DNS check exists only as basic resolution, not full abnormal-record analysis.
- The ML model is still a deterministic/rule-based baseline, not a trained Random Forest artifact.
- PDF generation is a local minimal PDF-like artifact, not Firebase Cloud Storage report storage.
- Email alerts are still not actually sent.
- Test coverage is far below the SRS target of 80%.

## Final Rank

**Updated SRS compliance score: 6.2 / 10**

This is a noticeable improvement from the earlier frontend-only assessment. The project now demonstrates most user-facing workflows and has a working API-shaped backend. It is still below full SRS compliance because the SRS describes a production cloud architecture with real external threat intelligence, model training/evaluation, Firebase-backed persistence, secure JWT enforcement, cloud storage, alerting, and formal test coverage.

## Score Breakdown

| Area | Score | Reason |
| --- | ---: | --- |
| UI and usability | 7.5 / 10 | Most screens exist, with responsive UI, reports, history filters, and admin views. |
| Authentication and roles | 5.5 / 10 | Firebase Auth exists in frontend, demo/local auth remains, and backend JWT is not securely verified. |
| Email analysis | 6.0 / 10 | Pasted text and `.eml` upload exist; parsing, auth-header checks, embedded link analysis exist; real SPF/DKIM/DMARC DNS verification and true NLP are missing. |
| URL analysis | 6.5 / 10 | Stronger URL validation and feature extraction exist; DNS resolution exists; WHOIS and live threat APIs are missing. |
| Risk reports | 6.5 / 10 | Score, indicators, recommended action, job ID, report ID, and downloadable local PDF exist; Cloud Storage-backed PDF reports are missing. |
| History and storage | 5.5 / 10 | History endpoint and UI pagination/filtering exist; persistence is local JSON/localStorage, not Firestore production collections. |
| Admin panel | 6.5 / 10 | Users, settings, analytics, blacklist/whitelist, and retrain metadata exist; real model ops and Firestore-backed admin state are incomplete. |
| REST API / integrations | 6.5 / 10 | FastAPI endpoints and OpenAPI docs exist locally; Firebase Functions deployment, Gmail/Outlook plugin, and real third-party integrations are missing. |
| ML model and accuracy | 4.0 / 10 | Model metadata and deterministic baseline exist; no trained model artifact or verified metrics pipeline. |
| Security, reliability, and tests | 4.5 / 10 | Rate limiting, validation, rules files, and tests exist; secure JWT verification, production storage rules deployment, alerting, and 80% coverage are missing. |

## Requirement-by-Requirement Status

| ID | SRS Requirement | Updated Status | Evidence in Current Code | Remaining Gap |
| --- | --- | --- | --- | --- |
| FR-01 | Accept email as `.eml` file or pasted text via web/API; return job ID. | Mostly present | `email-file-input`, `api.js`, `/api/analyse/email`, `/api/analyse/email-file`, `job_id` in API result. | Job is completed synchronously, not queued through Firebase Cloud Tasks. |
| FR-02 | Validate input format; clear errors. | Mostly present | Pydantic models, URL validation, file extension/size checks, frontend validation. | More sanitization and consistent UX errors are still needed. |
| FR-03 | Verify SPF, DKIM, DMARC; sender mismatch. | Partial | `auth_header_status()` inspects email headers; sender mismatch detection exists. | Does not perform real DNS-based SPF/DKIM/DMARC verification. |
| FR-04 | NLP body analysis for trigger words. | Partial | Urgent-word and credential-term detection in `detection.py`. | Not true NLP or trained text classifier. |
| FR-05 | Extract hyperlinks from email HTML and pass each to URL module. | Mostly present | `LinkExtractor`, regex extraction, `analyze_url()` called for links. | Limited HTML parsing and caps links to first 20. |
| FR-06 | Combine sender, text, and link scores. | Mostly present | `analyze_email()` aggregates auth, language, sender, link, and HTML signals. | No trained scoring model or calibrated confidence. |
| FR-07 | Accept URL and validate `http/https`. | Present | `normalize_url()` and frontend `validateHttpUrl()`. | None major for prototype. |
| FR-08 | Extract URL features: length, IP, special chars, subdomain depth, HTTPS, brand similarity. | Mostly present | `extract_url_features()` returns 15+ features. | Feature extractor is deterministic but not tied to a trained model. |
| FR-09 | WHOIS lookup; flag domains under 30 days. | Missing | Metadata says WHOIS provider not configured. | Need WHOIS integration and domain-age scoring. |
| FR-10 | DNS check; flag abnormal records. | Partial | `has_dns()` checks basic DNS resolution. | Need deeper DNS checks for MX/NS/TXT/abnormal records. |
| FR-11 | Query PhishTank and Google Safe Browsing; cache in Firestore. | Missing/placeholder | Metadata says `not_configured`; local blacklist/whitelist exists. | Need real API calls, protected keys, cache, and Firestore persistence. |
| FR-12 | Combine sub-scores into final 0-100 score and levels. | Present | `risk_level()` and result objects. | Calibration/ML validation missing. |
| FR-13 | Generate plain-English report with indicators and recommended action. | Present | `recommended_action()`, indicators, PDF report generation. | PDF is minimal local artifact, not full production report template. |
| FR-14 | Send email alert when PHISHING. | Missing/simulated | Toast says alert workflow recorded. | Need email service/notification pipeline. |
| FR-15 | Register with Firebase Auth and confirmation email. | Mostly present | `createUserWithEmailAndPassword()`, `sendEmailVerification()`, Firestore user doc write. | Depends on Firebase config/runtime; local demo auth still exists. |
| FR-16 | Login issues Firebase JWT; invalid credentials error. | Partial | Firebase login exists; API client sends Bearer token. | Backend does not verify Firebase JWT cryptographically. |
| FR-17 | Role-based access: users own results, admins all. | Partial | UI role routing and API admin dependency exist. | API role is demo-token based; storage is not Firestore-secured production data. |
| FR-18 | Paginated history filterable by date/risk. | Mostly present | `/api/history` supports `page`, `page_size`, `date`, `level`; UI pager/date filter exist. | Frontend still stores local history; API history is separate local JSON store. |
| FR-19 | Download past report as PDF from Firebase Cloud Storage. | Partial | `/api/reports/{report_id}` returns PDF; UI download buttons exist. | Reports are local files, not Firebase Cloud Storage. |

## Use Case Coverage

| Use Case | Updated Status | Notes |
| --- | --- | --- |
| UC-01 Registration | Mostly present | Firebase registration and email verification call exist. |
| UC-02 Login | Partial | Firebase and local demo login exist; backend token verification is weak. |
| UC-03 Manage Profile | Mostly present | Profile update exists locally. |
| UC-04 Submit Email for Analysis | Mostly present | Text and `.eml` upload exist; plugin/API upload exists through backend. |
| UC-05 Submit URL for Analysis | Present | Web/API URL analysis exists. |
| UC-06 View Analysis Report | Present | Report UI and API result exist. |
| UC-07 Download Report | Partial | PDF endpoint exists locally; not Cloud Storage. |
| UC-08 View History | Mostly present | UI and API exist. |
| UC-09 Search & Filter History | Mostly present | Search, type, risk, date, pagination exist. |
| UC-10 Report False Positive | Present | UI and `/api/feedback/false-positive` exist. |
| UC-11 Manage Users | Partial | Local admin user management exists; not synced to Firebase Auth/Admin backend. |
| UC-12 Configure System Settings | Partial | Settings UI exists; some settings are local only. |
| UC-13 Manage Blacklist / Whitelist | Mostly present | UI and API endpoints exist using local JSON store. |
| UC-14 View Admin Dashboard | Partial | Dashboard exists; not fully backend/admin aggregated. |
| UC-15 View Threat Analytics | Mostly present | `/api/admin/analytics` exists; UI analytics are still partly static. |
| UC-16 Export Analytics Report | Missing | No analytics export report feature found. |
| UC-17 Trigger Model Retraining | Partial | `/api/admin/retrain` updates model metadata; no real retraining. |
| UC-18 Send Alert | Missing/simulated | No email alert service. |
| UC-19 Access REST API | Mostly present | FastAPI REST API and local OpenAPI docs exist. |

## What Improved Since the Earlier Check

- Added `ai-service` FastAPI backend.
- Added API endpoints for analysis, jobs, reports, history, feedback, admin lists, analytics, and retraining.
- Added `.eml` upload support.
- Added local PDF report generation.
- Added rate limiting middleware.
- Added frontend API client with fallback to local analysis.
- Added stricter URL validation.
- Added 15+ URL feature extraction.
- Added basic DNS resolution.
- Added email parser and authentication header inspection.
- Added recommended actions.
- Added false-positive feedback.
- Added blacklist/whitelist management.
- Added history pagination and date filtering.
- Added Firestore and Storage rules files.
- Added unit tests for the detection module.

## Remaining Major Missing Functions

### 1. Production Firebase/Cloud Architecture

The SRS expects Firebase Cloud Functions, Firestore, Cloud Tasks/Pub/Sub, Firebase Hosting, and Cloud Storage. The current backend is FastAPI with local JSON/file storage.

Needed:

- Deployable cloud backend.
- Firestore persistence for production data.
- Cloud Storage for generated reports.
- Cloud Tasks/Pub/Sub or equivalent async queue.
- Firebase CLI deployment configuration.

### 2. Secure Authentication and Authorization

Current backend token handling is prototype-grade.

Needed:

- Firebase Admin SDK JWT verification.
- Real role lookup from Firestore.
- Removal or isolation of demo tokens.
- Server-side role enforcement tied to verified users.

### 3. External Threat Intelligence

Needed:

- PhishTank API integration.
- Google Safe Browsing API integration.
- Secure backend-side API key storage.
- Firestore domain reputation cache.
- API failure fallback with visible user notice.

### 4. WHOIS and Deeper DNS

Needed:

- WHOIS provider/library integration.
- Domain creation date and domain age score.
- DNS checks beyond basic resolution:
  - A/AAAA records.
  - MX records.
  - NS records.
  - TXT/SPF records.
  - suspicious/missing record handling.

### 5. Real ML/NLP Model

Needed:

- Dataset preparation.
- Trained Random Forest or other model artifact.
- Model loading/inference path.
- Accuracy, precision, recall, F1-score evidence.
- False-positive evaluation.
- Real retraining script and versioning.

### 6. Alerts and Notifications

Needed:

- Email sending provider or Firebase extension.
- Alert templates.
- Alert audit records.
- User notification preferences enforced by backend.

### 7. Testing and Quality Targets

Current tests are useful but small.

Needed:

- 80% module coverage.
- API endpoint tests.
- Auth/role tests.
- History/report tests.
- Admin list tests.
- Performance/load tests.
- Firebase Emulator tests if Firebase remains the target.

## SRS Quality Notes

The SRS is strong conceptually, but the architecture still has some inconsistencies:

| Issue | Why It Matters | Recommendation |
| --- | --- | --- |
| React is specified, but current frontend is vanilla JS. | Implementation and SRS stack mismatch. | Either migrate to React or revise SRS for vanilla JS frontend. |
| Python/Flask deployed via Firebase Cloud Functions is unclear. | Firebase Functions commonly use Node.js; Python usually maps to Google Cloud Functions/Cloud Run. | Pick Firebase Functions Node.js, Google Cloud Run/FastAPI, or clarify deployment. |
| PostgreSQL appears in sequence text, while SRS database is Firestore. | Confuses implementation target. | Standardize on Firestore or PostgreSQL. |
| Cloud Tasks/Pub/Sub conflicts with Celery/Redis wording in sequence section. | Two queue architectures. | Choose one queue architecture. |
| Bcrypt is mentioned in early requirements, but later Firebase Auth manages passwords. | Firebase Auth abstracts password hashing. | Say passwords are managed by Firebase Auth; no app-side plaintext storage. |

## Recommended Next Steps

### Priority 1: Align Architecture

Choose one official architecture:

- **Option A: Firebase-first**: Firebase Hosting + Cloud Functions + Firestore + Cloud Storage + Cloud Tasks.
- **Option B: FastAPI-first**: FastAPI + Cloud Run/Render/Railway + Firestore/PostgreSQL + local/S3-style storage.

The current code is closer to **FastAPI-first**, while the SRS is written closer to **Firebase-first**.

### Priority 2: Secure the API

1. Add Firebase Admin SDK verification.
2. Use real Firebase ID tokens from frontend.
3. Load user roles from Firestore.
4. Remove demo Bearer tokens from production path.

### Priority 3: Replace Placeholders

1. Add PhishTank API.
2. Add Google Safe Browsing API.
3. Add WHOIS lookup.
4. Improve DNS analysis.
5. Store domain cache in Firestore or chosen database.

### Priority 4: Make Reports Production-Grade

1. Generate polished PDFs.
2. Store reports in Cloud Storage or chosen storage provider.
3. Save report metadata in database.
4. Let history download reports securely.

### Priority 5: Build Real Model Evidence

1. Train model.
2. Save model artifact.
3. Add inference endpoint.
4. Document accuracy, precision, recall, F1-score, and false-positive rate.
5. Make `/api/admin/retrain` run a real retraining process or clearly mark it as demo.

### Priority 6: Raise Test Coverage

1. Expand tests for all API endpoints.
2. Add role/auth tests.
3. Add frontend-free unit tests for scoring behavior.
4. Add coverage reporting.
5. Target the SRS requirement of at least 80%.

## Final Assessment

The current development now stands at **6.2 / 10 against the SRS**.

The project has moved from a visual prototype to a working SRS-shaped prototype with a real local API surface. The biggest remaining gap is production realism: real Firebase/Firestore/Cloud Storage deployment, verified auth, external threat intelligence, WHOIS/DNS depth, real ML evidence, alert delivery, and coverage.

