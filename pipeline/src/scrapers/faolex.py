"""
FAOLEX scraper using the real FAOLEX API.

API endpoint: POST https://fao-faolex-prod.appspot.com/api/query
Body: JSON string with Lucene-style queries.
"""

import json
import logging

from .base import BaseScraper, RawDocument

logger = logging.getLogger(__name__)

FAOLEX_API_URL = "https://fao-faolex-prod.appspot.com/api/query"
FAOLEX_DETAIL_URL = "https://www.fao.org/faolex/results/details/en/c/{faolex_id}"
FAOLEX_PDF_URL = "https://faolex.fao.org/docs/pdf/{filename}"

# ISO3 (used by FAOLEX) → ISO2 (used by our backend)
FAOLEX_COUNTRY_MAP = {
    "BEN": "BJ",
    "BFA": "BF",
    "BDI": "BI",
    "CMR": "CM",
    "CAF": "CF",
    "TCD": "TD",
    "COG": "CG",
    "CIV": "CI",
    "COD": "CD",
    "COM": "KM",
    "DJI": "DJ",
    "GAB": "GA",
    "GIN": "GN",
    "GNQ": "GQ",
    "HTI": "HT",
    "MDG": "MG",
    "MLI": "ML",
    "MRT": "MR",
    "NER": "NE",
    "RWA": "RW",
    "SEN": "SN",
    "TGO": "TG",
    "TUN": "TN",
}

# FAOLEX type of text code → our TextType enum value
FAOLEX_TYPE_MAP = {
    "L": "loi",
    "R": "decret",
    "M": "loi",
    "P": "loi",
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

PAGE_SIZE = 10
MAX_TEXTS_PER_COUNTRY = 50


def _get_field(fields: list, name: str) -> str | None:
    """Extract a named field value from the FAOLEX metadata fields list."""
    for f in fields:
        if f.get("name") == name:
            vals = f.get("textValues", {}).get("values", [])
            if vals:
                return " ".join(vals) if len(vals) > 1 else vals[0]
            int_vals = f.get("integerValues", {}).get("values", [])
            if int_vals:
                return str(int_vals[0])
    return None


class FaolexScraper(BaseScraper):
    BASE_URL = "https://www.fao.org/faolex"
    SOURCE_NAME = "FAOLEX"

    def _build_query_body(
        self, country_iso3: str, type_code: str, start: int = 0
    ) -> str:
        """Build the JSON body for the FAOLEX API query."""
        payload = {
            "query": f"country:({country_iso3}) AND typeoftext:({type_code}) AND repealed:(N)",
            "start": start,
            "sortField": "dateOfText",
            "sortOrder": "DESCENDING",
        }
        return json.dumps(payload)

    async def _query_api(
        self, country_iso3: str, type_code: str, start: int = 0
    ) -> dict:
        """Send a single query to the FAOLEX API and return the parsed response."""
        body = self._build_query_body(country_iso3, type_code, start)
        response = await self.client.post(
            FAOLEX_API_URL,
            content=body,
            headers={"Content-Type": "text/plain"},
        )
        response.raise_for_status()
        return response.json()

    def _parse_result(self, result: dict, country_iso2: str) -> RawDocument | None:
        """Parse a single API result into a RawDocument."""
        metadata = result.get("metadata", {})
        fields = metadata.get("fields", [])

        faolex_id = _get_field(fields, "faolexId")
        title = _get_field(fields, "titleOfText")
        if not title or not faolex_id:
            return None

        date_of_text = _get_field(fields, "dateOfText")
        type_code = _get_field(fields, "typeOfText") or ""
        text_type = FAOLEX_TYPE_MAP.get(type_code, "loi")
        abstract = _get_field(fields, "abstract")
        main_area = _get_field(fields, "mainAreaEn") or ""
        links_to_full_text = _get_field(fields, "linksToFullText")
        year = _get_field(fields, "year")

        # Build URLs
        source_url = FAOLEX_DETAIL_URL.format(faolex_id=faolex_id)
        pdf_url = (
            FAOLEX_PDF_URL.format(filename=links_to_full_text)
            if links_to_full_text
            else None
        )

        # Map themes from mainAreaEn (can be multi-valued, space-separated or comma)
        themes = self._map_themes(main_area)

        return RawDocument(
            title=title,
            source_url=source_url,
            country_code=country_iso2,
            source_name=self.SOURCE_NAME,
            date=date_of_text,
            text_type=text_type,
            summary=abstract,
            pdf_url=pdf_url,
            themes=themes,
            metadata={
                "faolex_id": faolex_id,
                "type_code": type_code,
                "main_area": main_area,
                "year": year,
            },
        )

    def _map_themes(self, main_area: str) -> list[str]:
        """Map FAOLEX mainAreaEn subjects to our theme slugs."""
        themes: list[str] = []
        area_lower = main_area.lower()
        for keyword, slug in FAOLEX_THEME_MAP.items():
            if keyword.lower() in area_lower and slug not in themes:
                themes.append(slug)
        return themes

    async def _collect_for_country_and_type(
        self, country_iso3: str, country_iso2: str, type_code: str
    ) -> list[RawDocument]:
        """Collect all non-repealed texts for one country and type code."""
        documents: list[RawDocument] = []
        start = 0

        while len(documents) < MAX_TEXTS_PER_COUNTRY:
            try:
                data = await self._query_api(country_iso3, type_code, start)
            except Exception as exc:
                logger.warning(
                    "FAOLEX API error for %s type=%s start=%d: %s",
                    country_iso3,
                    type_code,
                    start,
                    exc,
                )
                break

            results = data.get("results", [])
            if not results:
                break

            for result in results:
                if len(documents) >= MAX_TEXTS_PER_COUNTRY:
                    break
                doc = self._parse_result(result, country_iso2)
                if doc:
                    documents.append(doc)

            has_more = data.get("hasMoreResults", False)
            if not has_more:
                break

            start += PAGE_SIZE

        return documents

    async def collect(self) -> list[RawDocument]:
        """Collect legal texts from FAOLEX for all configured countries."""
        all_documents: list[RawDocument] = []

        for country_iso3, country_iso2 in FAOLEX_COUNTRY_MAP.items():
            logger.info("FAOLEX: scraping %s (%s)", country_iso3, country_iso2)
            country_docs: list[RawDocument] = []

            # Collect Legislation (L) and Regulation (R)
            for type_code in ("L", "R"):
                remaining = MAX_TEXTS_PER_COUNTRY - len(country_docs)
                if remaining <= 0:
                    break
                docs = await self._collect_for_country_and_type(
                    country_iso3, country_iso2, type_code
                )
                country_docs.extend(docs[:remaining])

            logger.info(
                "FAOLEX: collected %d texts for %s", len(country_docs), country_iso3
            )
            all_documents.extend(country_docs)

        logger.info("FAOLEX: total collected %d texts", len(all_documents))
        return all_documents
