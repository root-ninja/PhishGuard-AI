# PhishGuard AI: SRS vs Current Development Gap Analysis

Generated on: 2026-04-26  
SRS reviewed from: `C:\Users\Sonuu\Downloads\24BECCS53.pdf`  
Codebase reviewed from: `D:\PhishGuard-AI`

## Executive Verdict

Current development is a strong **frontend prototype / demo MVP**, but it does not yet match the full SRS architecture.

The SRS describes a full production-style phishing detection platform with:

- React frontend.
- Python/Flask or Firebase Cloud Functions backend.
- REST API.
- Firebase Authentication with JWT.
- Firestore database collections.
- Cloud Tasks / Pub/Sub job queue.
- Cloud Storage PDF reports.
- Real ML/NLP model.
- PhishTank and Google Safe Browsing integrations.
- WHOIS, DNS, SPF, DKIM, and DMARC checks.
- Rate limiting, test coverage, retraining, alerts, and API documentation.

The current development provides:

- A complete static UI shell in `index.html`.
- Login/register/visitor screens.
- Firebase Auth attempted for login/register.
- Local demo users.
- Role-based panels.
- Email and URL analysis using frontend JavaScript heuristics.
- Risk score and visual report.
- Local history and CSV export.
- Admin user management in localStorage.
- Simulated analytics, settings, audit log, and retraining.

## Final Rank

**Overall SRS compliance score: 4.0 / 10**

This is not a bad score for a frontend prototype. The project already demonstrates the intended user experience well, but most backend, ML, API, persistence, security, and production requirements are still missing or simulated.

### Score Breakdown

| Area | Score | Reason |
| --- | ---: | --- |
| UI and usability | 7.0 / 10 | Main screens exist, are responsive, and usable. |
| Authentication and roles | 5.0 / 10 | Firebase Auth is partly wired, but localStorage demo auth still exists and JWT/backend enforcement is missing. |
| Email analysis | 4.0 / 10 | Pasted email text is analysed, but `.eml`, SPF/DKIM/DMARC, true NLP, async job IDs, and backend parsing are missing. |
| URL analysis | 4.0 / 10 | URL heuristic checks exist, but no real PhishTank, GSB, WHOIS, DNS, cache, or 15-feature extractor. |
| Risk reports | 4.5 / 10 | Score, level, indicators, and explanations exist; PDF report and recommended-action workflow are incomplete. |
| History and storage | 3.5 / 10 | Local history exists, but no Firestore persistence, pagination, date filter, PDF download, or per-user server isolation. |
| Admin panel | 4.0 / 10 | Local user management and analytics exist; blacklist/whitelist, model operations, and real admin backend are missing. |
| REST API / integrations | 1.0 / 10 | No REST API, OpenAPI docs, Gmail/Outlook integration, or plugin endpoint exists. |
| ML model and accuracy | 2.0 / 10 | Rule-based demo scoring exists; no trained model, dataset, evaluation, or retraining pipeline exists. |
| Security and reliability | 2.5 / 10 | UI validation exists, but plaintext local passwords, no rate limiting, no server-side validation, no tests, and no SLA architecture. |

## Requirement-by-Requirement Status

### Functional Requirements

