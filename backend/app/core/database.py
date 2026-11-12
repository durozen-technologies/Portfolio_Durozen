import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

logger = logging.getLogger("durozen.database")

# SQLAlchemy 2.0 Base Class
class Base(DeclarativeBase):
    pass

def create_db_engine():
    db_url = settings.DATABASE_URL
    if settings.is_sqlite:
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
        )
    return create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
    )

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def is_database_connected() -> bool:
    """Quick check to see if database can execute a query."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

def init_database() -> bool:
    """Initialize database tables safely."""
    safe_target = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    try:
        logger.info(f"Connecting to database: {safe_target}")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to database!")

        # Import all models before create_all
        from ..models import AdminUser, Project  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema verified and tables ready.")
        return True
    except Exception as e:
        logger.warning(f"Database connection or initialization skipped: {e}")
        return False

def get_db() -> Generator:
    """FastAPI dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
