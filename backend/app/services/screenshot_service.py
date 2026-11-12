import os
import shutil
import logging
from typing import Optional
from ..core.config import settings
from ..core.database import SessionLocal
from ..models.project import Project

logger = logging.getLogger("durozen.screenshots")

BROWSER_EXECUTABLE_CANDIDATES = [
    # Linux paths
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/snap/bin/chromium",
    # Windows paths
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    # macOS paths
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def find_system_browser() -> Optional[str]:
    """Find installed system browser executable."""
    for path in BROWSER_EXECUTABLE_CANDIDATES:
        if os.path.exists(path):
            return path
    return None


async def capture_website_screenshot(url: str, filename: str) -> Optional[str]:
    """
    Captures a desktop homepage screenshot for a given website URL using Playwright.
    Saves to public screenshots directory and backend uploads directory.
    Returns relative path '/screenshots/{filename}' on success, or None on failure.
    """
    if not url or not url.strip():
        logger.warning("Empty URL provided for screenshot capture.")
        return None

    target_url = url.strip()
    if not (target_url.startswith("http://") or target_url.startswith("https://")):
        target_url = f"https://{target_url}"

    if not filename.endswith(".jpg"):
        filename = f"{filename}.jpg"

    os.makedirs(settings.PUBLIC_SCREENSHOTS_DIR, exist_ok=True)
    os.makedirs(settings.SCREENSHOTS_DIR, exist_ok=True)

    public_dest = os.path.join(settings.PUBLIC_SCREENSHOTS_DIR, filename)
    backend_dest = os.path.join(settings.SCREENSHOTS_DIR, filename)

    logger.info(f"Starting Playwright screenshot capture for '{target_url}' -> {filename}...")

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.warning("Playwright package is not installed; dynamic screenshots unavailable.")
        return None

    try:
        async with async_playwright() as p:
            browser = None
            try:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                    ],
                )
            except Exception as e:
                logger.warning(f"Bundled Chromium launch failed ({e}), searching system browser...")
                fallback_exe = find_system_browser()
                if fallback_exe:
                    try:
                        browser = await p.chromium.launch(
                            executable_path=fallback_exe,
                            headless=True,
                            args=["--no-sandbox", "--disable-gpu"],
                        )
                    except Exception as exe_err:
                        logger.error(f"System browser launch failed ({exe_err})")
                        return None
                else:
                    logger.warning("No compatible browser found for Playwright.")
                    return None

            if not browser:
                return None

            try:
                context = await browser.new_context(
                    viewport={
                        "width": settings.SCREENSHOT_VIEWPORT_WIDTH,
                        "height": settings.SCREENSHOT_VIEWPORT_HEIGHT,
                    },
                    device_scale_factor=1,
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                    ),
                )
                page = await context.new_page()

                try:
                    await page.goto(
                        target_url,
                        wait_until="networkidle",
                        timeout=settings.SCREENSHOT_TIMEOUT_MS,
                    )
                except Exception:
                    try:
                        await page.goto(
                            target_url,
                            wait_until="domcontentloaded",
                            timeout=15000,
                        )
                    except Exception as nav_err:
                        logger.warning(f"Navigation warning for {target_url}: {nav_err}")

                # Give animations and web fonts a moment to settle
                try:
                    await page.wait_for_timeout(2000)
                except Exception:
                    pass

                await page.screenshot(
                    path=public_dest,
                    full_page=False,
                    type="jpeg",
                    quality=88,
                )

                try:
                    shutil.copyfile(public_dest, backend_dest)
                except Exception as copy_err:
                    logger.warning(f"Failed to copy screenshot to backend directory: {copy_err}")

                logger.info(f"Successfully captured screenshot for {target_url} -> {public_dest}")
                return f"/screenshots/{filename}"
            finally:
                await browser.close()

    except Exception as err:
        logger.error(f"Failed during page capture for {target_url}: {err}")
        return None


async def background_capture_screenshot(project_id: str, url: str) -> None:
    """Background task to generate and persist screenshot in database."""
    try:
        saved_url = await capture_website_screenshot(url, f"{project_id}.jpg")
        if saved_url:
            db = SessionLocal()
            try:
                proj = db.query(Project).filter(Project.id == project_id).first()
                if proj:
                    proj.image_url = saved_url
                    db.commit()
                    logger.info(f"Background screenshot saved for '{project_id}' -> {saved_url}")
            except Exception as db_err:
                db.rollback()
                logger.error(f"Failed to update project image_url in DB: {db_err}")
            finally:
                db.close()
    except Exception as e:
        logger.error(f"Error in background screenshot capture for {project_id}: {e}")
