import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVICE = ROOT / "ai-service" / "app"
if str(SERVICE.parent) not in sys.path:
    sys.path.insert(0, str(SERVICE.parent))

from app import detection  # noqa: E402