| ID | SRS Requirement | Current Status | Evidence in Code | Gap |
| --- | --- | --- | --- | --- |
| FR-01 | Accept email as `.eml` file or pasted text via web/API and return job ID. | Partial | `analysis.js` supports pasted text only. | No `.eml` upload, no API, no job ID, no async queue. |
| FR-02 | Validate input format and return clear error. | Partial | Empty input shows toast. Login/register fields validate basic email. | No `.eml` validation, no URL format enforcement before analysis, no server-side validation. |
| FR-03 | Verify SPF, DKIM, DMARC and sender mismatch. | Mostly missing | Sender display/domain mismatch heuristic exists. | No real SPF/DKIM/DMARC parsing or DNS verification. |
| FR-04 | NLP body analysis for phishing trigger words. | Partial | Keyword list in `analysis.js`. | Not true NLP; no model, tokenization, classifier, confidence, or dataset. |
| FR-05 | Extract all hyperlinks from email HTML and pass each to URL analysis. | Partial | Regex extracts links and flags suspicious ones. | Does not run full URL module per link, no link-by-link report, no HTML parser. |
| FR-06 | Combine sender, text, and link scores into email sub-score. | Partial | JavaScript score increments from multiple checks. | No structured sub-score model, no backend aggregation, no confidence. |
| FR-07 | Accept URL input and validate `http/https`. | Partial | URL textarea and visitor URL input exist. | Missing strict validation; non-URLs can still be analysed. |
| FR-08 | Extract URL length, IP domain, special chars, subdomain depth, HTTPS, brand similarity. | Partial | Length, IP, special chars, HTTPS, brand keyword/typo checks exist. | No proper tokenizer, no subdomain depth scoring, no formal 15-feature vector. |
| FR-09 | WHOIS lookup and flag domains under 30 days. | Simulated | `analysis.js` adds "Newly Registered Domain" when score is already high. | No WHOIS lookup or real registration date. |
| FR-10 | DNS check and abnormal/missing DNS records. | Missing | None. | Need backend DNS resolver. |
| FR-11 | Query PhishTank and Google Safe Browsing; cache in Firestore. | Missing | Settings toggles and About text mention them. | No live API calls, no API keys, no backend proxy, no Firestore cache. |
| FR-12 | Combine sub-scores into final 0-100 score and levels. | Mostly present | `getLevel(score)` maps SAFE/SUSPICIOUS/PHISHING. | Score is heuristic/randomized, not ML-backed. |
| FR-13 | Generate plain-English report with indicators and recommended action. | Partial | Result UI shows indicators and explanations. | Recommended action is minimal; no saved full report object/PDF. |
| FR-14 | Send email alert if result is PHISHING. | Missing/simulated | Toast says alert sent. | No email service or notification pipeline. |
| FR-15 | Register via Firebase Authentication and send confirmation email. | Partial | `auth.js` creates Firebase users and Firestore docs. | No email verification/confirmation flow; local demo user system remains. |
| FR-16 | Login issues Firebase JWT token; invalid credentials return error. | Partial | Firebase sign-in attempted after local user check. | App does not use Bearer JWT for API calls because no API exists; local demo auth bypasses Firebase. |
| FR-17 | Role-based access; users see only own results, admins all. | Partial | UI role navigation exists. | History is local and not securely partitioned; no server enforcement. |
| FR-18 | Paginated history filterable by date and risk level. | Partial | History table with search, level, and type filters. | No pagination; no date filter; data is localStorage only. |
| FR-19 | Download past report as PDF from Firebase Cloud Storage. | Missing | CSV export exists. | No PDF generation, Cloud Storage, or report URL. |

### Use Case Coverage

| Use Case | Status | Notes |
| --- | --- | --- |
| UC-01 Registration | Partial | Firebase registration exists, but no confirmation email. |
| UC-02 Login | Partial | Demo and Firebase login exist. |
| UC-03 Manage Profile | Partial | Local profile edit exists. |
| UC-04 Submit Email for Analysis | Partial | Pasted text only; no `.eml` or plugin/API. |
| UC-05 Submit URL for Analysis | Mostly present | URL scan exists with heuristic analysis. |
| UC-06 View Analysis Report | Mostly present | UI report exists after analysis. |
| UC-07 Download Report | Mostly missing | CSV history export only; no PDF report download. |
| UC-08 View History | Present as local feature | Not database-backed or paginated. |
| UC-09 Search & Filter History | Partial | Search, type, level exist; date filter missing. |
| UC-10 Report False Positive | Missing | No feedback workflow. |
| UC-11 Manage Users | Partial | Admin can manage local users only. |
| UC-12 Configure System Settings | Partial | Local toggles exist; no backend effects. |
| UC-13 Manage Blacklist / Whitelist | Missing | Not implemented. |
| UC-14 View Admin Dashboard | Partial | Dashboard exists, but not true admin-wide backend data. |
| UC-15 View Threat Analytics | Partial | Static/simulated analytics. |
| UC-16 Export Analytics Report | Missing | No export feature for analytics. |
| UC-17 Trigger Model Retraining | Simulated | Toast only; no model pipeline. |
| UC-18 Send Alert | Simulated/missing | Toast only; no email alert. |
| UC-19 Access REST API | Missing | No REST API exists. |

## Major Missing Functions

### 1. Backend and API Layer

Missing:

- REST API endpoints.
- Firebase Cloud Functions or Python/Flask backend.
- Bearer JWT verification.
- OpenAPI 3.0 documentation.
- API input/output contracts.
- Multipart `.eml` upload endpoint.
- JSON URL analysis endpoint.
- Job-status endpoint.
- Report-download endpoint.

Recommended API endpoints:

```text
POST /api/auth/verify
POST /api/analyse/email
POST /api/analyse/url
GET  /api/jobs/{jobId}
GET  /api/reports/{reportId}
GET  /api/history
POST /api/feedback/false-positive
GET  /api/admin/users
POST /api/admin/blacklist
GET  /api/admin/analytics
POST /api/admin/retrain
```

### 2. Real Persistence

Current state:

- Most data is stored in `localStorage`.
- Firebase Firestore is used only in registration/login profile sync.

Missing:

