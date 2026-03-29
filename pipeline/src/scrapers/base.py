import hashlib
import httpx
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class RawDocument:
    title: str
    source_url: str
    country_code: str
    source_name: str
    date: str | None = None
    text_type: str | None = None
    summary: str | None = None
    pdf_url: str | None = None
    content_html: str | None = None
    themes: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

    @property
    def content_hash(self) -> str:
        content = f"{self.title}{self.source_url}{self.country_code}"
        return hashlib.md5(content.encode()).hexdigest()


class BaseScraper(ABC):
    BASE_URL: str = ""
    SOURCE_NAME: str = ""

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "Juristique.bj Legal Data Collector/1.0",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
            },
        )

    async def fetch(self, url: str) -> str:
        response = await self.client.get(url)
        response.raise_for_status()
        return response.text

    async def fetch_bytes(self, url: str) -> bytes:
        response = await self.client.get(url)
        response.raise_for_status()
        return response.content

    @abstractmethod
    async def collect(self) -> list[RawDocument]:
        pass

    async def close(self):
        await self.client.aclose()
