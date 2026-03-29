from bs4 import BeautifulSoup
from .base import BaseScraper, RawDocument

FAOLEX_COUNTRY_MAP = {
    "Benin": "BJ",
    "Burkina Faso": "BF",
    "Burundi": "BI",
    "Cameroon": "CM",
    "Central African Republic": "CF",
    "Comoros": "KM",
    "Congo": "CG",
    "Democratic Republic of the Congo": "CD",
    "Côte d'Ivoire": "CI",
    "Djibouti": "DJ",
    "Gabon": "GA",
    "Guinea": "GN",
    "Equatorial Guinea": "GQ",
    "Haiti": "HT",
    "Madagascar": "MG",
    "Mali": "ML",
    "Mauritania": "MR",
    "Niger": "NE",
    "Rwanda": "RW",
    "Senegal": "SN",
    "Seychelles": "SC",
    "Chad": "TD",
    "Togo": "TG",
    "Tunisia": "TN",
    "Monaco": "MC",
    "Vanuatu": "VU",
}

FAOLEX_THEME_MAP = {
    "livestock": "elevage",
    "élevage": "elevage",
    "production animale": "elevage",
    "fisheries": "peche-aquaculture",
    "pêche": "peche-aquaculture",
    "aquaculture": "peche-aquaculture",
    "land & soil": "droit-foncier",
    "terres": "droit-foncier",
    "water": "eau-assainissement",
    "eau": "eau-assainissement",
    "forestry": "forets-biodiversite",
    "forêts": "forets-biodiversite",
    "environment": "environnement",
    "environnement": "environnement",
    "mineral resources": "mines-ressources",
    "energy": "energie-electrique",
    "énergie": "energie-electrique",
    "food": "droit-sante",
    "alimentation": "droit-sante",
    "wild species": "forets-biodiversite",
    "sea": "droit-maritime",
    "agriculture": "agriculture",
    "cultivated plants": "agriculture",
}

FAOLEX_BASE_URL = "https://www.fao.org"
FAOLEX_SEARCH_URL = (
    "https://www.fao.org/faolex/results/en/c/{country_code}/"
)


class FaolexScraper(BaseScraper):
    BASE_URL = "https://www.fao.org/faolex"
    SOURCE_NAME = "FAOLEX"

    def parse_search_results(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")
        results = []
        for item in soup.select(".result-item"):
            link_tag = item.select_one("h3 a")
            if not link_tag:
                continue
            title = link_tag.get_text(strip=True)
            href = link_tag.get("href", "")
            url = FAOLEX_BASE_URL + href if href.startswith("/") else href

            country_tag = item.select_one(".field-country")
            country = country_tag.get_text(strip=True) if country_tag else ""

            date_tag = item.select_one(".field-date")
            date = date_tag.get_text(strip=True) if date_tag else None

            results.append(
                {
                    "title": title,
                    "url": url,
                    "country": country,
                    "date": date,
                }
            )
        return results

    def parse_detail_page(self, html: str) -> dict:
        soup = BeautifulSoup(html, "lxml")
        detail = soup.select_one(".faolex-detail")
        if not detail:
            return {}

        h1 = detail.select_one("h1")
        title = h1.get_text(strip=True) if h1 else ""

        country_tag = detail.select_one(".field-country")
        country = country_tag.get_text(strip=True) if country_tag else ""

        date_tag = detail.select_one(".field-date-of-text")
        date = date_tag.get_text(strip=True) if date_tag else None

        type_tag = detail.select_one(".field-type-of-text")
        text_type = type_tag.get_text(strip=True) if type_tag else None

        subject_tag = detail.select_one(".field-subject")
        subject = subject_tag.get_text(strip=True) if subject_tag else ""

        abstract_tag = detail.select_one(".field-abstract")
        abstract = abstract_tag.get_text(strip=True) if abstract_tag else None

        pdf_tag = detail.select_one("a.pdf-link")
        pdf_url = None
        if pdf_tag:
            href = pdf_tag.get("href", "")
            pdf_url = FAOLEX_BASE_URL + href if href.startswith("/") else href

        return {
            "title": title,
            "country": country,
            "date": date,
            "text_type": text_type,
            "subject": subject,
            "abstract": abstract,
            "pdf_url": pdf_url,
        }

    def map_country(self, country_name: str) -> str | None:
        return FAOLEX_COUNTRY_MAP.get(country_name)

    def map_themes(self, subject: str) -> list[str]:
        themes = []
        subject_lower = subject.lower()
        for keyword, slug in FAOLEX_THEME_MAP.items():
            if keyword.lower() in subject_lower:
                if slug not in themes:
                    themes.append(slug)
        return themes

    async def collect(self) -> list[RawDocument]:
        documents = []
        for country_name, country_code in FAOLEX_COUNTRY_MAP.items():
            search_url = FAOLEX_SEARCH_URL.format(country_code=country_code.lower())
            try:
                html = await self.fetch(search_url)
            except Exception:
                continue

            search_results = self.parse_search_results(html)
            for result in search_results:
                detail_html = None
                detail = {}
                try:
                    detail_html = await self.fetch(result["url"])
                    detail = self.parse_detail_page(detail_html)
                except Exception:
                    pass

                title = detail.get("title") or result["title"]
                date = detail.get("date") or result.get("date")
                text_type = detail.get("text_type")
                summary = detail.get("abstract")
                pdf_url = detail.get("pdf_url")
                subject = detail.get("subject", "")
                themes = self.map_themes(subject)

                doc = RawDocument(
                    title=title,
                    source_url=result["url"],
                    country_code=country_code,
                    source_name=self.SOURCE_NAME,
                    date=date,
                    text_type=text_type,
                    summary=summary,
                    pdf_url=pdf_url,
                    themes=themes,
                    metadata={"subject": subject},
                )
                documents.append(doc)

        return documents
