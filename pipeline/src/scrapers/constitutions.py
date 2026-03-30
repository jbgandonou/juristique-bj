import json
import logging

from bs4 import BeautifulSoup

from .base import BaseScraper, RawDocument

logger = logging.getLogger(__name__)

CONSTITUTE_API = "https://www.constituteproject.org/service/html"

CONSTITUTIONS = [
    {
        "country_code": "BJ",
        "cons_id": "Benin_1990",
        "title": "Constitution de la République du Bénin du 11 décembre 1990",
        "date": "1990-12-11",
    },
    {
        "country_code": "BF",
        "cons_id": "Burkina_Faso_2015",
        "title": "Constitution du Burkina Faso du 5 novembre 2015",
        "date": "2015-11-05",
    },
    {
        "country_code": "BI",
        "cons_id": "Burundi_2018",
        "title": "Constitution de la République du Burundi du 7 juin 2018",
        "date": "2018-06-07",
    },
    {
        "country_code": "CM",
        "cons_id": "Cameroon_2008",
        "title": "Constitution de la République du Cameroun (révision de 2008)",
        "date": "2008-04-14",
    },
    {
        "country_code": "CF",
        "cons_id": "Central_African_Republic_2016",
        "title": "Constitution de la République Centrafricaine du 30 mars 2016",
        "date": "2016-03-30",
    },
    {
        "country_code": "TD",
        "cons_id": "Chad_2018",
        "title": "Constitution de la République du Tchad du 4 mai 2018",
        "date": "2018-05-04",
    },
    {
        "country_code": "KM",
        "cons_id": "Comoros_2018",
        "title": "Constitution de l'Union des Comores (révision de 2018)",
        "date": "2018-07-30",
    },
    {
        "country_code": "CG",
        "cons_id": "Congo_2015",
        "title": "Constitution de la République du Congo du 25 octobre 2015",
        "date": "2015-10-25",
    },
    {
        "country_code": "CD",
        "cons_id": "Democratic_Republic_of_the_Congo_2011",
        "title": "Constitution de la République Démocratique du Congo (révision de 2011)",
        "date": "2011-01-20",
    },
    {
        "country_code": "CI",
        "cons_id": "Cote_DIvoire_2016",
        "title": "Constitution de la République de Côte d'Ivoire du 8 novembre 2016",
        "date": "2016-11-08",
    },
    {
        "country_code": "DJ",
        "cons_id": "Djibouti_2010",
        "title": "Constitution de la République de Djibouti (révision de 2010)",
        "date": "2010-04-21",
    },
    {
        "country_code": "GA",
        "cons_id": "Gabon_2011",
        "title": "Constitution de la République Gabonaise (révision de 2011)",
        "date": "2011-01-12",
    },
    {
        "country_code": "GN",
        "cons_id": "Guinea_2010",
        "title": "Constitution de la République de Guinée du 7 mai 2010",
        "date": "2010-05-07",
    },
    {
        "country_code": "MG",
        "cons_id": "Madagascar_2010",
        "title": "Constitution de la République de Madagascar du 11 décembre 2010",
        "date": "2010-12-11",
    },
    {
        "country_code": "ML",
        "cons_id": "Mali_1992",
        "title": "Constitution de la République du Mali du 25 février 1992",
        "date": "1992-02-25",
    },
    {
        "country_code": "MR",
        "cons_id": "Mauritania_2012",
        "title": "Constitution de la République Islamique de Mauritanie (révision de 2012)",
        "date": "2012-03-20",
    },
    {
        "country_code": "NE",
        "cons_id": "Niger_2017",
        "title": "Constitution de la République du Niger (révision de 2017)",
        "date": "2017-06-09",
    },
    {
        "country_code": "RW",
        "cons_id": "Rwanda_2015",
        "title": "Constitution de la République du Rwanda (révision de 2015)",
        "date": "2015-12-24",
    },
    {
        "country_code": "SN",
        "cons_id": "Senegal_2016",
        "title": "Constitution de la République du Sénégal (révision de 2016)",
        "date": "2016-03-20",
    },
    {
        "country_code": "TG",
        "cons_id": "Togo_2007",
        "title": "Constitution de la République Togolaise (révision de 2007)",
        "date": "2007-02-13",
    },
    {
        "country_code": "TN",
        "cons_id": "Tunisia_2014",
        "title": "Constitution de la République Tunisienne du 26 janvier 2014",
        "date": "2014-01-26",
    },
]


class ConstitutionsScraper(BaseScraper):
    BASE_URL = "https://www.constituteproject.org"
    SOURCE_NAME = "Constitute Project"

    @staticmethod
    def _html_to_text(html: str) -> str:
        """Strip HTML tags and return clean plain text."""
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(separator="\n", strip=True)

    async def collect(self) -> list[RawDocument]:
        documents: list[RawDocument] = []

        for entry in CONSTITUTIONS:
            cons_id = entry["cons_id"]
            country_code = entry["country_code"]

            # Fetch full constitution text from Constitute Project API
            content_text = ""
            content_html = ""
            try:
                url = f"{CONSTITUTE_API}?cons_id={cons_id}&lang=en"
                response_text = await self.fetch(url)
                data = json.loads(response_text)
                content_html = data.get("html", "")
                if content_html:
                    content_text = self._html_to_text(content_html)
            except Exception as exc:
                logger.warning(
                    "Failed to fetch constitution %s (%s): %s",
                    cons_id,
                    country_code,
                    exc,
                )
                # Skip this constitution entirely if fetch fails
                continue

            if not content_text:
                logger.warning(
                    "Empty content for constitution %s (%s), skipping",
                    cons_id,
                    country_code,
                )
                continue

            doc = RawDocument(
                title=entry["title"],
                source_url=f"https://www.constituteproject.org/constitution/{cons_id}",
                country_code=country_code,
                source_name=self.SOURCE_NAME,
                date=entry["date"],
                text_type="Constitution",
                summary=(
                    "Texte intégral de la constitution (version anglaise, traduction). "
                    "La version française doit être vérifiée par l'administrateur. "
                    "Source : Constitute Project."
                ),
                content_html=content_html,
                content_text=content_text,
                themes=["constitution", "droit-public"],
                metadata={
                    "cons_id": cons_id,
                    "language": "en",
                    "needs_french_version": True,
                },
            )
            documents.append(doc)

        logger.info(
            "Collected %d constitutions out of %d entries",
            len(documents),
            len(CONSTITUTIONS),
        )
        return documents
