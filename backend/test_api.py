import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

def test_api():
    with TestClient(app) as client:
        print("1. Testing /api/health...")
        r = client.get("/api/health")
        print("   Status:", r.status_code, r.json())
        assert r.status_code == 200

        print("\n2. Testing /api/projects (list default seeded)...")
        r = client.get("/api/projects")
        print("   Status:", r.status_code, f"Loaded {len(r.json())} projects")
        assert r.status_code == 200
        assert len(r.json()) >= 10
        print(f"   First project: {r.json()[0]['name']} ({r.json()[0]['url']})")

        print("\n3. Testing /api/auth/login with configured credentials...")
        r = client.post("/api/auth/login", json={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD})
        print("   Status:", r.status_code)
        assert r.status_code == 200
        token = r.json()["access_token"]
        print("   JWT Access Token obtained successfully.")

        print("\n4. Testing POST /api/projects (Create new demo site)...")
        headers = {"Authorization": f"Bearer {token}"}
        new_project = {
            "name": "Zenith AI Automotive Hub",
            "category": "Automotive",
            "tagline": "Next-gen electric vehicle showroom & telemetry",
            "description": "High-performance interactive EV platform showcasing battery telemetry and automated booking.",
            "url": "https://zenith-auto.netlify.app",
            "accentColor": "#E52521",
            "accentBadge": "Automotive",
            "year": "2026",
            "client": "Zenith Motors",
            "tags": ["EV Telemetry", "Showroom", "Netlify Live"],
            "highlights": ["3D Visualizer", "Instant Booking"]
        }
        r = client.post("/api/projects", json=new_project, headers=headers)
        print("   Status:", r.status_code, "Created site ID:", r.json()["id"])
        assert r.status_code == 201
        created_id = r.json()["id"]

        print(f"\n5. Testing PUT /api/projects/{created_id} (Update)...")
        r = client.put(f"/api/projects/{created_id}", json={"tagline": "Updated EV showroom tagline"}, headers=headers)
        print("   Status:", r.status_code, "Updated tagline:", r.json()["tagline"])
        assert r.status_code == 200
        assert r.json()["tagline"] == "Updated EV showroom tagline"

        print(f"\n6. Testing DELETE /api/projects/{created_id} (Delete)...")
        r = client.delete(f"/api/projects/{created_id}", headers=headers)
        print("   Status:", r.status_code, r.json())
        assert r.status_code == 200

        print("\nSUCCESS: All API tests PASSED perfectly!")

if __name__ == "__main__":
    test_api()
