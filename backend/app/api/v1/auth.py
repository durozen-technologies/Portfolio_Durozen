import json
from urllib.parse import parse_qs
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import get_current_admin, create_access_token
from ...services.auth_service import AuthService
from ...schemas.auth import (
    LoginRequest,
    TokenResponse,
    CreateAdminRequest,
    CreateAdminResponse,
    AdminStatusResponse,
    AdminProfileResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


AUTH_CREDENTIALS_OPENAPI_EXTRA = {
    "requestBody": {
        "content": {
            "application/json": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "username": {
                            "type": "string",
                            "description": "Admin username or email",
                        },
                        "password": {
                            "type": "string",
                            "description": "Admin password",
                        },
                    },
                    "required": ["username", "password"],
                }
            },
            "application/x-www-form-urlencoded": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "username": {
                            "type": "string",
                            "description": "Admin username or email",
                        },
                        "password": {
                            "type": "string",
                            "description": "Admin password",
                        },
                    },
                    "required": ["username", "password"],
                }
            },
        },
        "required": True,
    }
}


async def _extract_credentials(request: Request) -> tuple[str, str]:
    """
    Seamlessly extracts username and password from JSON body, form data,
    or raw body, without raising FastAPI 422 Unprocessable Entity errors.
    """
    if request is None:
        return "", ""

    username = ""
    password = ""
    content_type = request.headers.get("content-type", "").lower()

    # 1. Direct Content-Type matching
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict):
                username = str(body.get("username") or "")
                password = str(body.get("password") or "")
        except Exception:
            pass
    elif "form" in content_type:
        try:
            form = await request.form()
            username = str(form.get("username") or "")
            password = str(form.get("password") or "")
        except Exception:
            pass

    # 2. Universal fallback for missing/unusual content-types or unparsed bodies
    if not username and not password:
        try:
            # Try parsing as JSON first
            body = await request.json()
            if isinstance(body, dict):
                username = str(body.get("username") or "")
                password = str(body.get("password") or "")
        except Exception:
            pass

    if not username and not password:
        try:
            # Try parsing as Form
            form = await request.form()
            username = str(form.get("username") or "")
            password = str(form.get("password") or "")
        except Exception:
            pass

    if not username and not password:
        try:
            # Try raw bytes fallback
            raw_bytes = await request.body()
            if raw_bytes:
                text = raw_bytes.decode("utf-8", errors="ignore").strip()
                try:
                    data = json.loads(text)
                    if isinstance(data, dict):
                        username = str(data.get("username") or "")
                        password = str(data.get("password") or "")
                except Exception:
                    pass

                if not username and not password and "=" in text:
                    parsed = parse_qs(text)
                    username = parsed.get("username", [""])[0]
                    password = parsed.get("password", [""])[0]
        except Exception:
            pass

    return username.strip(), password.strip()


@router.get("/status", response_model=AdminStatusResponse)
@router.get("/status/", response_model=AdminStatusResponse)
def get_auth_status(db: Session = Depends(get_db)):
    return AuthService.get_admin_status(db)


@router.post(
    "/setup-first-admin",
    response_model=TokenResponse,
    openapi_extra=AUTH_CREDENTIALS_OPENAPI_EXTRA,
)
@router.post(
    "/setup-first-admin/",
    response_model=TokenResponse,
    openapi_extra=AUTH_CREDENTIALS_OPENAPI_EXTRA,
)
async def setup_first_admin(
    request: Request,
    db: Session = Depends(get_db),
):
    username, password = await _extract_credentials(request)

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required",
        )

    try:
        result = AuthService.setup_first_admin(db, username, password)
        return TokenResponse(**result)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post(
    "/login",
    response_model=TokenResponse,
    openapi_extra=AUTH_CREDENTIALS_OPENAPI_EXTRA,
)
@router.post(
    "/login/",
    response_model=TokenResponse,
    openapi_extra=AUTH_CREDENTIALS_OPENAPI_EXTRA,
)
async def login(
    request: Request,
    db: Session = Depends(get_db),
):
    username, password = await _extract_credentials(request)

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required",
        )

    authenticated = AuthService.authenticate_admin(db, username, password)
    if not authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": username, "role": "admin"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=username,
    )


@router.post("/register-admin", response_model=CreateAdminResponse)
@router.post("/register-admin/", response_model=CreateAdminResponse)
def register_admin(
    data: CreateAdminRequest,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin),
):
    try:
        admin = AuthService.register_admin(db, data.username, data.password)
        return CreateAdminResponse(
            success=True,
            message=f"Administrator '{admin.username}' created successfully",
            username=admin.username,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=AdminProfileResponse)
@router.get("/me/", response_model=AdminProfileResponse)
def get_me(username: str = Depends(get_current_admin)):
    return AdminProfileResponse(
        authenticated=True,
        username=username,
        role="admin",
    )
