from celery import Celery
from celery.schedules import crontab
from src.config import Config

app = Celery("juristique_pipeline", broker=Config.REDIS_URL)

app.conf.update(
    result_backend=Config.REDIS_URL,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

app.conf.beat_schedule = {
    "scrape-faolex-daily": {
        "task": "src.tasks.scrape_tasks.scrape_faolex",
        "schedule": crontab(hour=2, minute=0),
    },
    "scrape-ohada-daily": {
        "task": "src.tasks.scrape_tasks.scrape_ohada",
        "schedule": crontab(hour=3, minute=0),
    },
}

app.autodiscover_tasks(["src.tasks"])
