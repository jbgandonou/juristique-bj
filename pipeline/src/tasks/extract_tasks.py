import asyncio
import tempfile
import boto3
from src.celery_app import app
from src.config import Config
from src.extraction.ocr import OcrPipeline


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=Config.S3_ENDPOINT,
        aws_access_key_id=Config.S3_ACCESS_KEY,
        aws_secret_access_key=Config.S3_SECRET_KEY,
    )


@app.task(name="src.tasks.extract_tasks.extract_pdf")
def extract_pdf(job_id: str, s3_key: str, doc_data: dict):
    asyncio.run(_extract_pdf(job_id, s3_key, doc_data))


async def _extract_pdf(job_id: str, s3_key: str, doc_data: dict):
    s3 = get_s3_client()
    ocr = OcrPipeline()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=True) as tmp:
        s3.download_fileobj(Config.S3_BUCKET, s3_key, tmp)
        tmp.flush()

        result = await ocr.process(tmp.name)

        doc_data["content_text"] = result["text"]
        doc_data["ocr_method"] = result["method"]
        doc_data["ocr_quality"] = result["quality"]

        from src.tasks.enrich_tasks import enrich_text
        enrich_text.delay(job_id, doc_data)
