import os
import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app import config
from backend.app.models import PipelineRun
from backend.app.services.db_service import get_db
from backend.app.services.etl_service import run_etl_pipeline
from pydantic import BaseModel

router = APIRouter(prefix="/pipeline", tags=["pipeline"])

class PipelineTriggerRequest(BaseModel):
    file_name: str

@router.post("/run")
async def trigger_pipeline(
    request: PipelineTriggerRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """Triggers the ETL pipeline in the background for a specific uploaded file."""
    file_path = os.path.join(config.UPLOAD_DIR, request.file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {request.file_name} not found in uploads directory.")
    
    # 1. Create entry in pipeline_runs
    new_run = PipelineRun(
        file_name=request.file_name,
        status="RUNNING",
        started_at=datetime.datetime.utcnow()
    )
    db.add(new_run)
    db.commit()
    db.refresh(new_run)
    
    # 2. Add ETL job to FastAPI background tasks
    background_tasks.add_task(run_etl_pipeline, file_path, new_run.run_id)
    
    return {
        "message": "Pipeline started",
        "run_id": new_run.run_id
    }

@router.get("/runs")
async def get_pipeline_runs(db: Session = Depends(get_db)):
    """Returns ETL run history logs."""
    runs = db.query(PipelineRun).order_by(PipelineRun.created_at.desc()).all()
    return runs
