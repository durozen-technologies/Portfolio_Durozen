from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import get_current_admin
from ...services.project_service import ProjectService
from ...services.screenshot_service import background_capture_screenshot
from ...schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    SeedResponse,
    DeleteResponse,
    ScreenshotTriggerResponse,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectResponse])
@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    category: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    projects = ProjectService.get_projects(
        db,
        category=category,
        include_inactive=include_inactive,
        search=search,
    )
    return [p.to_dict() for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
@router.get("/{project_id}/", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = ProjectService.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found",
        )
    return project.to_dict()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    background_tasks: BackgroundTasks,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    project = ProjectService.create_project(db, data)
    # Trigger background screenshot if URL is provided
    if project.url:
        background_tasks.add_task(background_capture_screenshot, project.id, project.url)

    return project.to_dict()


@router.put("/{project_id}", response_model=ProjectResponse)
@router.put("/{project_id}/", response_model=ProjectResponse)
def update_project(
    project_id: str,
    data: ProjectUpdate,
    background_tasks: BackgroundTasks,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = ProjectService.get_project_by_id(db, project_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found",
        )

    old_url = existing.url
    updated = ProjectService.update_project(db, project_id, data)

    # If URL changed, trigger fresh screenshot capture
    if data.url and data.url != old_url:
        background_tasks.add_task(background_capture_screenshot, updated.id, data.url)

    return updated.to_dict()


@router.delete("/{project_id}", response_model=DeleteResponse)
@router.delete("/{project_id}/", response_model=DeleteResponse)
def delete_project(
    project_id: str,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = ProjectService.get_project_by_id(db, project_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found",
        )

    name = existing.name
    ProjectService.delete_project(db, project_id)
    return DeleteResponse(
        success=True,
        message=f"Project '{name}' deleted successfully",
        id=project_id,
    )


@router.post("/{project_id}/screenshot", response_model=ScreenshotTriggerResponse)
@router.post("/{project_id}/screenshot/", response_model=ScreenshotTriggerResponse)
def regenerate_project_screenshot(
    project_id: str,
    background_tasks: BackgroundTasks,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    project = ProjectService.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found",
        )

    background_tasks.add_task(background_capture_screenshot, project.id, project.url)
    return ScreenshotTriggerResponse(
        success=True,
        message=f"Playwright screenshot capture started for '{project.name}'",
        id=project_id,
    )


@router.post("/seed", response_model=SeedResponse)
@router.post("/seed/", response_model=SeedResponse)
def seed_projects(
    force: bool = Query(False),
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    count = ProjectService.seed_default_projects(db, force=force)
    total = len(ProjectService.get_projects(db, include_inactive=True))
    return SeedResponse(
        success=True,
        message=f"Seeded {count} projects. Total projects in DB: {total}",
        seededCount=count,
        totalCount=total,
    )
