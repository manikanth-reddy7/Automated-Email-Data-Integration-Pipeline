import sys
import os
import datetime

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.services.db_service import init_db, SessionLocal
from backend.app.services.mongo_service import mongo_db, raw_collection, invalid_collection
from backend.app.services.etl_service import run_etl_pipeline
from backend.app.models import EmailMetadata, PipelineRun

def run_integration_test():
    print("=== STARTING INTEGRATION TEST ===")
    
    # 1. Initialize databases
    print("1. Initializing SQL Relational DB tables...")
    init_db()
    
    # Clear old data for a clean test run
    print("Clearing old test data from SQL and NoSQL databases...")
    db = SessionLocal()
    db.query(EmailMetadata).delete()
    db.query(PipelineRun).delete()
    db.commit()
    
    if mongo_db is not None:
        raw_collection.delete_many({})
        invalid_collection.delete_many({})
    else:
        print("[WARNING] MongoDB is not running or available. MongoDB checks will be skipped.")
    
    # 2. Register pipeline run
    print("2. Registering new pipeline run...")
    run_entry = PipelineRun(
        file_name="emails.csv",
        status="RUNNING",
        started_at=datetime.datetime.utcnow()
    )
    db.add(run_entry)
    db.commit()
    db.refresh(run_entry)
    run_id = run_entry.run_id
    print(f"Registered Run ID: {run_id}")
    
    # 3. Execute ETL pipeline
    sample_csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_data", "emails.csv")
    print(f"3. Running ETL Pipeline on sample data: {sample_csv_path}")
    run_etl_pipeline(sample_csv_path, run_id)
    
    # 4. Verify results
    print("4. Verifying Relational DB results (PostgreSQL/SQLite)...")
    db.refresh(run_entry)
    print(f"Pipeline Run Final Status: {run_entry.status}")
    print(f"Total Records Extracted: {run_entry.total_records}")
    print(f"Valid Records Count: {run_entry.valid_records}")
    print(f"Invalid Records Count: {run_entry.invalid_records}")
    
    assert run_entry.status == "SUCCESS", "Pipeline status should be SUCCESS"
    assert run_entry.total_records == 10, f"Expected 10 total records, got {run_entry.total_records}"
    assert run_entry.valid_records == 7, f"Expected 7 valid records, got {run_entry.valid_records}"
    assert run_entry.invalid_records == 3, f"Expected 3 invalid records, got {run_entry.invalid_records}"
    
    valid_sql_emails = db.query(EmailMetadata).all()
    print(f"Found {len(valid_sql_emails)} email records in Relational DB metadata table.")
    assert len(valid_sql_emails) == 7, f"Expected 7 valid email records in SQL, got {len(valid_sql_emails)}"
    
    # Verify duplicates were removed (E101 should only have 1 record)
    e101_records = db.query(EmailMetadata).filter(EmailMetadata.email_id == 'E101').all()
    assert len(e101_records) == 1, f"Expected exactly 1 record for duplicate ID E101, found {len(e101_records)}"
    
    # Verify derived fields
    e101 = e101_records[0]
    assert e101.sender_domain == 'amazon.in', f"Expected sender_domain 'amazon.in', got {e101.sender_domain}"
    assert e101.body_length == 33, f"Expected body_length 33, got {e101.body_length}"
    assert e101.status == 'unread', f"Expected status 'unread', got {e101.status}"
    assert e101.source == 'shopping', f"Expected source 'shopping', got {e101.source}"
    
    # Verify status override
    e107 = db.query(EmailMetadata).filter(EmailMetadata.email_id == 'E107').first()
    assert e107.status == 'unread', f"Expected status 'unread' as default for empty value, got {e107.status}"
    
    # 5. Verify NoSQL MongoDB results
    if mongo_db is not None:
        print("5. Verifying NoSQL MongoDB results...")
        mongo_valid_count = raw_collection.count_documents({})
        mongo_invalid_count = invalid_collection.count_documents({})
        
        print(f"MongoDB raw_emails count: {mongo_valid_count}")
        print(f"MongoDB invalid_emails count: {mongo_invalid_count}")
        
        assert mongo_valid_count == 7, f"Expected 7 raw documents in MongoDB, got {mongo_valid_count}"
        assert mongo_invalid_count == 3, f"Expected 3 invalid documents in MongoDB, got {mongo_invalid_count}"
        
        # Verify invalid records contain validation errors list
        invalid_docs = list(invalid_collection.find())
        for doc in invalid_docs:
            print(f"Invalid record Email ID: {doc.get('email_id')} | Errors: {doc.get('validation_errors')}")
            assert 'validation_errors' in doc, "Invalid MongoDB documents must have validation_errors field"
            assert len(doc['validation_errors']) > 0, "validation_errors list must not be empty"
            
    print("=== INTEGRATION TEST PASSED SUCCESSFULLY ===")
    db.close()

if __name__ == "__main__":
    run_integration_test()
