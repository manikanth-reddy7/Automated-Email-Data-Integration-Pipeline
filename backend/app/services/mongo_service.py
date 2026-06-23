import logging
from pymongo import MongoClient
from backend.app import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_client = None
mongo_db = None
raw_collection = None
invalid_collection = None

def initialize_mongodb():
    global mongo_client, mongo_db, raw_collection, invalid_collection
    try:
        logger.info(f"Connecting to MongoDB at: {config.MONGO_URL}")
        # Short timeout to fail fast if MongoDB is not running
        mongo_client = MongoClient(config.MONGO_URL, serverSelectionTimeoutMS=3000)
        # Test connection
        mongo_client.server_info()
        mongo_db = mongo_client[config.MONGO_DB_NAME]
        raw_collection = mongo_db["raw_emails"]
        invalid_collection = mongo_db["invalid_emails"]
        logger.info(f"Successfully connected to MongoDB. Database: {config.MONGO_DB_NAME}")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}. PyMongo calls will fail.")
        # Create a mock or fallback mechanism so python doesn't crash on startup
        mongo_client = None
        mongo_db = None
        raw_collection = None
        invalid_collection = None

# Initialize connection
initialize_mongodb()

def insert_raw_emails(emails: list):
    """Insert valid full raw email documents to MongoDB."""
    if raw_collection is None:
        logger.warning("MongoDB is not available. Skipping raw emails insertion.")
        return False
    if not emails:
        return True
    try:
        # Convert timestamp objects or other non-serializable objects to string or keep as is?
        # PyMongo handles datetime objects directly, which is great.
        result = raw_collection.insert_many(emails, ordered=False)
        logger.info(f"Inserted {len(result.inserted_ids)} raw documents into MongoDB.")
        return True
    except Exception as e:
        logger.error(f"Error inserting raw emails into MongoDB: {e}")
        return False

def insert_invalid_emails(emails: list):
    """Insert invalid email records to MongoDB invalid_emails collection."""
    if invalid_collection is None:
        logger.warning("MongoDB is not available. Skipping invalid emails insertion.")
        return False
    if not emails:
        return True
    try:
        result = invalid_collection.insert_many(emails, ordered=False)
        logger.info(f"Inserted {len(result.inserted_ids)} invalid documents into MongoDB.")
        return True
    except Exception as e:
        logger.error(f"Error inserting invalid emails into MongoDB: {e}")
        return False

def get_raw_email(email_id: str):
    """Retrieve full raw email document from MongoDB by email_id."""
    if raw_collection is None:
        logger.warning("MongoDB is not available. Cannot fetch raw email.")
        return None
    try:
        # Find one and return as dict, exclude _id to avoid ObjectId serialization issue
        doc = raw_collection.find_one({"email_id": email_id}, {"_id": 0})
        return doc
    except Exception as e:
        logger.error(f"Error retrieving raw email {email_id}: {e}")
        return None
