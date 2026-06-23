import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app import config
from backend.app.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Engine and Session initialization
engine = None
SessionLocal = None
is_sqlite = False

def initialize_database():
    global engine, SessionLocal, is_sqlite
    
    # Try PostgreSQL first
    try:
        logger.info(f"Attempting connection to PostgreSQL: {config.DATABASE_URL}")
        # Short timeout to fail fast if Postgres is not running (increased to 15s for remote DBs)
        engine = create_engine(
            config.DATABASE_URL, 
            connect_args={"connect_timeout": 15} if "postgresql" in config.DATABASE_URL else {}
        )
        # Test connection
        conn = engine.connect()
        conn.close()
        logger.info("Successfully connected to PostgreSQL Relational Database.")
        is_sqlite = False
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed: {e}. Falling back to SQLite.")
        logger.info(f"Using SQLite Database at: {config.SQLITE_FALLBACK_URL}")
        engine = create_engine(
            config.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        is_sqlite = True
        
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Run initial setup
initialize_database()

def init_db():
    """Create all database tables if they do not exist."""
    try:
        logger.info("Initializing relational database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Relational database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing relational database tables: {e}")
        raise e

def get_db():
    """FastAPI Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
