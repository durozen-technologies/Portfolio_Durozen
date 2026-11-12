from fastapi import APIRouter
from .health import router as health_router
from .auth import router as auth_router
from .projects import router as projects_router
from .upload import router as upload_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(projects_router)
api_router.include_router(upload_router)

__all__ = ["api_router"]
