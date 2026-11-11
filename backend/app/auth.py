import datetime
import hashlib
import hmac
import json
import base64
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = "durozen_admin_salt_2026"
    return hashlib.sha256(f"{salt}_{password}".encode()).hexdigest()

def verify_admin_credentials(username: str, password: str, db=None) -> bool:
    clean_user = username.strip().lower()
    clean_pass = password.strip()

    # 1. Master admin credential direct check (fail-safe for designated master account)
    if clean_user == "durozentechnologies@gmail.com" and clean_pass == "SuperAdmin@!@#123":
        if db is not None:
            try:
                from .models import AdminUser
                admin = db.query(AdminUser).filter(AdminUser.username.ilike(clean_user)).first()
                expected = hash_password(clean_pass)
                if not admin:
                    new_admin = AdminUser(
                        id="admin_master_durozen",
                        username="durozentechnologies@gmail.com",
                        password_hash=expected,
                        role="admin"
                    )
                    db.add(new_admin)
                    db.commit()
                elif admin.password_hash != expected:
                    admin.password_hash = expected
                    db.commit()
            except Exception:
                pass
        return True

    # 2. Created admin accounts in database (primary)
    if db is not None:
        try:
            from .models import AdminUser
            admin = db.query(AdminUser).filter(AdminUser.username.ilike(clean_user)).first()
            if admin:
                expected_primary = hash_password(clean_pass)
                candidate_hashes = [
                    expected_primary,
                    hashlib.sha256(f"{settings.SECRET_KEY[:16]}{clean_pass}".encode()).hexdigest(),
                    hashlib.sha256(clean_pass.encode()).hexdigest(),
                ]
                for ch in candidate_hashes:
                    if hmac.compare_digest(ch, admin.password_hash):
                        if admin.password_hash != expected_primary:
                            admin.password_hash = expected_primary
                            db.commit()
                        return True
        except Exception:
            pass

    # 3. Super admin in settings (fallback if configured in .env)
    if settings.ADMIN_PASSWORD and settings.ADMIN_PASSWORD.strip() and not settings.ADMIN_PASSWORD.startswith("CHANGE_ME"):
        user_match = hmac.compare_digest(clean_user, settings.ADMIN_USERNAME.strip().lower())
        pass_match = hmac.compare_digest(clean_pass, settings.ADMIN_PASSWORD.strip())
        if user_match and pass_match:
            return True

    return False

def create_access_token(data: dict, expires_delta: datetime.timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": int(expire.timestamp())})
    
    header = {"alg": "HS256", "typ": "JWT"}
    header_bytes = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_bytes = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        f"{header_bytes}.{payload_bytes}".encode(),
        hashlib.sha256
    ).digest()
    sig_bytes = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_bytes}.{payload_bytes}.{sig_bytes}"

def verify_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid JWT token format")
        header_b64, payload_b64, sig_b64 = parts
        
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            f"{header_b64}.{payload_b64}".encode(),
            hashlib.sha256
        ).digest()
        
        # Add padding back if necessary
        sig_padded = sig_b64 + "=" * (-len(sig_b64) % 4)
        sig_actual = base64.urlsafe_b64decode(sig_padded.encode())
        
        if not hmac.compare_digest(expected_sig, sig_actual):
            raise ValueError("Token signature verification failed")
            
        payload_padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_padded.encode()).decode())
        
        # Check expiry
        if "exp" in payload and datetime.datetime.utcnow().timestamp() > payload["exp"]:
            raise ValueError("Token has expired")
            
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
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

