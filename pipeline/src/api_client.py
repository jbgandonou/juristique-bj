import httpx
from src.config import Config


class ApiClient:
    def __init__(self):
        self.base_url = Config.API_BASE_URL

    async def create_pipeline_job(self, source_name: str, source_url: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/pipeline/jobs",
                json={"sourceName": source_name, "sourceUrl": source_url},
            )
            response.raise_for_status()
            return response.json()

    async def update_pipeline_job(self, job_id: str, data: dict) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.base_url}/pipeline/jobs/{job_id}",
                json=data,
            )
            response.raise_for_status()
            return response.json()

    async def create_legal_text(self, data: dict) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/legal-texts",
                json=data,
            )
            response.raise_for_status()
            return response.json()

    async def get_country_by_code(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/countries/by-code/{code}",
            )
            response.raise_for_status()
            return response.json()

    async def get_theme_by_slug(self, slug: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/themes/by-slug/{slug}",
            )
            response.raise_for_status()
            return response.json()
