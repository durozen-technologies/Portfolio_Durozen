import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import settings
from .core.database import engine, Base, SessionLocal, init_database
from .core.utils import ensure_storage_dirs
from .services.auth_service import AuthService
from .services.project_service import ProjectService
from .api.v1.api import api_router
from .api.v1.health import router as health_router

logger = logging.getLogger("durozen.main")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure storage directories exist
    ensure_storage_dirs()

    # 2. Initialize database schema
    db_connected = init_database()

    # 3. Synchronize master admin user safely if DB is reachable
    if db_connected:
        db = SessionLocal()
        try:
            AuthService.init_master_admin(db)
            if os.getenv("AUTO_SEED", "true").lower() in ("true", "1", "yes"):
                count = ProjectService.seed_default_projects(db, force=False)
                if count > 0:
                    logger.info(f"Auto-seeded {count} projects.")
        except Exception as err:
            logger.warning(f"Note on startup initialization: {err}")
        finally:
            db.close()

    yield
    # Shutdown actions if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI Backend for DUROZEN Creative Portfolio Demo Sites and Admin Portal",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://([a-zA-Z0-9.-]+\.)?durozen\.(in|com)(:\d+)?$|^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single canonical prefix. Trailing slashes are handled by Starlette's
# redirect_slashes, so each endpoint is registered exactly once.
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Also expose /health at root level for external monitors
app.include_router(health_router)

# Mount Static Uploads directory
ensure_storage_dirs()
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount Static Screenshots directory
screenshots_dir = (
    settings.PUBLIC_SCREENSHOTS_DIR
    if os.path.exists(settings.PUBLIC_SCREENSHOTS_DIR)
    else settings.SCREENSHOTS_DIR
)
app.mount("/screenshots", StaticFiles(directory=screenshots_dir), name="screenshots")


@app.get("/")
def root():
    return {
        "message": "Welcome to DUROZEN Creative Portfolio API",
        "docs": "/docs",
        "health": "/api/health",
        "version": "2.0.0",
    }
