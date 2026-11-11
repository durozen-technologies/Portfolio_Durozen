import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

logger = logging.getLogger("durozen.database")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = settings.DATABASE_URL
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_database():
    try:
        logger.info(f"Connecting to database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to PostgreSQL database!")

        # Create tables
        from . import models
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema verified and tables created.")

        # Ensure image_url column exists in existing database tables
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE projects ADD COLUMN image_url TEXT"))
                conn.commit()
                logger.info("Verified/Added 'image_url' column in projects table.")
            except Exception:
                pass
    except Exception as e:
        logger.error(f"PostgreSQL connection or table initialization failed: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
