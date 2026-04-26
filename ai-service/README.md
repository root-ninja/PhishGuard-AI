# PhishGuard AI Service

FastAPI backend implementing the SRS-facing REST API.

Run locally:

```powershell
python -m uvicorn app.main:app --port 8000 --app-dir ai-service
```

OpenAPI docs are available at `http://127.0.0.1:8000/docs`.

The service provides URL/email analysis, `.eml` upload, job status, PDF report downloads, history, false-positive feedback, blacklist/whitelist administration, analytics, retraining metadata, CORS, and request rate limiting. Local JSON storage is used as a development substitute for Firestore/Cloud Storage so the project can run without cloud credentials.
