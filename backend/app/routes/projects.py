import re
import uuid
from typing import List, Optional
from urllib.parse import urlparse
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models import Project
from ..schemas import ProjectCreate, ProjectUpdate
from ..auth import get_current_admin
from ..seed_data import seed_default_projects
from ..screenshot_service import capture_website_screenshot

logger = logging.getLogger("durozen.projects")
router = APIRouter(prefix="/api/projects", tags=["projects"])

async def background_capture_screenshot(project_id: str, url: str):
    """Background task to generate and persist screenshot in PostgreSQL."""
    try:
        db = SessionLocal()
        saved_url = await capture_website_screenshot(url, f"{project_id}.jpg")
        if saved_url:
            proj = db.query(Project).filter(Project.id == project_id).first()
            if proj:
                proj.image_url = saved_url
                db.commit()
                logger.info(f"Background screenshot generated & saved for '{project_id}' -> {saved_url}")
        db.close()
    except Exception as e:
        logger.error(f"Error in background screenshot capture for {project_id}: {e}")

def generate_slug(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", name).strip().lower()
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug or str(uuid.uuid4())[:8]

def extract_domain(url: str) -> str:
    try:
        parsed = urlparse(url)
        return parsed.netloc or url
    except Exception:
        return url

@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
def list_projects(
    category: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if not include_inactive:
        query = query.filter(Project.is_active == True)
    if category and category != "All":
        query = query.filter(Project.category == category)
        
    projects = query.order_by(Project.created_at.desc()).all()
    return [p.to_dict() for p in projects]

@router.get("/{project_id}", response_model=dict)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found"
        )
    return project.to_dict()

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    background_tasks: BackgroundTasks,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    project_id = data.id.strip() if data.id else generate_slug(data.name)
    
    # Ensure ID uniqueness
    existing = db.query(Project).filter(Project.id == project_id).first()
    if existing:
        # Append short random suffix
        project_id = f"{project_id}-{str(uuid.uuid4())[:4]}"
        
    domain = data.domain or extract_domain(data.url)
    accent_badge = data.accent_badge or data.category

    # If no custom image uploaded, prepare default screenshot path
    image_url = data.image_url.strip() if data.image_url else f"/screenshots/{project_id}.jpg"

    project = Project(
        id=project_id,
        name=data.name,
        category=data.category,
        tagline=data.tagline or "",
        description=data.description or "",
        url=data.url,
        accent_color=data.accent_color or "#E52521",
        accent_badge=accent_badge,
        year=data.year or "2026",
        client=data.client or "",
        domain=domain,
        image_url=image_url,
        tags=data.tags or [],
        highlights=data.highlights or [],
        is_active=data.is_active if data.is_active is not None else True
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    # Automatically trigger Playwright screenshot in background
    background_tasks.add_task(background_capture_screenshot, project.id, project.url)

    return project.to_dict()

@router.put("/{project_id}", response_model=dict)
@router.put("/{project_id}/", response_model=dict)
def update_project(
    project_id: str,
    data: ProjectUpdate,
    background_tasks: BackgroundTasks,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found"
        )

    old_url = project.url
    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if field == "url" and value and not update_dict.get("domain"):
            project.domain = extract_domain(value)
        setattr(project, field, value)

    # When URL changes, automatically regenerate screenshot if no custom uploaded image
    if "url" in update_dict and update_dict["url"] != old_url:
        background_tasks.add_task(background_capture_screenshot, project.id, update_dict["url"])

    db.commit()
    db.refresh(project)
    return project.to_dict()

@router.post("/{project_id}/screenshot", response_model=dict)
def regenerate_project_screenshot(
    project_id: str,
    background_tasks: BackgroundTasks,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Explicitly regenerate a project's homepage screenshot using Playwright."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found"
        )

    background_tasks.add_task(background_capture_screenshot, project.id, project.url)
    return {
        "success": True, 
        "message": f"Playwright screenshot capture started for '{project.name}'", 
        "id": project_id
    }

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
@router.delete("/{project_id}/", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: str,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found"
        )

    db.delete(project)
    db.commit()
    return {"success": True, "message": f"Project '{project.name}' deleted successfully", "id": project_id}

@router.post("/seed", status_code=status.HTTP_200_OK)
@router.post("/seed/", status_code=status.HTTP_200_OK)
def seed_projects(
    force: bool = Query(False),
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    count = seed_default_projects(db, force=force)
    total = db.query(Project).count()
    return {
        "success": True,
        "message": f"Seeded {count} projects. Total projects in DB: {total}",
        "seededCount": count,
        "totalCount": total
    }

