# DUROZEN Creative Portfolio - Admin Portal & FastAPI Backend

This document explains how to run, configure, and use the new **Admin Portal** and **FastAPI + PostgreSQL Backend** for managing live client demo websites on the DUROZEN portfolio.

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend

Open a terminal in the project root directory and run:

```bash
npm run backend
```
*Or double click:* `backend\start.bat`

The backend will start at:
- **API URL**: `http://localhost:8000`
- **Swagger Interactive API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

### 2. Start the Frontend Website

In a second terminal:

```bash
npm run dev
```

Visit:
- **Public Portfolio**: `http://localhost:3000`
- **Admin Portal**: `http://localhost:3000/admin`

---

## 🐳 Docker & Docker Compose Quick Start (Recommended)

Run the entire stack (PostgreSQL database, FastAPI backend, and Next.js frontend web service) with a single command using multistage builder images:

```bash
# Build and start all services in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f

# Check health and running status
docker compose ps

# Stop all services
docker compose down
```

### Container Services & Ports:
| Service | Service / Alias Name | Host Port | Internal Port | Technology |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend / Web** | `web` (alias: `frontend`) | Dokploy Traefik / None | `3000` | Next.js Standalone (Multistage) |
| **Backend** | `backend` (alias: `durozen-backend`) | Internal | `8000` | Python 3.12 + FastAPI + Playwright (Multistage) |
| **Database** | `db` | Internal | `5432` | PostgreSQL 16 Alpine (Multistage) |

---

## 🔐 Default Admin Credentials

- **Username**: `admin`
- **Password**: `durozenAdmin2026!`

*(You can customize these anytime in `backend/.env`)*

---

## 🐘 PostgreSQL Configuration

In `backend/.env`, configure your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/durozen_db
```

### Steps to create the local PostgreSQL database:
1. Open pgAdmin or `psql` shell:
   ```sql
   CREATE DATABASE durozen_db;
   ```
2. Put your PostgreSQL username and password in `backend/.env`.
3. Restart the backend (`npm run backend`). It will automatically connect and create the `projects` table!

---

## 🛠️ Admin Portal Features

1. **Add New Demo Sites**:
   - Provide site name, Netlify/live demo URL, category, tagline, description, DUROZEN accent color, client name, and tags.
2. **Instant Live Preview**:
   - Test external links with one click or preview the live site inside an interactive modal.
3. **Edit Demo Sites**:
   - Update URLs, descriptions, or change categories.
4. **Delete Demo Sites**:
   - Remove demo sites with safety confirmation.
5. **Seed Default Sites**:
   - One-click restore to import the 10 original DUROZEN demo projects into PostgreSQL.
6. **Automatic Portfolio Sync**:
   - Any demo site added or modified in the Admin Portal automatically shows up live on the main DUROZEN portfolio home page!

