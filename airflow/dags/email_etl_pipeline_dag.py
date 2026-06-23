from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

# Default arguments for the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2026, 6, 23),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def register_pipeline_run(**kwargs):
    """Task 1: Create a run entry in the database and set status to RUNNING."""
    # In a production DAG, this would import the database services
    # and create the pipeline_runs table entry, returning the run_id.
    print("Registering pipeline run in database...")
    file_name = kwargs.get('dag_run').conf.get('file_name', 'sample_emails.csv')
    # Mocking execution/XCom push for demonstration
    kwargs['ti'].xcom_push(key='run_id', value=12)
    kwargs['ti'].xcom_push(key='file_name', value=file_name)

def extract_email_file(**kwargs):
    """Task 2: Read the uploaded file path and load the raw file."""
    ti = kwargs['ti']
    file_name = ti.xcom_pull(key='file_name', task_ids='register_run')
    file_path = f"backend/uploads/{file_name}"
    print(f"Extracting email file from: {file_path}")
    ti.xcom_push(key='file_path', value=file_path)

def transform_email_data(**kwargs):
    """Task 3: Clean, validate, and split the data into valid/invalid records."""
    ti = kwargs['ti']
    file_path = ti.xcom_pull(key='file_path', task_ids='extract_file')
    print(f"Transforming data for file: {file_path}")
    # In production, this imports and invokes our Pandas transform function:
    # from backend.app.services.etl_service import transform_data, extract_file
    # df = extract_file(file_path)
    # valid_records, invalid_records = transform_data(df)
    # ti.xcom_push(key='valid_records', value=valid_records)
    # ti.xcom_push(key='invalid_records', value=invalid_records)
    ti.xcom_push(key='valid_count', value=5)
    ti.xcom_push(key='invalid_count', value=2)

def load_valid_to_postgres(**kwargs):
    """Task 4: Load clean structured metadata into PostgreSQL."""
    ti = kwargs['ti']
    run_id = ti.xcom_pull(key='run_id', task_ids='register_run')
    print(f"Loading valid structured metadata to PostgreSQL for Run ID: {run_id}")
    # In production, this inserts valid records into PostgreSQL:
    # from backend.app.services.etl_service import load_data
    # load_data(valid_records, [], db)

def load_valid_to_mongodb(**kwargs):
    """Task 5: Load full valid documents into MongoDB raw_emails."""
    ti = kwargs['ti']
    run_id = ti.xcom_pull(key='run_id', task_ids='register_run')
    print(f"Loading valid raw documents to MongoDB raw_emails for Run ID: {run_id}")
    # In production:
    # from backend.app.services.mongo_service import insert_raw_emails
    # insert_raw_emails(valid_records)

def load_invalid_to_mongodb(**kwargs):
    """Task 6: Load invalid documents into MongoDB invalid_emails."""
    ti = kwargs['ti']
    run_id = ti.xcom_pull(key='run_id', task_ids='register_run')
    print(f"Loading invalid records to MongoDB invalid_emails for Run ID: {run_id}")
    # In production:
    # from backend.app.services.mongo_service import insert_invalid_emails
    # insert_invalid_emails(invalid_records)

def complete_pipeline_run(**kwargs):
    """Task 7: Update pipeline run status to SUCCESS/FAILED and log counts."""
    ti = kwargs['ti']
    run_id = ti.xcom_pull(key='run_id', task_ids='register_run')
    valid_count = ti.xcom_pull(key='valid_count', task_ids='transform_data')
    invalid_count = ti.xcom_pull(key='invalid_count', task_ids='transform_data')
    total_count = valid_count + invalid_count
    print(f"Completing run ID {run_id}: Total={total_count}, Valid={valid_count}, Invalid={invalid_count}")
    # In production, this updates the pipeline_runs entry in the SQL database.

# Define the DAG
with DAG(
    'email_etl_pipeline_dag',
    default_args=default_args,
    description='Automated Email Data Integration ETL Pipeline DAG',
    schedule_interval=None,  # Manual trigger from UI/API
    catchup=False,
    tags=['etl', 'email', 'mongodb', 'postgres'],
) as dag:

    task_register = PythonOperator(
        task_id='register_run',
        python_callable=register_pipeline_run,
        provide_context=True,
    )

    task_extract = PythonOperator(
        task_id='extract_file',
        python_callable=extract_email_file,
        provide_context=True,
    )

    task_transform = PythonOperator(
        task_id='transform_data',
        python_callable=transform_email_data,
        provide_context=True,
    )

    task_load_postgres = PythonOperator(
        task_id='load_postgres',
        python_callable=load_valid_to_postgres,
        provide_context=True,
    )

    task_load_mongodb_valid = PythonOperator(
        task_id='load_mongodb_valid',
        python_callable=load_valid_to_mongodb,
        provide_context=True,
    )

    task_load_mongodb_invalid = PythonOperator(
        task_id='load_mongodb_invalid',
        python_callable=load_invalid_to_mongodb,
        provide_context=True,
    )

    task_complete = PythonOperator(
        task_id='complete_run',
        python_callable=complete_pipeline_run,
        provide_context=True,
    )

    # Workflow dependencies
    task_register >> task_extract >> task_transform
    task_transform >> [task_load_postgres, task_load_mongodb_valid, task_load_mongodb_invalid] >> task_complete
