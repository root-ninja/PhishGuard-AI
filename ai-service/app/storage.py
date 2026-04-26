from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
REPORT_DIR = DATA_DIR / "reports"
STORE_PATH = DATA_DIR / "store.json"


DEFAULT_STORE: dict[str, Any] = {
    "jobs": {},
    "reports": {},
    "history": [],
    "feedback": [],
    "domain_blacklist": ["paypa1-secure.login-verify.com", "account-verify.example"],
    "domain_whitelist": ["google.com", "microsoft.com", "apple.com", "github.com"],
    "indicator_rules": [],
    "audit_log": [],
    "domain_cache": {},
    "model": {
        "version": "rf-url-baseline-2026.04",
        "accuracy": 0.952,
        "precision": 0.948,
        "recall": 0.961,
        "f1_score": 0.954,
        "false_positive_rate": 0.018,
        "last_retrained": "2026-04-26T00:00:00+00:00",
        "training_samples": 11055,
    },
}


def ensure_store() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    if not STORE_PATH.exists():
        save_store(DEFAULT_STORE.copy())


def load_store() -> dict[str, Any]:
    ensure_store()
    try:
        data = json.loads(STORE_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        data = DEFAULT_STORE.copy()
    for key, value in DEFAULT_STORE.items():
        data.setdefault(key, value.copy() if isinstance(value, dict) else list(value) if isinstance(value, list) else value)
    return data


def save_store(data: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")


def audit(action: str, actor: dict[str, Any], target: str = "") -> None:
    data = load_store()
    data["audit_log"].insert(
        0,
        {
            "time": datetime.now(timezone.utc).isoformat(),
            "user": actor.get("email") or actor.get("uid") or "system",
            "action": action,
            "target": target,
        },
    )
    data["audit_log"] = data["audit_log"][:500]
    save_store(data)


def report_path(report_id: str) -> Path:
    return REPORT_DIR / f"{report_id}.pdf"
