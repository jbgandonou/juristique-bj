from bs4 import BeautifulSoup
from .base import BaseScraper, RawDocument

OHADA_COUNTRIES = [
    "BJ",  # Benin
    "BF",  # Burkina Faso
    "CM",  # Cameroon
    "CF",  # Central African Republic
    "KM",  # Comoros
    "CG",  # Congo
    "CI",  # Côte d'Ivoire
    "GA",  # Gabon
    "GN",  # Guinea
    "GQ",  # Equatorial Guinea
    "ML",  # Mali
    "MR",  # Mauritania
    "NE",  # Niger
    "SN",  # Senegal
    "TD",  # Chad
    "TG",  # Togo
    "CD",  # Democratic Republic of the Congo
]

OHADA_BASE_URL = "https://www.ohada.com"
OHADA_ACTES_URL = "https://www.ohada.com/actes-uniformes.html"


class OhadaScraper(BaseScraper):
    BASE_URL = "https://www.ohada.com"
    SOURCE_NAME = "OHADA"

    def parse_actes_list(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")
        actes = []

        for link in soup.select("a[href]"):
            href = link.get("href", "")
            title = link.get_text(strip=True)

            if not title:
                continue

            # Look for links that appear to be Actes Uniformes
            title_lower = title.lower()
            if "acte uniforme" in title_lower or "au " in title_lower:
                url = (
                    OHADA_BASE_URL + href
                    if href.startswith("/")
                    else href
                    if href.startswith("http")
                    else OHADA_BASE_URL + "/" + href
                )
                actes.append(
                    {
                        "title": title,
                        "url": url,
                    }
                )

        # Deduplicate by URL
        seen = set()
        unique_actes = []
        for acte in actes:
            if acte["url"] not in seen:
                seen.add(acte["url"])
                unique_actes.append(acte)

        return unique_actes

    async def collect(self) -> list[RawDocument]:
        documents = []

        try:
            html = await self.fetch(OHADA_ACTES_URL)
        except Exception:
            return documents

        actes = self.parse_actes_list(html)

        for acte in actes:
            # Each OHADA Acte Uniforme applies to all 17 member countries
            for country_code in OHADA_COUNTRIES:
                doc = RawDocument(
                    title=acte["title"],
                    source_url=acte["url"],
                    country_code=country_code,
                    source_name=self.SOURCE_NAME,
                    text_type="Acte Uniforme",
                    themes=["droit-commercial", "droit-affaires"],
                    metadata={"ohada_countries": OHADA_COUNTRIES},
                )
                documents.append(doc)

        return documents
