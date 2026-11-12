import os
import sys
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print("\n=======================================================")
    print(f"  Starting DUROZEN FastAPI Server on http://{host}:{port}")
    print(f"  Interactive API Docs: http://localhost:{port}/docs")
    print(f"  Health Check: http://localhost:{port}/api/health")
    print("=======================================================\n")
    app_dir = os.path.join(BASE_DIR, "app")
    reload_enabled = os.environ.get("RELOAD", "true").lower() in ("true", "1", "yes")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        app_dir=BASE_DIR,
        reload=reload_enabled,
        reload_dirs=[app_dir] if reload_enabled else None,
    )
