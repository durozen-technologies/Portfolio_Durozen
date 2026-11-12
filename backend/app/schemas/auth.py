from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Admin username or email")
    password: str = Field(..., min_length=1, description="Admin password")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

class CreateAdminRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)

class CreateAdminResponse(BaseModel):
    success: bool
    message: str
    username: str

class AdminStatusResponse(BaseModel):
    needsSetup: bool
    hasAdmin: bool
    totalAdmins: int

class AdminProfileResponse(BaseModel):
    authenticated: bool
    username: str
    role: str = "admin"
