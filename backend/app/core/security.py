import datetime
import hashlib
import hmac
from typing import Optional, Dict, Any
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from .config import settings


class _DirectBcryptContext:
    """Direct bcrypt context providing CryptContext compatibility without passlib."""

    @staticmethod
    def verify(plain: str, hashed: str) -> bool:
        return verify_password(plain, hashed)

    @staticmethod
    def hash(secret: str) -> str:
        return get_password_hash(secret)

    @staticmethod
    def needs_update(hashed: str) -> bool:
        if not hashed or not isinstance(hashed, str):
            return True
        return not hashed.startswith(("$2a$", "$2b$", "$2y$", "$2x$"))

    @staticmethod
    def identify(hashed: str) -> Optional[str]:
        if not hashed or not isinstance(hashed, str):
            return None
        if hashed.startswith(("$2a$", "$2b$", "$2y$", "$2x$")):
            return "bcrypt"
        return "sha256"


# Password hashing context with direct bcrypt
pwd_context = _DirectBcryptContext()

# HTTP Bearer scheme
security_bearer = HTTPBearer(auto_error=False)

LEGACY_SALT = "durozen_admin_salt_2026"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash, supporting modern bcrypt and legacy SHA-256 hashes.
    """
    if not hashed_password or not plain_password:
        return False

    if isinstance(plain_password, bytes):
        plain_str = plain_password.decode("utf-8", errors="ignore")
    elif isinstance(plain_password, str):
        plain_str = plain_password
    else:
        return False

    if isinstance(hashed_password, bytes):
        hash_str = hashed_password.decode("utf-8", errors="ignore")
    elif isinstance(hashed_password, str):
        hash_str = hashed_password
    else:
        return False

    # 1. Standard Bcrypt check
    if hash_str.startswith(("$2a$", "$2b$", "$2y$", "$2x$")):
        try:
            return bcrypt.checkpw(
                plain_str.encode("utf-8")[:72],
                hash_str.encode("utf-8"),
            )
        except Exception:
            return False

    # 2. Legacy salted SHA-256 check
    legacy_hash = hashlib.sha256(f"{LEGACY_SALT}_{plain_str}".encode()).hexdigest()
    if hmac.compare_digest(legacy_hash, hash_str):
        return True

    # 3. Secret key salted SHA-256 check (legacy compatibility)
    if settings.SECRET_KEY:
        secret_salt_hash = hashlib.sha256(f"{settings.SECRET_KEY[:16]}{plain_str}".encode()).hexdigest()
        if hmac.compare_digest(secret_salt_hash, hash_str):
            return True

    # 4. Plain SHA-256 check
    plain_sha = hashlib.sha256(plain_str.encode()).hexdigest()
    if hmac.compare_digest(plain_sha, hash_str):
        return True

    return False


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt directly."""
    if not password:
        password = ""
    if isinstance(password, bytes):
        pw_bytes = password[:72]
    elif isinstance(password, str):
        pw_bytes = password.encode("utf-8")[:72]
    else:
        pw_bytes = str(password).encode("utf-8")[:72]

    try:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")
    except Exception:
        # Fallback if bcrypt has environment library issues
        return hashlib.sha256(f"{LEGACY_SALT}_{password}".encode()).hexdigest()


def hash_password(password: str) -> str:
    """Alias for backwards compatibility with existing scripts."""
    return get_password_hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> str:
    """FastAPI route dependency to verify admin JWT token and return admin username."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_token(credentials.credentials)
    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username
