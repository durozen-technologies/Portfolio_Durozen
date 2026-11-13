import os
import logging
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("durozen.config")

# Project directories
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(APP_DIR)
WORKSPACE_DIR = os.path.dirname(BACKEND_DIR)

# Fallback stable dev secret key
DEFAULT_DEV_SECRET = "durozen_portfolio_production_ready_secret_key_2026_secure"


class Settings(BaseSettings):
    # App Information
    PROJECT_NAME: str = "DUROZEN Creative Portfolio API"
    API_V1_PREFIX: str = "/api"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = ""

    # Security & JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Admin Credentials
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""
    MASTER_ADMIN_EMAIL: str = "durozentechnologies@gmail.com"
    MASTER_ADMIN_PASSWORD: str = ""

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000"

    # Static Storage Paths
    UPLOAD_DIR: str = os.path.join(BACKEND_DIR, "uploads")
    SCREENSHOTS_DIR: str = os.path.join(BACKEND_DIR, "uploads", "screenshots")
    PUBLIC_UPLOADS_DIR: str = os.path.join(WORKSPACE_DIR, "public", "uploads")
    PUBLIC_SCREENSHOTS_DIR: str = os.path.join(WORKSPACE_DIR, "public", "screenshots")

    # Screenshot Capture Viewport
    SCREENSHOT_VIEWPORT_WIDTH: int = 1440
    SCREENSHOT_VIEWPORT_HEIGHT: int = 900
    SCREENSHOT_TIMEOUT_MS: int = 20000

    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(WORKSPACE_DIR, ".env"),
            os.path.join(BACKEND_DIR, ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def resolve_database_url(cls, v: str) -> str:
        url = (v or "").strip()
        if not url:
            # Check environment directly
            url = os.getenv("DATABASE_URL", "").strip()

        if not url:
            # Fallback default for container or local dev
            if os.path.exists("/.dockerenv") or os.getenv("DOCKER_CONTAINER"):
                url = "postgresql+psycopg2://postgres:durozen_secret_password_2026@db:5432/durozen_db"
            else:
                # Local dev fallback - use stable absolute path to durozen.db inside backend directory
                sqlite_path = os.path.join(BACKEND_DIR, "durozen.db")
                url = os.getenv("LOCAL_DATABASE_URL", f"sqlite:///{sqlite_path}")

        # Docker container host adjustment
        is_container = bool(os.path.exists("/.dockerenv") or os.getenv("DOCKER_CONTAINER"))
        if is_container:
            if "@localhost:5432" in url or "@127.0.0.1:5432" in url:
                url = url.replace("@localhost:5432", "@db:5432").replace("@127.0.0.1:5432", "@db:5432")
        else:
            # Outside Docker: if URL targets Docker internal 'db' hostname, switch to SQLite for local dev
            if "@db:5432" in url:
                sqlite_path = os.path.join(BACKEND_DIR, "durozen.db")
                url = os.getenv("LOCAL_DATABASE_URL", f"sqlite:///{sqlite_path}")

        # Ensure standard driver prefix for postgresql
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

        return url

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def resolve_secret_key(cls, v: str) -> str:
        val = (v or "").strip()
        if not val or val.startswith("CHANGE_ME"):
            env_val = os.getenv("SECRET_KEY", "").strip()
            if env_val and not env_val.startswith("CHANGE_ME"):
                return env_val
            return DEFAULT_DEV_SECRET
        return val

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            origins = list(self.CORS_ORIGINS)
        elif isinstance(self.CORS_ORIGINS, str):
            origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        else:
            origins = []

        defaults = [
            "https://portfolio.durozen.in",
            "http://portfolio.durozen.in",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ]
        for d in defaults:
            if d not in origins:
                origins.append(d)
        return origins

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


settings = Settings()
