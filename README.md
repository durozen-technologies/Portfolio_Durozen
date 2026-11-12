# DUROZEN - Creative Portfolio

A premium, minimal, interactive portfolio for DUROZEN featuring realistic gravity logo physics, immersive project reveals, an interactive Admin Portal, and a FastAPI + PostgreSQL backend.

## Architecture

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, Motion, Three.js
- **Backend:** FastAPI, Python 3.12, PostgreSQL (SQLAlchemy), Playwright (automated screenshots)
- **Deployment:** Docker & Docker Compose with multistage builds

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- Python 3.10+ (for local backend development) or Docker

### 1. Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Backend Setup

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Start the FastAPI backend:
   ```bash
   npm run backend
   ```
   Or from the backend directory:
   ```bash
   python run.py
   ```

   The backend will be available at [http://localhost:8000](http://localhost:8000) with interactive Swagger documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Docker Deployment (Recommended)

Run the full stack (Frontend, Backend, and PostgreSQL) with Docker Compose:

```bash
docker compose up -d --build
```

### Admin Portal

Manage portfolio projects, client demos, and automated screenshots via the Admin Portal:
- URL: [http://localhost:3000/admin](http://localhost:3000/admin)
- For detailed setup and credentials, see [README_ADMIN.md](README_ADMIN.md).

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js application for production
- `npm run start` - Start production Next.js server
- `npm run backend` - Start FastAPI backend server
- `npm run backend:test` - Run backend API test suite
- `npm run lint` - Run TypeScript type checking
