import os
import pandas as pd
import numpy as np
import datetime
import logging
from sqlalchemy.orm import Session
from backend.app.models import EmailMetadata, PipelineRun
from backend.app.services.mongo_service import insert_raw_emails, insert_invalid_emails
from backend.app.services.db_service import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_etl_pipeline(file_path: str, run_id: int):
    """
    Run the ETL pipeline end-to-end for a given file.
    Updates the pipeline run log in the relational database.
    """
    db: Session = SessionLocal()
    pipeline_run = db.query(PipelineRun).filter(PipelineRun.run_id == run_id).first()
    
    if not pipeline_run:
        logger.error(f"Pipeline run ID {run_id} not found in database.")
        db.close()
        return
    
    try:
        pipeline_run.status = "RUNNING"
        pipeline_run.started_at = datetime.datetime.utcnow()
        db.commit()
        
        logger.info(f"Starting ETL Pipeline for file: {file_path} (Run ID: {run_id})")
        
        # 1. EXTRACT
        df_raw = extract_file(file_path)
        total_records = len(df_raw)
        pipeline_run.total_records = total_records
        db.commit()
        
        # 2. TRANSFORM
        valid_records, invalid_records = transform_data(df_raw)
        
        pipeline_run.valid_records = len(valid_records)
        pipeline_run.invalid_records = len(invalid_records)
        db.commit()
        
        # 3. LOAD
        load_data(valid_records, invalid_records, db)
        
        # 4. COMPLETE
        pipeline_run.status = "SUCCESS"
        pipeline_run.ended_at = datetime.datetime.utcnow()
        db.commit()
        logger.info(f"ETL Pipeline completed successfully for Run ID: {run_id}. Valid: {len(valid_records)}, Invalid: {len(invalid_records)}")
        
    except Exception as e:
        logger.exception(f"ETL Pipeline failed for Run ID {run_id}: {e}")
        pipeline_run.status = "FAILED"
        pipeline_run.ended_at = datetime.datetime.utcnow()
        db.commit()
    finally:
        db.close()

def extract_file(file_path: str) -> pd.DataFrame:
    """Reads a CSV or JSON file into a Pandas DataFrame."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source file not found at: {file_path}")
        
    _, ext = os.path.splitext(file_path.lower())
    if ext == '.csv':
        df = pd.read_csv(file_path)
    elif ext == '.json':
        df = pd.read_json(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only CSV and JSON are supported.")
        
    return df

def transform_data(df: pd.DataFrame):
    """
    Applies transformation and validation rules to the dataframe.
    Splits records into valid and invalid lists of dictionaries.
    """
    # Rule 1: Standardize column names (lowercase & stripped of spaces)
    df.columns = [str(col).strip().lower() for col in df.columns]
    
    # Fill NaN values with None for easier dictionary handling
    df = df.replace({np.nan: None})
    
    valid_records = []
    invalid_records = []
    seen_ids = set()
    
    for idx, row in df.iterrows():
        record = row.to_dict()
        errors = []
        
        # Rule 2: Duplicate validation (unique email_id)
        email_id = record.get('email_id')
        if email_id is not None:
            email_id = str(email_id).strip()
            record['email_id'] = email_id
            
        if not email_id:
            errors.append("email_id missing")
        elif email_id in seen_ids:
            errors.append(f"duplicate email_id: {email_id}")
        else:
            seen_ids.add(email_id)
            
        # Rule 3: Validate sender_email
        sender_email = record.get('sender_email')
        if not sender_email:
            errors.append("sender_email missing")
        else:
            sender_email = str(sender_email).strip().lower() # Rule 4: trim spaces and lowercase
            record['sender_email'] = sender_email
            if '@' not in sender_email:
                errors.append("invalid sender_email format (missing @)")
        
        # Rule 3: Validate timestamp
        timestamp_raw = record.get('timestamp')
        timestamp_parsed = None
        if not timestamp_raw:
            errors.append("timestamp missing")
        else:
            # Rule 6: Standardize timestamp format
            try:
                # Try standard parsing
                timestamp_parsed = pd.to_datetime(timestamp_raw)
                # If timestamp is NaT or out of bounds
                if pd.isna(timestamp_parsed):
                    errors.append("invalid timestamp format")
                else:
                    record['timestamp'] = timestamp_parsed.to_pydatetime()
            except Exception:
                errors.append("invalid timestamp format")
                
        # If there are errors, construct invalid record and skip remaining rules
        if errors:
            record['validation_errors'] = errors
            # Convert timestamp to string if it failed to parse, to avoid JSON serialization errors
            if 'timestamp' in record and not isinstance(record['timestamp'], datetime.datetime):
                record['timestamp'] = str(record['timestamp'])
            invalid_records.append(record)
            continue
            
        # Optional transformations for valid records:
        
        # Rule 5: Extract sender domain
        parts = sender_email.split('@')
        record['sender_domain'] = parts[1] if len(parts) > 1 else None
        
        # Rule 7: Create derived field body_length
        body_text = record.get('body')
        record['body_length'] = len(str(body_text)) if body_text is not None else 0
        
        # Rule 8: Validate status (read/unread), default to unread
        status = record.get('status')
        if status is not None:
            status = str(status).strip().lower()
            if status not in ['read', 'unread']:
                status = 'unread'
        else:
            status = 'unread'
        record['status'] = status
        
        # Rule 9: Source normalization
        source = record.get('source')
        record['source'] = str(source).strip().lower() if source is not None else 'unknown'
        
        # Standardize receiver email if present
        receiver = record.get('receiver_email')
        record['receiver_email'] = str(receiver).strip().lower() if receiver is not None else None
        
        # Standardize subject
        subj = record.get('subject')
        record['subject'] = str(subj).strip() if subj is not None else None
        
        valid_records.append(record)
        
    return valid_records, invalid_records

def load_data(valid_records: list, invalid_records: list, db: Session):
    """Loads valid data into Relational DB and MongoDB, and invalid data into MongoDB."""
    # 1. Load Valid structured metadata to Relational DB
    for record in valid_records:
        # Create EmailMetadata object (ignoring the body field since it is raw content for Mongo)
        email_meta = EmailMetadata(
            email_id=record['email_id'],
            sender_email=record['sender_email'],
            sender_domain=record['sender_domain'],
            receiver_email=record['receiver_email'],
            subject=record['subject'],
            body_length=record['body_length'],
            timestamp=record['timestamp'],
            status=record['status'],
            source=record['source']
        )
        # Use merge to upsert (handles existing primary key smoothly)
        db.merge(email_meta)
    
    db.commit()
    
    # 2. Load Valid full documents to MongoDB (raw_emails)
    if valid_records:
        # Create deep copies of records and add loaded_at for MongoDB
        mongo_valid_docs = []
        for r in valid_records:
            doc = r.copy()
            doc['loaded_at'] = datetime.datetime.utcnow()
            mongo_valid_docs.append(doc)
            
        insert_raw_emails(mongo_valid_docs)
        
    # 3. Load Invalid records to MongoDB (invalid_emails)
    if invalid_records:
        mongo_invalid_docs = []
        for r in invalid_records:
            doc = r.copy()
            doc['loaded_at'] = datetime.datetime.utcnow()
            mongo_invalid_docs.append(doc)
            
        insert_invalid_emails(mongo_invalid_docs)
