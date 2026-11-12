from .services.project_service import (
    DEFAULT_PROJECTS,
    ProjectService,
)


def seed_default_projects(db, force: bool = False) -> int:
    return ProjectService.seed_default_projects(db, force=force)


__all__ = ["DEFAULT_PROJECTS", "seed_default_projects"]
