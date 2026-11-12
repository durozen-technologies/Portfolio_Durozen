import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from ...core.config import settings
from ...core.security import get_current_admin
from ...core.utils import sanitize_filename
from ...schemas.project import UploadResponse

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


@router.post("", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    admin: str = Depends(get_current_admin),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Sanitize and create unique filename
    unique_filename = sanitize_filename(file.filename)

    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(settings.PUBLIC_UPLOADS_DIR, exist_ok=True)
    except Exception:
        pass

    backend_dest = os.path.join(settings.UPLOAD_DIR, unique_filename)
    public_dest = os.path.join(settings.PUBLIC_UPLOADS_DIR, unique_filename)

    total_size = 0
    try:
        with open(backend_dest, "wb") as buffer:
            while chunk := await file.read(1024 * 64):  # 64 KB chunks
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    buffer.close()
                    if os.path.exists(backend_dest):
                        os.remove(backend_dest)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File exceeds maximum allowed size of 15 MB",
                    )
                buffer.write(chunk)

        # Mirror to public uploads directory if accessible
        try:
            shutil.copyfile(backend_dest, public_dest)
        except Exception:
            pass

    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(backend_dest):
            try:
                os.remove(backend_dest)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}",
        )

    return UploadResponse(
        success=True,
        url=f"/uploads/{unique_filename}",
        filename=unique_filename,
    )
