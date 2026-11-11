import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import engine, Base, SessionLocal
from .models import Project
from .seed_data import seed_default_projects
from .routes import projects, auth, upload

logger = logging.getLogger("durozen.main")
logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Create tables if they do not exist
    try:
        logger.info("Initializing database schema...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")

        # 2. Clean up demo template projects to start with clean portfolio
        db = SessionLocal()
        try:
            demo_ids = [
                "makeover", "eye-hospital", "salon", "nurserie-plant", 
                "resort", "restaurant", "bridal", "mmr-motors", 
                "eye-care", "scootyy"
            ]
            deleted = db.query(Project).filter(Project.id.in_(demo_ids)).delete(synchronize_session=False)
            if deleted > 0:
                db.commit()
                logger.info(f"Purged {deleted} initial demo template projects.")

            # 3. Ensure master admin user always exists and is in sync
            try:
                from .models import AdminUser
                from .auth import hash_password
                master_user = "durozentechnologies@gmail.com"
                master_pass = "SuperAdmin@!@#123"
                master_hash = hash_password(master_pass)

                admin = db.query(AdminUser).filter(AdminUser.username.ilike(master_user)).first()
                if not admin:
                    admin = AdminUser(
                        id="admin_master_durozen",
                        username=master_user,
                        password_hash=master_hash,
                        role="admin"
                    )
                    db.add(admin)
                    db.commit()
                    logger.info(f"Master admin '{master_user}' initialized.")
                else:
                    if admin.password_hash != master_hash:
                        admin.password_hash = master_hash
                        db.commit()
                        logger.info(f"Master admin '{master_user}' password hash synced.")
            except Exception as admin_err:
                logger.warning(f"Note on master admin init: {admin_err}")

        except Exception as err:
            logger.warning(f"Note on demo project cleanup: {err}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error initializing database on startup: {e}")

    yield
    # Shutdown actions if any

app = FastAPI(
    title="DUROZEN Creative Portfolio API",
    description="FastAPI Backend for DUROZEN Creative Portfolio Demo Sites and Admin Portal",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
_cors_origins = list(dict.fromkeys([
    *settings.cors_origins,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(projects.router)
app.include_router(auth.router)
app.include_router(upload.router)

# Mount Static Uploads directory
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Mount Static Screenshots directory (from public/screenshots)
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC_SCREENSHOTS = os.path.join(WORKSPACE_DIR, "public", "screenshots")
os.makedirs(PUBLIC_SCREENSHOTS, exist_ok=True)
app.mount("/screenshots", StaticFiles(directory=PUBLIC_SCREENSHOTS), name="screenshots")

@app.get("/api/auth/status")
@app.get("/api/auth/status/")
@app.get("/auth/status")
def direct_auth_status():
    try:
        from .models import AdminUser
        db = SessionLocal()
        try:
            count = db.query(AdminUser).count()
            return {
                "needsSetup": count == 0,
                "hasAdmin": True,
                "totalAdmins": max(count, 1)
            }
        finally:
            db.close()
    except Exception:
        return {
            "needsSetup": False,
            "hasAdmin": True,
            "totalAdmins": 1
        }

@app.get("/api/health")
@app.get("/api/health/")
@app.get("/health")
def health_check():
    db_connected = False
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy",
        "service": "DUROZEN Portfolio API",
        "databaseConnected": db_connected,
        "databaseType": "postgresql"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to DUROZEN Creative Portfolio API",
        "docs": "/docs",
        "health": "/api/health"
    }

