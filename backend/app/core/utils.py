import os
import re
import uuid
from urllib.parse import urlparse
from .config import settings

def generate_slug(name: str) -> str:
    """Generate a clean, URL-safe slug from project name."""
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", name).strip().lower()
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug or str(uuid.uuid4())[:8]

def extract_domain(url: str) -> str:
    """Extract domain netloc from URL."""
    try:
        parsed = urlparse(url)
        return parsed.netloc or url
    except Exception:
        return url

def sanitize_filename(filename: str) -> str:
    """Safely sanitize filename removing directory traversal characters."""
    base = os.path.basename(filename)
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", base)
    return f"{uuid.uuid4().hex[:12]}_{clean}"

def ensure_storage_dirs() -> None:
    """Ensure all required media and upload directories exist on disk."""
    for d in [
        settings.UPLOAD_DIR,
        settings.SCREENSHOTS_DIR,
        settings.PUBLIC_UPLOADS_DIR,
        settings.PUBLIC_SCREENSHOTS_DIR,
    ]:
        try:
            os.makedirs(d, exist_ok=True)
        except Exception:
            pass
