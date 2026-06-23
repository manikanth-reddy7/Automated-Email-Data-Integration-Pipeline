import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app import config

router = APIRouter(prefix="/upload", tags=["upload"])
logger = logging.getLogger(__name__)

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """Uploads a CSV or JSON file to the staging directory."""
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    
    if ext not in ['.csv', '.json']:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .csv or .json file.")
    
    # Target file path
    target_path = os.path.join(config.UPLOAD_DIR, filename)
    
    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File uploaded successfully: {filename} to {target_path}")
        return {
            "message": "File uploaded successfully",
            "file_name": filename,
            "file_path": target_path
        }
    except Exception as e:
        logger.error(f"Failed to upload file {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
