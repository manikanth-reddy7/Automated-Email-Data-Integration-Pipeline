from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import EmailMetadata, PipelineRun
from backend.app.services.db_service import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Returns analytics and summary metrics for the email dashboard."""
    # 1. Total emails count
    total_emails = db.query(EmailMetadata).count()
    
    # 2. Unread emails count
    unread_emails = db.query(EmailMetadata).filter(EmailMetadata.status == 'unread').count()
    
    # 3. Distinct senders count
    distinct_senders = db.query(func.count(func.distinct(EmailMetadata.sender_email))).scalar() or 0
    
    # 4. Last run status
    last_run = db.query(PipelineRun).order_by(PipelineRun.created_at.desc()).first()
    last_run_status = last_run.status if last_run else "NO_RUNS"
    
    # 5. Group by source
    source_counts = db.query(EmailMetadata.source, func.count(EmailMetadata.email_id)).group_by(EmailMetadata.source).all()
    emails_by_source = [{"source": source or "unknown", "count": count} for source, count in source_counts]
    
    # 6. Group by status
    status_counts = db.query(EmailMetadata.status, func.count(EmailMetadata.email_id)).group_by(EmailMetadata.status).all()
    emails_by_status = [{"status": status or "unread", "count": count} for status, count in status_counts]
    
    # 7. Recent emails preview (latest 5)
    recent_emails = db.query(EmailMetadata).order_by(EmailMetadata.timestamp.desc()).limit(5).all()
    
    return {
        "total_emails": total_emails,
        "unread_emails": unread_emails,
        "distinct_senders": distinct_senders,
        "last_run_status": last_run_status,
        "emails_by_source": emails_by_source,
        "emails_by_status": emails_by_status,
        "recent_emails": recent_emails
    }
