from .core.security import (
    verify_password,
    get_password_hash,
    hash_password,
    create_access_token,
    verify_token,
    get_current_admin,
    security_bearer as security,
)
from .services.auth_service import AuthService


def verify_admin_credentials(username: str, password: str, db=None) -> bool:
    """Check admin credentials using AuthService or fallback."""
    if db is not None:
        return AuthService.authenticate_admin(db, username, password)
    from .core.config import settings
    clean_user = username.strip().lower() if username else ""
    clean_pass = password.strip() if password else ""
    if (
        settings.ADMIN_PASSWORD
        and settings.ADMIN_PASSWORD.strip()
        and not settings.ADMIN_PASSWORD.startswith("CHANGE_ME")
    ):
        return clean_user == settings.ADMIN_USERNAME.lower() and clean_pass == settings.ADMIN_PASSWORD
    return False


__all__ = [
    "verify_password",
    "get_password_hash",
    "hash_password",
    "create_access_token",
    "verify_token",
    "get_current_admin",
    "security",
    "verify_admin_credentials",
]
