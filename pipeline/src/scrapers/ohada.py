"""
Scraper for OHADA Actes Uniformes (supranational business law).

This scraper uses hardcoded, verified data for the 10 Actes Uniformes
currently in force. PDFs are sourced from biblio.ohada.org (public access).
Presentation pages link to ohada.org.

OHADA is supranational — each acte is created once with country_code "OA".
"""

from .base import BaseScraper, RawDocument

OHADA_ACTES = [
    {
        "title": "Acte uniforme portant sur le droit commercial general (AUDCG)",
        "reference": "AUDCG revise le 15 decembre 2010",
        "date": "2010-12-15",
        "source_url": "https://www.ohada.org/droit-commercial-general/",
        "pdf_url": "http://biblio.ohada.org/pmb/opac_css/doc_num.php?explnum_id=481",
        "themes": ["droit-commercial", "droit-affaires"],
    },
    {
        "title": "Acte uniforme relatif au droit des societes commerciales et du groupement d'interet economique (AUSCGIE)",
        "reference": "AUSCGIE revise le 30 janvier 2014",
        "date": "2014-01-30",
        "source_url": "https://www.ohada.org/droit-des-societes-commerciales-et-du-gie/",
        "pdf_url": "http://biblio.ohada.org/pmb/opac_css/doc_num.php?explnum_id=2032",
        "themes": ["droit-commercial", "droit-affaires"],
    },
    {
        "title": "Acte uniforme portant organisation des suretes (AUS)",
        "reference": "AUS revise le 15 decembre 2010",
        "date": "2010-12-15",
        "source_url": "https://www.ohada.org/organisation-des-suretes/",
        "pdf_url": "http://biblio.ohada.org/pmb/opac_css/doc_num.php?explnum_id=483",
        "themes": ["droit-commercial", "droit-affaires"],
    },
    {
        "title": "Acte uniforme portant organisation des procedures collectives d'apurement du passif (AUPCAP)",
        "reference": "AUPCAP revise le 10 septembre 2015",
        "date": "2015-09-10",
        "source_url": "https://www.ohada.org/procedures-collectives-dapurement-du-passif/",
        "pdf_url": "http://biblio.ohada.org/pmb/opac_css/doc_num.php?explnum_id=484",
        "themes": ["droit-commercial", "droit-affaires"],
    },
    {
        "title": "Acte uniforme relatif aux contrats de transport de marchandises par route (AUCTMR)",
        "reference": "AUCTMR du 22 mars 2003",
        "date": "2003-03-22",
        "source_url": "https://www.ohada.org/contrats-de-transport-de-marchandises-par-route/",
        "pdf_url": "http://biblio.ohada.org/pmb/opac_css/doc_num.php?explnum_id=479",
        "themes": ["droit-commercial", "droit-transport"],
    },
    {
        "title": "Acte uniforme relatif au droit des societes cooperatives (AUSCOOP)",
        "reference": "AUSCOOP du 15 decembre 2010",
        "date": "2010-12-15",
        "source_url": "https://www.ohada.org/droit-des-societes-cooperatives/",
        "pdf_url": "http://biblio.ohada.org/pmb/opac_css/doc_num.php?explnum_id=487",
        "themes": ["droit-commercial", "droit-affaires"],
    },
    {
        "title": "Acte uniforme relatif au droit de l'arbitrage (AUA)",
        "reference": "AUA revise le 23 novembre 2017",
        "date": "2017-11-23",
        "source_url": "https://www.ohada.org/droit-de-larbitrage/",
        "pdf_url": "http://biblio.ohada.org/pmb/opac_css/doc_num.php?explnum_id=480",
        "themes": ["droit-arbitrage", "droit-affaires"],
    },
    {
        "title": "Acte uniforme relatif a la mediation (AUM)",
        "reference": "AUM du 23 novembre 2017",
        "date": "2017-11-23",
        "source_url": "https://www.ohada.org/acte-uniforme-relatif-a-la-mediation/",
        "pdf_url": None,
        "themes": ["droit-arbitrage", "droit-affaires"],
    },
    {
        "title": "Acte uniforme relatif au droit comptable et a l'information financiere (AUDCIF)",
        "reference": "AUDCIF du 26 janvier 2017",
        "date": "2017-01-26",
        "source_url": "https://www.ohada.org/acte-uniforme-relatif-au-droit-comptable-et-a-linformation-financiere-audcif/",
        "pdf_url": None,
        "themes": ["droit-comptable", "droit-affaires"],
    },
    {
        "title": "Acte uniforme portant organisation des procedures simplifiees de recouvrement et des voies d'execution (AUPSRVE)",
        "reference": "AUPSRVE revise le 17 octobre 2023",
        "date": "2023-10-17",
        "source_url": "https://www.ohada.org/organisation-des-procedures-simplifiees-de-recouvrement-et-des-voies-dexecution/",
        "pdf_url": "http://biblio.ohada.org/pmb/opac_css/doc_num.php?explnum_id=5800",
        "themes": ["droit-commercial", "droit-affaires"],
    },
]

# The 17 OHADA member states (for reference/metadata only)
OHADA_MEMBER_COUNTRIES = [
    "BJ", "BF", "CM", "CF", "KM", "CG", "CI", "GA",
    "GN", "GQ", "ML", "MR", "NE", "SN", "TD", "TG", "CD",
]


class OhadaScraper(BaseScraper):
    """
    Scraper for OHADA Actes Uniformes.

    Uses hardcoded verified data — no web scraping needed.
    Each acte is created once as supranational law (country_code="OA").
    PDF URLs point to biblio.ohada.org public repository.
    """

    BASE_URL = "https://www.ohada.org"
    SOURCE_NAME = "OHADA"

    async def collect(self) -> list[RawDocument]:
        documents = []

        for acte in OHADA_ACTES:
            doc = RawDocument(
                title=acte["title"],
                source_url=acte["source_url"],
                country_code="OA",
                source_name=self.SOURCE_NAME,
                date=acte["date"],
                text_type="acte_uniforme",
                pdf_url=acte["pdf_url"],
                themes=acte["themes"],
                metadata={
                    "reference": acte["reference"],
                    "ohada_member_countries": OHADA_MEMBER_COUNTRIES,
                },
            )
            documents.append(doc)

        return documents
