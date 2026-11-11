import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from ..schemas import LoginRequest, TokenResponse, CreateAdminRequest, CreateAdminResponse
from ..auth import verify_admin_credentials, create_access_token, get_current_admin, hash_password
from ..database import get_db
from ..models import AdminUser
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/status")
def get_auth_status(db: Session = Depends(get_db)):
    db_admins_count = db.query(AdminUser).count()
    has_env_admin = bool(
        settings.ADMIN_PASSWORD
        and settings.ADMIN_PASSWORD.strip()
        and not settings.ADMIN_PASSWORD.startswith("CHANGE_ME")
    )
    needs_setup = (db_admins_count == 0 and not has_env_admin)
    return {
        "needsSetup": needs_setup,
        "hasAdmin": (db_admins_count > 0 or has_env_admin),
        "totalAdmins": db_admins_count
    }

@router.post("/setup-first-admin", response_model=TokenResponse)
def setup_first_admin(data: CreateAdminRequest, db: Session = Depends(get_db)):
    # Security check: only allowed if no admin exists yet
    if db.query(AdminUser).count() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An administrator already exists. Please log in."
        )

    clean_user = data.username.strip()
    clean_pass = data.password.strip()

    if len(clean_user) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    if len(clean_pass) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    new_admin = AdminUser(
        id=f"admin_{uuid.uuid4().hex[:12]}",
        username=clean_user,
        password_hash=hash_password(clean_pass),
        role="admin"
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    access_token = create_access_token(data={"sub": clean_user, "role": "admin"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=clean_user
    )

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    if not verify_admin_credentials(data.username, data.password, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": data.username, "role": "admin"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=data.username
    )

@router.post("/register-admin", response_model=CreateAdminResponse)
def register_admin(
    data: CreateAdminRequest, 
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):
    clean_user = data.username.strip()
    clean_pass = data.password.strip()

    if len(clean_user) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    if len(clean_pass) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    # Check if username clashes with default admin
    if clean_user.lower() == settings.ADMIN_USERNAME.lower():
        raise HTTPException(status_code=400, detail="An administrator with this username already exists")

    # Check if already in database
    existing = db.query(AdminUser).filter(AdminUser.username == clean_user).first()
    if existing:
        raise HTTPException(status_code=400, detail="An administrator with this username already exists")

    new_admin = AdminUser(
        id=f"admin_{uuid.uuid4().hex[:12]}",
        username=clean_user,
        password_hash=hash_password(clean_pass),
        role="admin"
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return CreateAdminResponse(
        success=True,
        message=f"Administrator '{clean_user}' created successfully",
        username=clean_user
    )

@router.get("/me")
def get_me(username: str = Depends(get_current_admin)):
    return {
        "authenticated": True,
        "username": username,
        "role": "admin"
    }

