import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    REDIS_URL = f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/0"
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:4000")
    S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_BUCKET = os.getenv("S3_BUCKET", "juristique-raw")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
