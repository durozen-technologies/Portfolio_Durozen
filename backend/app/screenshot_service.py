import os
import shutil
import logging
from typing import Optional

logger = logging.getLogger("durozen.screenshots")
logging.basicConfig(level=logging.INFO)

# Base Paths
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
WORKSPACE_DIR = os.path.dirname(BACKEND_DIR)

PUBLIC_SCREENSHOTS_DIR = os.path.join(WORKSPACE_DIR, "public", "screenshots")
BACKEND_SCREENSHOTS_DIR = os.path.join(BACKEND_DIR, "uploads", "screenshots")

os.makedirs(PUBLIC_SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(BACKEND_SCREENSHOTS_DIR, exist_ok=True)

# Standard desktop viewport (16:10 aspect ratio matching browser mockup card)
VIEWPORT_WIDTH = 1440
VIEWPORT_HEIGHT = 900

# Known browser executable paths on Windows as fallbacks
CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

def get_fallback_executable() -> Optional[str]:
    for p in CHROME_PATHS:
        if os.path.exists(p):
            return p
    return None

async def capture_website_screenshot(url: str, filename: str) -> Optional[str]:
    """
    Captures a real desktop homepage screenshot for a given website URL using Playwright.
    Saves the image to both public/screenshots/ and backend/uploads/screenshots/.
    Returns the relative path '/screenshots/{filename}' on success, or None on failure.
    """
    if not url or url.strip() == "":
        logger.warning("Empty URL provided for screenshot capture.")
        return None

    # Normalize URL
    target_url = url.strip()
    if not (target_url.startswith("http://") or target_url.startswith("https://")):
        target_url = f"https://{target_url}"

    if not filename.endswith(".jpg"):
        filename = f"{filename}.jpg"

    public_dest = os.path.join(PUBLIC_SCREENSHOTS_DIR, filename)
    backend_dest = os.path.join(BACKEND_SCREENSHOTS_DIR, filename)

    logger.info(f"Starting Playwright screenshot capture for '{target_url}' -> {filename}...")

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.warning("Playwright package is not installed; skipping dynamic screenshot capture.")
        return None

    async with async_playwright() as p:
        browser = None
        # 1. Try launching bundled Playwright Chromium
        try:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                ]
            )
        except Exception as e:
            logger.warning(f"Could not launch bundled Chromium ({e}), attempting system Chrome/Edge...")
            fallback_exe = get_fallback_executable()
            if fallback_exe:
                try:
                    browser = await p.chromium.launch(
                        executable_path=fallback_exe,
                        headless=True,
                        args=["--no-sandbox", "--disable-gpu"]
                    )
                except Exception as e2:
                    logger.error(f"Failed to launch system browser ({e2})")
                    return None
            else:
                logger.error("No compatible browser executable found for Playwright.")
                return None

        if not browser:
            return None

        try:
            context = await browser.new_context(
                viewport={"width": VIEWPORT_WIDTH, "height": VIEWPORT_HEIGHT},
                device_scale_factor=1,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            # Navigate to the target website
            try:
                # Try networkidle with a 20s timeout
                await page.goto(target_url, wait_until="networkidle", timeout=20000)
            except Exception:
                try:
                    # Fallback to load/domcontentloaded if networkidle takes longer
                    await page.goto(target_url, wait_until="domcontentloaded", timeout=15000)
                except Exception as nav_err:
                    logger.warning(f"Navigation warning for {target_url}: {nav_err}")

            # Give a brief 2-second pause for animations, web fonts, and hero assets to settle
            try:
                await page.wait_for_timeout(2000)
            except Exception:
                pass

            # Capture desktop homepage view (above-the-fold viewport)
            await page.screenshot(
                path=public_dest,
                full_page=False,
                type="jpeg",
                quality=88
            )

            # Mirror to backend uploads directory
            try:
                shutil.copyfile(public_dest, backend_dest)
            except Exception as copy_err:
                logger.warning(f"Failed to copy screenshot to backend uploads: {copy_err}")

            logger.info(f"Successfully captured screenshot for {target_url} -> {public_dest}")
            return f"/screenshots/{filename}"

        except Exception as capture_err:
            logger.error(f"Failed during page capture for {target_url}: {capture_err}")
            return None
        finally:
            await browser.close()

