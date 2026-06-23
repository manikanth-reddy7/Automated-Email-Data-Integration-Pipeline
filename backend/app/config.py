import os
from dotenv import load_dotenv

load_dotenv()

# Base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Relational Database Config
# By default, use PostgreSQL. If it's not set or fails, we fall back to local SQLite.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/email_etl")
SQLITE_FALLBACK_URL = f"sqlite:///{os.path.join(BASE_DIR, 'email_etl.db')}"

# MongoDB Config
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "email_etl")

# Upload Staging Folder
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))

# Ensure uploads directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
