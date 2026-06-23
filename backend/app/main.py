import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.services.db_service import init_db
from backend.app.routes import upload, pipeline, dashboard, emails

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Automated Email Data Integration Pipeline API",
    description="Backend API for managing email data ingestion, cleaning, and storage.",
    version="1.0.0"
)

# CORS Configuration
# React frontend typically runs on http://localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api prefix
app.include_router(upload.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(emails.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    logger.info("Initializing relational database tables on startup...")
    init_db()
    logger.info("Application startup check complete.")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": "2026-06-23T18:37:16+05:30",
        "app": "Email ETL Backend"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
