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
    salt = settings.SECRET_KEY[:16]
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def verify_admin_credentials(username: str, password: str, db=None) -> bool:
    # 1. Super admin in settings (default)
    if settings.ADMIN_PASSWORD.strip():
        user_match = hmac.compare_digest(username.strip(), settings.ADMIN_USERNAME.strip())
        pass_match = hmac.compare_digest(password.strip(), settings.ADMIN_PASSWORD.strip())
        if user_match and pass_match:
            return True

    # 2. Created admin accounts in database
    if db is not None:
        try:
            from .models import AdminUser
            admin = db.query(AdminUser).filter(AdminUser.username == username.strip()).first()
            if admin:
                expected_hash = hash_password(password.strip())
                if hmac.compare_digest(expected_hash, admin.password_hash):
                    return True
        except Exception:
            pass

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

