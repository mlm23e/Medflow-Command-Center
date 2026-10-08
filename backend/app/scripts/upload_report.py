import asyncio
import boto3

from app.models import Report
from app.database import AsyncSessionLocal

BUCKET_NAME = "medflow-reports-mm1234"
LOCAL_FILE_PATH = "app/scripts/sample_report.txt"

S3_KEY = "reports/FJ1-3420.txt"

def upload_to_s3()->str:
    s3_client = boto3.client("s3")
    s3_client.upload_file(LOCAL_FILE_PATH, BUCKET_NAME, S3_KEY)
    return f"s3://{BUCKET_NAME}/{S3_KEY}"

async def record_report(file_url : str)->None:
    async with AsyncSessionLocal() as session:
        log = Report(
            id=2, 
            work_order_id=1, 
            file_url=file_url, 
            notes="Uploaded via upload_reports.py"
        )
        session.add(log)
        await session.commit()
        await session.refresh(log)
        print(f"Created report with id={log.id}, file_url = {log.file_url}")

async def main() -> None:
    file_url = upload_to_s3()
    print(f"Uploaded to {file_url}")
    await record_report(file_url)

if __name__ == "__main__":
    asyncio.run(main())