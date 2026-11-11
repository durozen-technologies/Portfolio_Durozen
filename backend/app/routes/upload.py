import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from ..auth import get_current_admin

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

# Target directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
PUBLIC_UPLOADS_DIR = os.path.join(os.path.dirname(BASE_DIR), "public", "uploads")

os.makedirs(BACKEND_UPLOADS_DIR, exist_ok=True)
os.makedirs(PUBLIC_UPLOADS_DIR, exist_ok=True)

@router.post("")
@router.post("/")
async def upload_image(
    file: UploadFile = File(...),
    admin: str = Depends(get_current_admin)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No filename provided"
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Unsupported image file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex[:12]}_{file.filename.replace(' ', '_')}"
    
    # Save to public uploads (served by Vite) and backend uploads
    backend_dest = os.path.join(BACKEND_UPLOADS_DIR, unique_filename)
    public_dest = os.path.join(PUBLIC_UPLOADS_DIR, unique_filename)

    try:
        with open(backend_dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Copy to public/uploads if accessible
        try:
            shutil.copyfile(backend_dest, public_dest)
        except Exception:
            pass
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}"
        )

    # Return relative URL
    return {
        "success": True,
        "url": f"/uploads/{unique_filename}",
        "filename": unique_filename
    }

