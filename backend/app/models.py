from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class EmailMetadata(Base):
    __tablename__ = "emails"

    email_id = Column(String(50), primary_key=True)
    sender_email = Column(String(255), nullable=False)
    sender_domain = Column(String(255))
    receiver_email = Column(String(255))
    subject = Column(Text)
    body_length = Column(Integer)
    timestamp = Column(DateTime)
    status = Column(String(20))
    source = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    run_id = Column(Integer, primary_key=True, autoincrement=True)
    file_name = Column(String(255))
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    status = Column(String(50))  # RUNNING, SUCCESS, FAILED
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