- Firestore collections from SRS:
  - `users`
  - `email_analyses`
  - `url_analyses`
  - `domain_blacklist`
  - `indicator_rules`
  - `audit_log`
- Per-user history storage.
- Admin-wide history queries.
- Domain reputation cache.
- Audit log in Firestore.
- Firestore Security Rules.

### 3. Email Analysis Pipeline

Missing:

- `.eml` upload.
- RFC 5322 parsing.
- Header parsing.
- SPF validation.
- DKIM validation.
- DMARC validation.
- HTML parsing.
- Link extraction with safe DOM parser.
- Link-by-link URL module invocation.
- Email size handling up to 5 MB.
- Async job ID return.

### 4. URL Threat Intelligence

Missing:

- PhishTank lookup.
- Google Safe Browsing lookup.
- Backend API key protection.
- Firestore domain cache.
- Cache expiry.
- WHOIS lookup.
- DNS record lookup.
- URL shortener expansion.
- Proper URL tokenizer.
- Formal 15-feature URL vector.

### 5. ML/NLP Model

Current state:

- JavaScript keyword/rule scoring.
- UI claims Random Forest and 95.2% accuracy.

Missing:

- Training dataset.
- Feature extraction pipeline.
- Trained model file.
- Model inference endpoint.
- Evaluation metrics.
- Accuracy, precision, recall, F1-score report.
- False positive measurement.
- Monthly retraining pipeline.
- Model versioning.

Recommended first model path:

1. Use UCI phishing dataset for URL features.
2. Train baseline Random Forest in Python.
3. Save model with `joblib`.
4. Expose `/api/analyse/url` through backend.
5. Add a separate email text classifier later.

### 6. Reports and Downloads

Missing:

- Full report JSON persistence.
- Recommended action section.
- PDF generation.
- Firebase Cloud Storage upload.
- Secure report download URL.
- Report page for past results.

Current substitute:

- History CSV export in `history.js`.

### 7. Admin Features

Missing:

- Blacklist management.
- Whitelist management.
- Threat log backed by Firestore.
- Analytics based on real database data.
- Export analytics report.
- Real model retraining trigger.
- Admin actions synced with Firebase Auth/Firestore.

### 8. Security and Compliance

Missing or weak:

- Plaintext local demo passwords should be removed.
- No bcrypt or equivalent because no backend password system exists.
- No server-side rate limiting.
- No server-side input sanitization.
- No API auth middleware.
- No Firestore Security Rules included.
- No deletion policy for email content after 7 days.
- No consent/privacy notice.
- No XSS-safe rendering for all user-provided content.

### 9. Testing

Missing:

- Unit tests.
- System tests.
- Firebase Emulator tests.
- Analysis scoring tests.
- Auth tests.
- Role access tests.
- Performance tests.
- 80% coverage target.

## SRS Quality Notes

The SRS is detailed and useful, but it contains some scope and consistency issues that should be cleaned up before final submission or implementation planning.

### Strong parts of the SRS

- Clear problem statement and target users.
- Functional requirements are understandable.
- Risk score mapping is precise.
- Use cases cover visitor, user, admin, and developer actors.
- Non-functional targets are measurable.
- DFD and sequence sections describe a realistic pipeline.

### Issues in the SRS

| Issue | Why it matters | Suggested correction |
| --- | --- | --- |
| React frontend specified, but current project is vanilla JS. | Development and SRS mismatch. | Either migrate frontend to React or update SRS to say vanilla JS static app for v1 prototype. |
| Python/Flask backend deployed via Firebase Cloud Functions. | Firebase Cloud Functions normally use Node.js/TypeScript; Python functions exist in Google Cloud Functions but this needs clearer wording. | Say "Firebase Cloud Functions/Google Cloud Functions backend" or choose one backend stack. |
| Database is sometimes Firestore, sometimes PostgreSQL. | Confusing architecture. | Pick Firestore for Firebase architecture, or PostgreSQL for Flask server architecture. |
| Celery/Redis appears in sequence diagram, while SRS later says Firebase Cloud Tasks/Pub/Sub. | Two different queue designs. | Use one queue design consistently. |
| Passwords mention bcrypt, but Firebase Auth manages passwords internally. | Firebase Auth does not expose bcrypt handling to app code. | Say "passwords managed by Firebase Auth; no plaintext storage." |
| 95% accuracy claimed without model artifact. | Needs evidence. | Add model evaluation appendix only after training/testing exists. |

## What Is Already Good

- The UI direction is strong and close to the product idea.
- Visitor mode exists and matches the SRS actor model.
- Login/register flows are present.
- Role-based navigation exists.
- Email and URL analysis screens exist.
- Risk score levels match the SRS thresholds.
- Reports show indicators in plain English.
- History exists.
- Admin user management exists.
- Settings and analytics pages exist.
- The project is simple to deploy as a static site.

