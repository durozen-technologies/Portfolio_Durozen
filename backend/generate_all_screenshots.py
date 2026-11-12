import os
import sys
import asyncio
import logging

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.database import SessionLocal, init_database
from app.models.project import Project
from app.services.screenshot_service import capture_website_screenshot
from app.services.project_service import DEFAULT_PROJECTS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("generate_screenshots")


async def process_all_screenshots():
    logger.info("Initializing database schema...")
    init_database()
    logger.info("Connecting to database...")
    db = SessionLocal()

    db_projects = []
    try:
        db_projects = db.query(Project).all()
        logger.info(f"Retrieved {len(db_projects)} projects from database.")
    except Exception as e:
        logger.error(f"Error querying database: {e}")

    project_map = {}
    for p in db_projects:
        project_map[p.id] = {
            "id": p.id,
            "name": p.name,
            "url": p.url,
            "db_instance": p,
        }

    for fb in DEFAULT_PROJECTS:
        if fb["id"] not in project_map:
            project_map[fb["id"]] = {
                "id": fb["id"],
                "name": fb["name"],
                "url": fb["url"],
                "db_instance": None,
            }

    logger.info(f"Total projects to capture screenshots for: {len(project_map)}")

    success_count = 0
    failure_count = 0

    for pid, pdata in project_map.items():
        name = pdata["name"]
        url = pdata["url"]
        logger.info(f"\n---> Capturing [{pid}] '{name}' ({url})...")

        try:
            filename = f"{pid}.jpg"
            saved_url = await capture_website_screenshot(url, filename)

            if saved_url:
                success_count += 1
                logger.info(f"SUCCESS: Captured {name} -> {saved_url}")

                if pdata["db_instance"]:
                    pdata["db_instance"].image_url = saved_url
                    try:
                        db.commit()
                        logger.info(f"DB Updated: Project '{pid}' image_url = '{saved_url}'")
                    except Exception as db_err:
                        logger.error(f"Failed to commit DB update for {pid}: {db_err}")
                        db.rollback()
            else:
                failure_count += 1
                logger.warning(f"FAILED to capture screenshot for '{name}' ({url})")

        except Exception as e:
            failure_count += 1
            logger.error(f"Exception capturing screenshot for {name}: {e}")

    db.close()
    logger.info("\n=======================================================")
    logger.info("SCREENSHOT GENERATION COMPLETED!")
    logger.info(f"  Success: {success_count}")
    logger.info(f"  Failed:  {failure_count}")
    logger.info("=======================================================\n")


if __name__ == "__main__":
    asyncio.run(process_all_screenshots())
