from fastapi import APIRouter
from ...core.database import is_database_connected
from ...core.config import settings
from ...schemas.project import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    connected = is_database_connected()
    db_type = "sqlite" if settings.is_sqlite else "postgresql"
    return HealthResponse(
        status="healthy",
        service="DUROZEN Portfolio API",
        databaseConnected=connected,
        databaseType=db_type,
    )
