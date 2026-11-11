# ==========================================
# Backend - Multistage Dockerfile
# ==========================================

# Stage 1: Build virtual environment with dependencies
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies for compiling Python extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install python dependencies into virtualenv
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime image
FROM python:3.12-slim AS runner

WORKDIR /app

# Install runtime system libraries, libatomic1 for playwright node driver, and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    libatomic1 \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy installed virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install Playwright chromium browser & dependencies in shared path
RUN mkdir -p /ms-playwright && \
    (playwright install --with-deps chromium || true) && \
    chmod -R 755 /ms-playwright && \
    rm -rf /var/lib/apt/lists/*

# Create non-root application user
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home appuser

# Copy application source code
COPY . /app

# Ensure runtime directories exist, seed existing screenshots, and set non-root ownership
RUN mkdir -p /app/uploads/screenshots /public/screenshots /public/uploads && \
    cp -r /app/uploads/screenshots/* /public/screenshots/ 2>/dev/null || true && \
    chown -R appuser:appgroup /app /public

USER appuser

# Expose backend API port
EXPOSE 8000

# Health check against /api/health endpoint
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start FastAPI server using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
