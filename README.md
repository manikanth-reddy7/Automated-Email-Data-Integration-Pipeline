# Automated Email Data Integration Pipeline

An end-to-end data ingestion and processing pipeline designed to handle unstructured and semi-structured email data (CSV/JSON), extract metadata, clean and validate fields, and load structured summaries into PostgreSQL (with SQLite fallback) and full raw documents into MongoDB. It includes a modern dashboard built with React + Ant Design.

---

## 🚀 Key Features

*   **Robust ETL Pipeline**: Handled with Python + Pandas (deduplication, column normalization, timestamp standardizing, validation partitioning).
*   **Dual-Database Storage**: Relational SQL (PostgreSQL/SQLite) for fast structured queries and NoSQL (MongoDB) for raw semi-structured document archiving.
*   **Intelligent Database Fallback**: Out-of-the-box local operation using an automatic SQLAlchemy fallback to **SQLite** if a PostgreSQL server is not available.
*   **Airflow Integration & Local runner**: Contains a production-ready Airflow DAG (`airflow/dags/email_etl_pipeline_dag.py`). For easier local development, the backend includes a simulated pipeline runner that executes the DAG tasks synchronously in the background on trigger.
*   **Vibrant Glassmorphic Dashboard**: React + Ant Design interface to upload datasets, monitor stats, inspect pipeline execution logs, filter/search processed records, and view full email bodies from MongoDB.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite) + Ant Design + Vanilla CSS (Custom dark/glassmorphic theme)
*   **Backend API**: FastAPI (Uvicorn web server)
*   **ETL Processor**: Python + Pandas
*   **Orchestration**: Apache Airflow DAG
*   **Relational DB**: PostgreSQL (production) / SQLite (local fallback)
*   **Document DB**: MongoDB (stores raw bodies and invalid records)

---

## 📂 Project Structure

```
email-etl-pipeline/
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Entrypoint & CORS Config
│   │   ├── routes/
│   │   │   ├── upload.py            # File upload endpoint
│   │   │   ├── emails.py            # Paginated SQL query & raw Mongo fetch
│   │   │   ├── dashboard.py         # Dashboard analytics & CSS chart compilation
│   │   │   └── pipeline.py          # Trigger ETL background tasks
│   │   │
│   │   ├── services/
│   │   │   ├── db_service.py        # SQLAlchemy engine (SQLPG/SQLite fallback)
│   │   │   ├── mongo_service.py     # MongoDB client for raw & invalid collections
│   │   │   └── etl_service.py       # Core Pandas ETL clean/transform pipeline
│   │   │
│   │   ├── config.py                # Environment configuration
│   │   └── models.py                # SQLAlchemy Models (emails, pipeline_runs)
│   │
│   ├── uploads/                     # File upload staging folder
│   ├── requirements.txt             # Python packages
│   ├── .env                         # Environment variables
│   └── test_pipeline.py             # Integration test runner
│
├── airflow/
│   └── dags/
│       └── email_etl_pipeline_dag.py # Production Airflow Orchestration DAG
│
├── frontend/                        # React Application
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx           # App Layout & Sidebar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # KPIs, CSS charts, Recent Emails
│   │   │   ├── UploadEmails.jsx     # Drop-zone upload & run triggers
│   │   │   ├── EmailsTable.jsx      # Filters, pagination, MongoDB Drawer preview
│   │   │   └── PipelineRuns.jsx     # Run history and metrics table
│   │   ├── App.jsx                  # State routing manager
│   │   ├── main.jsx                 # Mount point
│   │   └── index.css                # Custom glassmorphic dark theme overrides
│   ├── package.json
│   └── vite.config.js
│
├── sample_data/
│   └── emails.csv                   # Mock emails dataset (valid, invalid, duplicates)
│
└── README.md
```

---

## ⚡ Setup & Installation

### 1. Database Setup
*   Ensure **MongoDB** is running locally on port `27017` (default).
*   *Optional*: Ensure **PostgreSQL** is running on port `5432` if you want to use it. If PostgreSQL is not running, the application will automatically create and use an SQLite database (`backend/email_etl.db`) in your project folder.

### 2. Backend Setup
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Activate the virtual environment:
    *   **Windows**:
        ```powershell
        .\venv\Scripts\activate
        ```
    *   **macOS/Linux**:
        ```bash
        source venv/bin/activate
        ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the integration tests (verifies ETL, database creation, and MongoDB connection):
    ```bash
    python test_pipeline.py
    ```
5.  Start the FastAPI server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

### 3. Frontend Setup
1.  Open a new terminal tab and navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to **`http://localhost:5173`**.

---

## 📊 Pipeline Transformation Rules

*   **Rule 1 (Headers)**: Columns are stripped and lowercased.
*   **Rule 2 (Deduplication)**: Rows with duplicate `email_id`s are dropped (keeps first).
*   **Rule 3 (Mandatory Fields)**: If `email_id`, `sender_email`, or `timestamp` are missing, the row is marked as invalid and loaded into the `invalid_emails` MongoDB collection with error descriptions.
*   **Rule 4 & 5 (Sender Cleaning)**: Senders are lowercased and stripped. If there is no `@`, they are marked invalid. The sender's domain is extracted and saved to `sender_domain` in SQL.
*   **Rule 6 (Timestamp)**: standardizes timestamp using `pd.to_datetime`. Invalid timestamps dump the row to the `invalid_emails` collection.
*   **Rule 7 (Derived Field)**: `body_length` calculates character count.
*   **Rule 8 & 9 (Standardizing)**: `status` defaults to `unread` if empty or invalid. `source` is standardized to lowercase.


##OUTPUT
<img width="1710" height="577" alt="image" src="https://github.com/user-attachments/assets/8c52e5ec-01bb-49d0-a71b-7eda052377c1" />
<img width="1902" height="837" alt="Screenshot 2026-06-23 215603" src="https://github.com/user-attachments/assets/4601342b-5221-4237-8ab2-9aeecbca9646" />
<img width="1900" height="832" alt="Screenshot 2026-06-23 215627" src="https://github.com/user-attachments/assets/6738ff0e-7b43-41dc-a903-ef15a67d6012" />


