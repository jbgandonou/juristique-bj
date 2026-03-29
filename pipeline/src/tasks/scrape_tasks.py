import asyncio
import boto3
from src.celery_app import app
from src.config import Config
from src.api_client import ApiClient
from src.scrapers.faolex import FaolexScraper
from src.scrapers.ohada import OhadaScraper
from src.scrapers.constitutions import ConstitutionsScraper


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=Config.S3_ENDPOINT,
        aws_access_key_id=Config.S3_ACCESS_KEY,
        aws_secret_access_key=Config.S3_SECRET_KEY,
    )


@app.task(name="src.tasks.scrape_tasks.scrape_faolex")
def scrape_faolex():
    asyncio.run(_scrape_faolex())


async def _scrape_faolex():
    scraper = FaolexScraper()
    api = ApiClient()
    s3 = get_s3_client()

    try:
        documents = await scraper.collect()
        for doc in documents:
            job = await api.create_pipeline_job(
                source_name=scraper.SOURCE_NAME,
                source_url=doc.source_url,
            )

            if doc.pdf_url:
                pdf_bytes = await scraper.fetch_bytes(doc.pdf_url)
                s3_key = f"raw/{doc.country_code}/{doc.content_hash}.pdf"
                s3.put_object(
                    Bucket=Config.S3_BUCKET,
                    Key=s3_key,
                    Body=pdf_bytes,
                )
                extract_pdf.delay(job["id"], s3_key, doc.__dict__)
            else:
                enrich_text.delay(job["id"], doc.__dict__)
    finally:
        await scraper.close()


@app.task(name="src.tasks.scrape_tasks.scrape_ohada")
def scrape_ohada():
    asyncio.run(_scrape_ohada())


async def _scrape_ohada():
    scraper = OhadaScraper()
    api = ApiClient()

    try:
        documents = await scraper.collect()
        for doc in documents:
            job = await api.create_pipeline_job(
                source_name=scraper.SOURCE_NAME,
                source_url=doc.source_url,
            )
            enrich_text.delay(job["id"], doc.__dict__)
    finally:
        await scraper.close()


@app.task(name="src.tasks.scrape_tasks.scrape_constitutions")
def scrape_constitutions():
    asyncio.run(_scrape_constitutions())


async def _scrape_constitutions():
    scraper = ConstitutionsScraper()
    api = ApiClient()

    try:
        documents = await scraper.collect()
        for doc in documents:
            job = await api.create_pipeline_job(
                source_name=scraper.SOURCE_NAME,
                source_url=doc.source_url,
            )
            enrich_text.delay(job["id"], doc.__dict__)
    finally:
        await scraper.close()


# Import deferred to avoid circular imports
from src.tasks.extract_tasks import extract_pdf
from src.tasks.enrich_tasks import enrich_text
