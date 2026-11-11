from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from ..schemas import TokenResponse, CreateAdminRequest, CreateAdminResponse
from ..auth import verify_admin_credentials, create_access_token, get_current_admin, hash_password
from ..database import get_db
from ..models import AdminUser
from ..config import settings
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/status")
@router.get("/status/")
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
async def setup_first_admin(request: Request, db: Session = Depends(get_db)):
    # Parse payload from JSON or Form
    try:
        body = await request.json()
    except Exception:
        body = {}
    
    username = (body.get("username") or "").strip()
    password = (body.get("password") or "").strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    # Security check: only allowed if no admin exists yet
    if db.query(AdminUser).count() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An administrator already exists. Please log in."
        )

    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    new_admin = AdminUser(
        id=f"admin_{uuid.uuid4().hex[:12]}",
        username=username,
        password_hash=hash_password(password),
        role="admin"
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    access_token = create_access_token(data={"sub": username, "role": "admin"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=username
    )

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, db: Session = Depends(get_db)):
    username = None
    password = None

    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.json()
            username = body.get("username")
            password = body.get("password")
        elif "form" in content_type:
            form = await request.form()
            username = form.get("username")
            password = form.get("password")
        else:
            body = await request.json()
            username = body.get("username")
            password = body.get("password")
    except Exception:
        pass

    username = (username or "").strip()
    password = (password or "").strip()

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    if not verify_admin_credentials(username, password, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": username, "role": "admin"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=username
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

