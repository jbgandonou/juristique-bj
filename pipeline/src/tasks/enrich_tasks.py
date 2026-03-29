import asyncio
from src.celery_app import app
from src.api_client import ApiClient
from src.enrichment.theme_classifier import ThemeClassifier
from src.enrichment.metadata_extractor import MetadataExtractor


@app.task(name="src.tasks.enrich_tasks.enrich_text")
def enrich_text(job_id: str, doc_data: dict):
    asyncio.run(_enrich_text(job_id, doc_data))


async def _enrich_text(job_id: str, doc_data: dict):
    api = ApiClient()
    classifier = ThemeClassifier()
    extractor = MetadataExtractor()

    title = doc_data.get("title", "")
    text = doc_data.get("content_text") or doc_data.get("summary", "")

    # Classify themes (use existing if from scraper, else use Claude)
    theme_slugs = doc_data.get("themes", [])
    if not theme_slugs and text:
        theme_slugs = await classifier.classify(title, text)

    # Extract metadata if not already present
    metadata = doc_data.get("metadata", {})
    if not metadata.get("text_type") and text:
        extracted = await extractor.extract(title, text)
        metadata.update(extracted)

    # Resolve country and theme IDs
    country = await api.get_country_by_code(doc_data["country_code"])
    theme_ids = []
    for slug in theme_slugs:
        try:
            theme = await api.get_theme_by_slug(slug)
            theme_ids.append(theme["id"])
        except Exception:
            continue

    # Create the legal text
    text_type = metadata.get("text_type", "loi")
    hierarchy_map = {
        "constitution": 1, "loi_organique": 2, "loi": 3,
        "ordonnance": 4, "decret": 5, "arrete": 6,
        "traite": 2, "acte_uniforme": 2,
    }

    legal_text_data = {
        "title": title,
        "reference": metadata.get("reference", doc_data.get("reference")),
        "textType": text_type,
        "hierarchyRank": hierarchy_map.get(text_type, 5),
        "contentText": text,
        "summary": metadata.get("summary", doc_data.get("summary")),
        "countryId": country["id"],
        "themeIds": theme_ids,
        "promulgationDate": metadata.get("promulgation_date", doc_data.get("date")),
        "sourceUrl": doc_data.get("source_url"),
        "sourceName": doc_data.get("source_name"),
        "pdfS3Key": doc_data.get("pdf_s3_key"),
        "ocrQuality": doc_data.get("ocr_quality"),
        "isInForce": True,
        "status": "pending_review",
    }

    # Remove None values
    legal_text_data = {k: v for k, v in legal_text_data.items() if v is not None}

    await api.create_legal_text(legal_text_data)
