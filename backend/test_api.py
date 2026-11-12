import sys
import os
import io

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Auto-detect local virtual environments if packages are not in global site-packages
for venv_candidate in [
    os.path.join(BASE_DIR, "..", "test_venv", "lib", f"python{sys.version_info.major}.{sys.version_info.minor}", "site-packages"),
    os.path.join(BASE_DIR, "..", ".venv", "lib", f"python{sys.version_info.major}.{sys.version_info.minor}", "site-packages"),
    os.path.join(BASE_DIR, "venv", "lib", f"python{sys.version_info.major}.{sys.version_info.minor}", "site-packages"),
]:
    abs_site = os.path.abspath(venv_candidate)
    if os.path.exists(abs_site) and abs_site not in sys.path:
        sys.path.insert(0, abs_site)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from unittest.mock import patch

# Mock screenshot background tasks during testing to ensure fast, deterministic, offline execution
async def _mock_background_capture(project_id: str, url: str):
    return None

patch("app.api.v1.projects.background_capture_screenshot", _mock_background_capture).start()

# Configure in-memory SQLite database for deterministic standalone testing
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Import app components
from app.core.database import Base, get_db
from app.main import app

# Create tables in test database
Base.metadata.create_all(bind=test_engine)

# Override get_db dependency for tests
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