## Immediate Next Steps

### Priority 1: Make Current Prototype Honest and Stable

1. Remove or fix the bare Firebase imports in `index.html`.
2. Add strict URL validation before URL analysis.
3. Add date filter and pagination to History.
4. Add a "recommended action" field to reports.
5. Add "Report false positive" button and local feedback storage.
6. Add blacklist/whitelist UI backed by localStorage first.
7. Remove plaintext passwords from local demo mode or clearly mark demo-only.
8. Add tests for `analyseEmail`, `analyseURL`, and `getLevel`.

### Priority 2: Add Real Backend Foundation

1. Choose backend architecture:
   - Option A: Firebase-first: Firebase Functions + Firestore + Cloud Storage.
   - Option B: Python-first: FastAPI/Flask + PostgreSQL + Redis/Celery.
2. Create REST endpoints for email and URL analysis.
3. Verify Firebase JWT on backend.
4. Move history writes from localStorage to Firestore/backend.
5. Add audit log writes to backend.
6. Add API response format matching the SRS:

```json
{
  "risk_score": 82,
  "risk_level": "PHISHING",
  "indicators": [],
  "report_url": "...",
  "timestamp": "..."
}
```

### Priority 3: Implement Real URL Intelligence

1. Add backend URL parser.
2. Add URL feature extractor.
3. Add DNS lookup.
4. Add WHOIS lookup.
5. Add PhishTank API.
6. Add Google Safe Browsing API.
7. Add Firestore domain cache.
8. Add graceful fallback if APIs fail.

### Priority 4: Implement Real Email Pipeline

1. Add `.eml` upload support.
2. Parse headers and body.
3. Verify SPF/DKIM/DMARC.
4. Extract links from HTML safely.
5. Run URL analysis on each link.
6. Aggregate sender, body, and link sub-scores.
7. Save full report JSON.

### Priority 5: Add Model and Evaluation

1. Collect dataset.
2. Train baseline Random Forest.
3. Produce metrics:
   - Accuracy.
   - Precision.
   - Recall.
   - F1-score.
   - False positive rate.
4. Save model artifact.
5. Add inference endpoint.
6. Add retraining script.
7. Add model version metadata.

### Priority 6: Reports, Alerts, and Admin Completion

1. Generate PDF reports.
2. Upload PDFs to Cloud Storage.
3. Add report download button per history item.
4. Send email alert for `PHISHING`.
5. Build admin blacklist/whitelist management.
6. Build real analytics from stored analyses.
7. Add analytics export.

## Recommended Build Roadmap

### Phase 1: Prototype Completion

Goal: Make the existing static app internally complete.

Deliverables:

- Better validation.
- Local false-positive reporting.
- Local blacklist/whitelist.
- Date-filtered/paginated history.
- Recommended actions in report.
- Basic tests.

Expected score after Phase 1:

**5.0 / 10**

### Phase 2: Backend MVP

Goal: Move core data and analysis behind an API.

Deliverables:

- REST API.
- Firebase JWT verification.
- Firestore persistence.
- API-backed history.
- Audit log in Firestore.
- Job ID workflow.

Expected score after Phase 2:

**6.5 / 10**

### Phase 3: Real Threat Intelligence

Goal: Replace simulated URL intelligence with real checks.

Deliverables:

- PhishTank.
- Google Safe Browsing.
- WHOIS.
- DNS.
- Domain cache.
- API fallback behavior.

Expected score after Phase 3:

**7.5 / 10**

### Phase 4: ML and Reporting

Goal: Match the AI/reporting claims.

Deliverables:

- Trained model.
- Evaluation report.
- Inference endpoint.
- PDF report generation.
- Cloud Storage downloads.
- Email alerts.

Expected score after Phase 4:

**8.5 / 10**

### Phase 5: Production Readiness

Goal: Meet non-functional requirements.

Deliverables:

- Rate limiting.
- Security rules.
- Sanitization.
- Load/performance testing.
- 80% test coverage.
- OpenAPI 3.0 docs.
- Privacy/data retention policy.
- Monitoring.

Expected score after Phase 5:

**9.0+ / 10**

## Final Assessment

Your development currently stands at **4.0 / 10 against the SRS**.

The strongest part is the frontend product experience: it already looks and behaves like PhishGuard AI at a demo level. The weakest part is that the SRS promises a full backend, real APIs, real ML, cloud storage, asynchronous jobs, PDF reports, and security controls that are not yet implemented.

Best way forward: keep the current frontend as the UI prototype, then build the backend/API layer next. Once real persistence and real URL intelligence exist, the project score will jump quickly.

