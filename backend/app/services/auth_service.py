import uuid
import logging
from sqlalchemy.orm import Session
from ..models.admin import AdminUser
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from ..core.config import settings

logger = logging.getLogger("durozen.auth_service")


class AuthService:
    @staticmethod
    def get_admin_status(db: Session) -> dict:
        total_admins = db.query(AdminUser).count()
        has_env_admin = bool(
            (settings.ADMIN_PASSWORD and settings.ADMIN_PASSWORD.strip() and not settings.ADMIN_PASSWORD.startswith("CHANGE_ME"))
            or (settings.MASTER_ADMIN_PASSWORD and settings.MASTER_ADMIN_PASSWORD.strip() and not settings.MASTER_ADMIN_PASSWORD.startswith("CHANGE_ME"))
        )
        has_admin = total_admins > 0 or has_env_admin
        needs_setup = not has_admin
        return {
            "needsSetup": needs_setup,
            "hasAdmin": has_admin,
            "totalAdmins": total_admins,
        }

    @staticmethod
    def authenticate_admin(db: Session, username: str, password: str) -> bool:
        clean_user = username.strip().lower()
        clean_pass = password.strip()

        # 1. Check database admins
        try:
            admin = db.query(AdminUser).filter(AdminUser.username.ilike(clean_user)).first()
            if admin and verify_password(clean_pass, admin.password_hash):
                # Auto-upgrade legacy hash to bcrypt if needed
                if not admin.password_hash.startswith("$2b$"):
                    admin.password_hash = get_password_hash(clean_pass)
                    db.commit()
                return True
        except Exception as e:
            logger.error(f"Error checking admin in database: {e}")

        # 2. Designated master admin credentials check (if configured in settings)
        if (
            settings.MASTER_ADMIN_EMAIL
            and settings.MASTER_ADMIN_PASSWORD
            and settings.MASTER_ADMIN_PASSWORD.strip()
            and not settings.MASTER_ADMIN_PASSWORD.startswith("CHANGE_ME")
        ):
            if clean_user == settings.MASTER_ADMIN_EMAIL.lower() and clean_pass == settings.MASTER_ADMIN_PASSWORD.strip():
                # Ensure master admin exists in DB
                try:
                    admin = db.query(AdminUser).filter(AdminUser.username.ilike(clean_user)).first()
                    expected_hash = get_password_hash(clean_pass)
                    if not admin:
                        new_admin = AdminUser(
                            id="admin_master_durozen",
                            username=settings.MASTER_ADMIN_EMAIL,
                            password_hash=expected_hash,
                            role="admin",
                        )
                        db.add(new_admin)
                        db.commit()
                    elif not verify_password(clean_pass, admin.password_hash):
                        admin.password_hash = expected_hash
                        db.commit()
                except Exception:
                    pass
                return True

        # 3. Environment admin fallback check
        if (
            settings.ADMIN_PASSWORD
            and settings.ADMIN_PASSWORD.strip()
            and not settings.ADMIN_PASSWORD.startswith("CHANGE_ME")
        ):
            if clean_user == settings.ADMIN_USERNAME.lower() and clean_pass == settings.ADMIN_PASSWORD:
                return True

        return False

    @staticmethod
    def setup_first_admin(db: Session, username: str, password: str) -> dict:
        total = db.query(AdminUser).count()
        if total > 0:
            raise ValueError("An administrator already exists. Please log in.")

        clean_user = username.strip()
        clean_pass = password.strip()
        if len(clean_user) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(clean_pass) < 6:
            raise ValueError("Password must be at least 6 characters long")

        new_admin = AdminUser(
            id=f"admin_{uuid.uuid4().hex[:12]}",
            username=clean_user,
            password_hash=get_password_hash(clean_pass),
            role="admin",
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)

        access_token = create_access_token(data={"sub": clean_user, "role": "admin"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "username": clean_user,
        }

    @staticmethod
    def register_admin(db: Session, username: str, password: str) -> AdminUser:
        clean_user = username.strip()
        clean_pass = password.strip()

        if len(clean_user) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(clean_pass) < 6:
            raise ValueError("Password must be at least 6 characters long")

        existing = db.query(AdminUser).filter(AdminUser.username.ilike(clean_user)).first()
        if existing:
            raise ValueError(f"An administrator with username '{clean_user}' already exists")

        new_admin = AdminUser(
            id=f"admin_{uuid.uuid4().hex[:12]}",
            username=clean_user,
            password_hash=get_password_hash(clean_pass),
            role="admin",
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        return new_admin

    @staticmethod
    def init_master_admin(db: Session) -> None:
        """Seed master admin user if configured in settings with non-empty password and not already in database."""
        if (
            not settings.MASTER_ADMIN_EMAIL
            or not settings.MASTER_ADMIN_PASSWORD
            or not settings.MASTER_ADMIN_PASSWORD.strip()
            or settings.MASTER_ADMIN_PASSWORD.startswith("CHANGE_ME")
        ):
            return

        clean_email = settings.MASTER_ADMIN_EMAIL.strip().lower()
        clean_pass = settings.MASTER_ADMIN_PASSWORD.strip()

        try:
            admin = db.query(AdminUser).filter(AdminUser.username.ilike(clean_email)).first()
            if not admin:
                master = AdminUser(
                    id="admin_master_durozen",
                    username=settings.MASTER_ADMIN_EMAIL,
                    password_hash=get_password_hash(clean_pass),
                    role="admin",
                )
                db.add(master)
                db.commit()
                logger.info(f"Master admin '{settings.MASTER_ADMIN_EMAIL}' initialized.")
        except Exception as e:
            logger.warning(f"Could not verify master admin on startup: {e}")
