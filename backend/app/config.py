import os
import secrets
import logging
from dotenv import load_dotenv

logger = logging.getLogger("durozen.config")

# Load .env from backend directory and/or workspace root
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_root_dir = os.path.dirname(_backend_dir)
load_dotenv(os.path.join(_root_dir, ".env"))
load_dotenv(os.path.join(_backend_dir, ".env"))
load_dotenv()

_INSECURE_PLACEHOLDERS = (
    "",
    "durozen-creative-portfolio-secret-key-change-in-production",
    "durozenAdmin2026!",
)

def _resolve_secret_key() -> str:
    val = os.getenv("SECRET_KEY", "").strip()
    if not val or val in _INSECURE_PLACEHOLDERS or val.startswith("CHANGE_ME"):
        logger.warning(
            "SECRET_KEY is not set or uses a placeholder in .env; generating an ephemeral runtime secret."
        )
        return secrets.token_hex(32)
    return val

def _resolve_admin_password() -> str:
    val = os.getenv("ADMIN_PASSWORD", "").strip()
    if not val or val.startswith("CHANGE_ME"):
        logger.warning(
            "ADMIN_PASSWORD is not configured in .env; default env admin login is disabled."
        )
        return ""
    return val

class Settings:
    _raw_db_url: str = os.getenv("DATABASE_URL", "").strip()

    @property
    def DATABASE_URL(self) -> str:
        url = self._raw_db_url or os.getenv("DATABASE_URL", "").strip()
        if not url:
            # Fallback default for container environment
            url = "postgresql+psycopg2://postgres:durozen_secret_password_2026@db:5432/durozen_db"

        # If running inside Docker container where database is at 'db:5432', auto-correct localhost/127.0.0.1
        if os.path.exists("/.dockerenv") or os.getenv("HOSTNAME"):
            if "@localhost:5432" in url or "@127.0.0.1:5432" in url:
                url = url.replace("@localhost:5432", "@db:5432").replace("@127.0.0.1:5432", "@db:5432")

        if not url.startswith(("postgresql://", "postgresql+psycopg2://", "postgresql+psycopg://")):
            raise RuntimeError(
                "Invalid DATABASE_URL: only PostgreSQL connections are supported."
            )
        if url.startswith("postgresql://"):
            # Ensure psycopg2 driver is used if generic postgresql:// is provided
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    SECRET_KEY: str = _resolve_secret_key()
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = _resolve_admin_password()

    CORS_ORIGINS_RAW: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]

settings = Settings()
