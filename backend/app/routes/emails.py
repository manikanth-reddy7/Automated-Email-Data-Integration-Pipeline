from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.models import EmailMetadata
from backend.app.services.db_service import get_db
from backend.app.services.mongo_service import get_raw_email

router = APIRouter(prefix="/emails", tags=["emails"])

@router.get("")
async def get_processed_emails(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    source: str = Query(None),
    db: Session = Depends(get_db)
):
    """Returns a paginated list of processed email metadata with optional search and filters."""
    query = db.query(EmailMetadata)
    
    # Apply search filter (sender or subject)
    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(
            EmailMetadata.sender_email.like(search_term),
            EmailMetadata.subject.like(search_term)
        ))
        
    # Apply status filter
    if status:
        query = query.filter(EmailMetadata.status == status.lower())
        
    # Apply source filter
    if source:
        query = query.filter(EmailMetadata.source == source.lower())
        
    # Get counts for pagination
    total_records = query.count()
    total_pages = (total_records + limit - 1) // limit
    
    # Paginate and fetch
    emails = query.order_by(EmailMetadata.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "emails": emails,
        "total_records": total_records,
        "total_pages": total_pages,
        "current_page": page,
        "limit": limit
    }

@router.get("/{email_id}/raw")
async def get_raw_email_by_id(email_id: str, db: Session = Depends(get_db)):
    """Fetches the raw/full email document from MongoDB by email_id."""
    raw_doc = get_raw_email(email_id)
    
    if raw_doc:
        return raw_doc
        
    # Fallback: if not in MongoDB, check SQL metadata and return a mock with empty body
    sql_doc = db.query(EmailMetadata).filter(EmailMetadata.email_id == email_id).first()
    if sql_doc:
        return {
            "email_id": sql_doc.email_id,
            "sender_email": sql_doc.sender_email,
            "receiver_email": sql_doc.receiver_email,
            "subject": sql_doc.subject,
            "timestamp": str(sql_doc.timestamp),
            "status": sql_doc.status,
            "source": sql_doc.source,
            "sender_domain": sql_doc.sender_domain,
            "body_length": sql_doc.body_length,
            "body": "[Full email body missing in NoSQL storage. Displaying metadata only.]"
        }
        
    raise HTTPException(status_code=404, detail=f"Email ID {email_id} not found.")