def test_full_backend_suite():
    print("=======================================================")
    print("  DUROZEN Backend API - Automated Verification Suite")
    print("=======================================================\n")

    with TestClient(app) as client:
        # 1. Health check
        print("1. Testing GET /api/health and /health...")
        r = client.get("/api/health")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data["status"] == "healthy"
        assert "databaseConnected" in data
        assert "databaseType" in data
        print("   [PASS] /api/health returned healthy status")

        r_v1 = client.get("/api/v1/health")
        assert r_v1.status_code == 200
        assert r_v1.json()["status"] == "healthy"
        print("   [PASS] /api/v1/health returned healthy status")

        r_root_health = client.get("/health")
        assert r_root_health.status_code == 200
        print("   [PASS] Root /health endpoint alias working")

        # 2. Auth status when empty
        print("\n2. Testing GET /api/auth/status...")
        r = client.get("/api/auth/status")
        assert r.status_code == 200
        auth_status = r.json()
        assert auth_status["needsSetup"] is True, f"Expected needsSetup=True on clean DB, got {auth_status}"
        assert auth_status["hasAdmin"] is False
        assert auth_status["totalAdmins"] == 0
        print(f"   [PASS] Clean Auth status: needsSetup={auth_status['needsSetup']}, totalAdmins={auth_status['totalAdmins']}")

        # 3. Setup first administrator
        print("\n3. Testing POST /api/auth/setup-first-admin...")
        admin_creds = {"username": "admin@durozen.com", "password": "SuperSecretPassword2026!"}
        r = client.post("/api/auth/setup-first-admin", json=admin_creds)
        assert r.status_code == 200, f"Setup first admin failed: {r.text}"
        token_data = r.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        assert token_data["username"] == admin_creds["username"]
        admin_token = token_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {admin_token}"}
        print("   [PASS] First admin created and JWT token generated")

        # 3b. Verify auth status after first admin setup
        r_after = client.get("/api/auth/status")
        assert r_after.status_code == 200
        auth_status_after = r_after.json()
        assert auth_status_after["needsSetup"] is False
        assert auth_status_after["hasAdmin"] is True
        assert auth_status_after["totalAdmins"] == 1
        # Verify root-level and trailing slash aliases for auth status
        r_root_status = client.get("/auth/status")
        assert r_root_status.status_code == 200
        r_slash_status = client.get("/api/auth/status/")
        assert r_slash_status.status_code == 200
        r_v1_status = client.get("/api/v1/auth/status")
        assert r_v1_status.status_code == 200
        print("   [PASS] Root, v1, and trailing-slash aliases for /api/auth/status working")

        # 4. Attempt setup again (must be blocked)
        r_blocked = client.post("/api/auth/setup-first-admin", json={"username": "hacker", "password": "password123"})
        assert r_blocked.status_code == 400
        # Verify form data is also processed properly without 422
        r_blocked_form = client.post("/api/auth/setup-first-admin", data={"username": "hacker_form", "password": "password123"})
        assert r_blocked_form.status_code == 400
        print("   [PASS] Secondary setup-first-admin blocked as expected (400 for both JSON and Form)")

        # 5. Login verification
        print("\n4. Testing POST /api/auth/login...")
        # Root, v1, and trailing-slash login aliases
        r_root_login = client.post("/auth/login", json=admin_creds)
        assert r_root_login.status_code == 200
        r_slash_login = client.post("/api/auth/login/", json=admin_creds)
        assert r_slash_login.status_code == 200
        r_v1_login = client.post("/api/v1/auth/login", json=admin_creds)
        assert r_v1_login.status_code == 200
        print("   [PASS] Root, v1, and trailing-slash aliases for /api/auth/login working")

        # Correct credentials (Form Data)
        r_form_login = client.post("/api/auth/login", data=admin_creds)
        assert r_form_login.status_code == 200
        assert "access_token" in r_form_login.json()
        print("   [PASS] Successful login with form-encoded credentials")

        # Incorrect credentials
        r_bad_login = client.post("/api/auth/login", json={"username": "admin@durozen.com", "password": "wrongpassword"})
        assert r_bad_login.status_code == 401
        print("   [PASS] Invalid login rejected with 401 Unauthorized (JSON)")

        # Incorrect credentials (Form Data)
        r_bad_form_login = client.post("/api/auth/login", data={"username": "admin@durozen.com", "password": "wrongpassword"})
        assert r_bad_form_login.status_code == 401
        print("   [PASS] Invalid login rejected with 401 Unauthorized (Form)")

        # Empty credentials rejected with 400
        assert client.post("/api/auth/login", json={}).status_code == 400
        assert client.post("/api/auth/login", data={}).status_code == 400
        print("   [PASS] Empty credentials correctly rejected with 400 Bad Request")

        # Legacy SHA-256 hash upgrade verification
        from app.models.admin import AdminUser
        from app.core.security import LEGACY_SALT
        import hashlib
        db_mig = TestingSessionLocal()
        legacy_pass = "LegacyTestPassword2026!"
        legacy_hash = hashlib.sha256(f"{LEGACY_SALT}_{legacy_pass}".encode()).hexdigest()
        db_mig.add(AdminUser(id="admin_legacy_mig", username="legacy@durozen.com", password_hash=legacy_hash, role="admin"))
        db_mig.commit()
        db_mig.close()

        r_legacy_login = client.post("/api/auth/login", json={"username": "legacy@durozen.com", "password": legacy_pass})
        assert r_legacy_login.status_code == 200, f"Legacy login failed: {r_legacy_login.text}"
        db_mig2 = TestingSessionLocal()
        migrated_admin = db_mig2.query(AdminUser).filter(AdminUser.username == "legacy@durozen.com").first()
        assert migrated_admin.password_hash.startswith("$2b$"), "Legacy hash should auto-upgrade to bcrypt"
        db_mig2.close()
        print("   [PASS] Legacy SHA-256 hash verified and transparently auto-upgraded to bcrypt")

        # Direct security functions and edge cases verification
        from app.core.security import verify_password, get_password_hash, pwd_context
        test_h = get_password_hash("test_pwd_2026")
        assert test_h.startswith("$2b$")
        assert verify_password("test_pwd_2026", test_h) is True
        assert verify_password("wrong_password", test_h) is False
        assert verify_password("", test_h) is False
        assert verify_password("test_pwd_2026", "") is False
        assert verify_password("test_pwd_2026", "invalid_corrupt_hash") is False
        assert verify_password(None, test_h) is False
        assert verify_password("test_pwd_2026", None) is False
        assert verify_password(12345, test_h) is False
        assert pwd_context.verify("test_pwd_2026", test_h) is True
        assert pwd_context.verify(legacy_pass, legacy_hash) is True
        assert pwd_context.needs_update(test_h) is False
        assert pwd_context.needs_update(legacy_hash) is True
        assert pwd_context.identify(test_h) == "bcrypt"
        assert pwd_context.identify(legacy_hash) == "sha256"
        assert pwd_context.identify("") is None
        print("   [PASS] Direct bcrypt security wrapper and boundary validation passed")

        # Verify OpenAPI documentation includes requestBody for login and setup-first-admin
        openapi_spec = app.openapi()
        login_post = openapi_spec["paths"]["/api/auth/login"]["post"]
        assert "requestBody" in login_post
        assert "application/json" in login_post["requestBody"]["content"]
        assert "application/x-www-form-urlencoded" in login_post["requestBody"]["content"]

        setup_post = openapi_spec["paths"]["/api/auth/setup-first-admin"]["post"]
        assert "requestBody" in setup_post
        assert "application/json" in setup_post["requestBody"]["content"]
        assert "application/x-www-form-urlencoded" in setup_post["requestBody"]["content"]
        print("   [PASS] OpenAPI documentation properly includes JSON and Form request bodies")

        # 6. Protected /api/auth/me
        print("\n5. Testing GET /api/auth/me...")
        r_me = client.get("/api/auth/me", headers=auth_headers)
        assert r_me.status_code == 200
        assert r_me.json()["username"] == admin_creds["username"]
        assert r_me.json()["authenticated"] is True
        print("   [PASS] /api/auth/me authenticated successfully")

        # Unauthenticated request must fail
        r_unauth = client.get("/api/auth/me")
        assert r_unauth.status_code == 401
        print("   [PASS] Unauthenticated request to /api/auth/me correctly rejected (401)")

        # 7. Register secondary admin
        print("\n6. Testing POST /api/auth/register-admin...")
        secondary_admin = {"username": "sachin@durozen.com", "password": "SecurePassword987!"}
        r_reg = client.post("/api/auth/register-admin", json=secondary_admin, headers=auth_headers)
        assert r_reg.status_code == 200
        assert r_reg.json()["success"] is True
        print("   [PASS] Secondary administrator registered successfully")

        # Short password validation
        r_bad_reg = client.post("/api/auth/register-admin", json={"username": "short", "password": "123"}, headers=auth_headers)
        assert r_bad_reg.status_code in (400, 422)
        print("   [PASS] Short password correctly rejected")

        # 8. Seed default projects
        print("\n7. Testing POST /api/projects/seed...")
        r_seed = client.post("/api/projects/seed", headers=auth_headers)
        assert r_seed.status_code == 200
        seed_result = r_seed.json()
        assert seed_result["success"] is True
        assert seed_result["seededCount"] == 10
        print(f"   [PASS] Seeded {seed_result['seededCount']} demo projects")

        # 9. List projects
        print("\n8. Testing GET /api/projects...")
        r_list = client.get("/api/projects")
        assert r_list.status_code == 200
        projects = r_list.json()
        assert len(projects) == 10
        print(f"   [PASS] Retrieved {len(projects)} projects")

        # 10. Filter by category
        print("\n9. Testing GET /api/projects?category=Beauty...")
        r_beauty = client.get("/api/projects?category=Beauty")
        assert r_beauty.status_code == 200
        beauty_projects = r_beauty.json()
        assert len(beauty_projects) > 0
        assert all(p["category"] == "Beauty" for p in beauty_projects)
        print(f"   [PASS] Category filter returned {len(beauty_projects)} Beauty projects")

        # 11. Search projects
        print("\n10. Testing GET /api/projects?search=scooter...")
        r_search = client.get("/api/projects?search=scooter")
        assert r_search.status_code == 200
        search_results = r_search.json()
        assert len(search_results) >= 1
        assert any(p["id"] == "scootyy" for p in search_results)
        print(f"   [PASS] Keyword search found {len(search_results)} project(s)")

        # Tag search inside JSON array
        r_tag_search = client.get("/api/projects?search=Ophthalmology")
        assert r_tag_search.status_code == 200
        assert any(p["id"] == "eye-hospital" for p in r_tag_search.json())
        print("   [PASS] Tag search in JSON array correctly matched 'eye-hospital'")

        # 12. Get single project
        print("\n11. Testing GET /api/projects/makeover...")
        r_single = client.get("/api/projects/makeover")
        assert r_single.status_code == 200
        assert r_single.json()["name"] == "Makeover Studio"
        print("   [PASS] Single project fetch by ID verified")

        r_404 = client.get("/api/projects/non-existent-demo-project")
        assert r_404.status_code == 404
        print("   [PASS] Missing project ID correctly returned 404")

        # 13. Create project
        print("\n12. Testing POST /api/projects (Create)...")
        new_proj_payload = {
            "name": "Zenith AI Hyperdrive",
            "category": "Automotive",
            "tagline": "Next-gen intelligent EV platform",
            "description": "High-performance interactive EV platform showcasing battery telemetry and automated booking.",
            "url": "https://zenith-ai.netlify.app",
            "accentColor": "#E52521",
            "accentBadge": "Automotive",
            "year": "2026",
            "client": "Zenith Motors",
            "tags": ["EV Telemetry", "Showroom", "Netlify Live"],
            "highlights": ["3D Visualizer", "Instant Booking"],
            "imageUrl": "/uploads/zenith_hero.jpg",
        }
        r_create = client.post("/api/projects", json=new_proj_payload, headers=auth_headers)
        assert r_create.status_code == 201, f"Create project failed: {r_create.text}"
        created_proj = r_create.json()
        created_id = created_proj["id"]
        assert created_proj["name"] == new_proj_payload["name"]
        assert created_proj["domain"] == "zenith-ai.netlify.app"
        assert created_proj["imageUrl"] == "/uploads/zenith_hero.jpg"
        assert created_proj["accentColor"] == "#E52521"
        assert created_proj["accentBadge"] == "Automotive"
        assert created_proj["isActive"] is True
        assert created_proj["createdAt"] is not None
        print(f"   [PASS] Created project '{created_proj['name']}' with ID: {created_id} (createdAt={created_proj['createdAt']})")

        # 14. Update project
        print(f"\n13. Testing PUT /api/projects/{created_id} (Update)...")
        update_payload = {
            "tagline": "Updated intelligent EV platform slogan",
            "year": "2027",
            "url": "https://brand-new-zenith-ev.netlify.app",
        }
        r_update = client.put(f"/api/projects/{created_id}", json=update_payload, headers=auth_headers)
        assert r_update.status_code == 200
        updated_proj = r_update.json()
        assert updated_proj["tagline"] == "Updated intelligent EV platform slogan"
        assert updated_proj["year"] == "2027"
        assert updated_proj["domain"] == "brand-new-zenith-ev.netlify.app"
        print("   [PASS] Project updated successfully with auto domain recalculation")

        # 15. Trigger screenshot
        print(f"\n14. Testing POST /api/projects/{created_id}/screenshot...")
        r_shot = client.post(f"/api/projects/{created_id}/screenshot", headers=auth_headers)
        assert r_shot.status_code == 200
        assert r_shot.json()["success"] is True
        print("   [PASS] Screenshot generation task queued successfully")

        # 16. Upload file
        print("\n15. Testing POST /api/upload...")
        dummy_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4")
        files = {"file": ("test_thumbnail.png", dummy_image, "image/png")}
        r_upload = client.post("/api/upload", files=files, headers=auth_headers)
        assert r_upload.status_code == 200, f"Upload failed: {r_upload.text}"
        upload_data = r_upload.json()
        assert upload_data["success"] is True
        assert upload_data["url"].startswith("/uploads/")
        print(f"   [PASS] Image uploaded successfully -> {upload_data['url']}")

        # Clean up created upload file to keep repository pristine
        from app.core.config import settings
        backend_file = os.path.join(settings.UPLOAD_DIR, upload_data["filename"])
        public_file = os.path.join(settings.PUBLIC_UPLOADS_DIR, upload_data["filename"])
        for p in (backend_file, public_file):
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass

        # Upload invalid extension
        dummy_exe = io.BytesIO(b"MZ\x90\x00")
        files_bad = {"file": ("malicious.exe", dummy_exe, "application/octet-stream")}
        r_upload_bad = client.post("/api/upload", files=files_bad, headers=auth_headers)
        assert r_upload_bad.status_code == 400
        print("   [PASS] Invalid file extension correctly rejected (400)")

        # 17. Delete project
        print(f"\n16. Testing DELETE /api/projects/{created_id}...")
        r_del = client.delete(f"/api/projects/{created_id}", headers=auth_headers)
        assert r_del.status_code == 200
        assert r_del.json()["success"] is True
        print("   [PASS] Project deleted successfully")

        # Verify it no longer exists
        r_del_check = client.get(f"/api/projects/{created_id}")
        assert r_del_check.status_code == 404
        print("   [PASS] Deleted project confirmed absent (404)")

        # 18. CORS Preflight verification
        print("\n17. Testing CORS OPTIONS Preflight...")
        r_cors = client.options(
            "/api/projects",
            headers={
                "Origin": "https://portfolio.durozen.in",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert r_cors.status_code == 200
        assert r_cors.headers.get("access-control-allow-origin") == "https://portfolio.durozen.in"
        print("   [PASS] CORS preflight for https://portfolio.durozen.in properly configured")

        print("\n=======================================================")
        print("  ALL 17 BACKEND SUITE VERIFICATIONS PASSED (100%!)")
        print("=======================================================\n")


if __name__ == "__main__":
    test_full_backend_suite()
