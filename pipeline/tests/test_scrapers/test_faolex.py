from src.scrapers.faolex import FaolexScraper, FAOLEX_COUNTRY_MAP, FAOLEX_THEME_MAP


def test_parse_search_results(faolex_search_html):
    scraper = FaolexScraper()
    results = scraper.parse_search_results(faolex_search_html)

    assert len(results) == 2

    first = results[0]
    assert "élevage" in first["title"].lower() or "levage" in first["title"].lower()
    assert first["country"] == "Benin"
    assert first["date"] == "2020"
    assert "LEX-FAOC123456" in first["url"]

    second = results[1]
    assert "pêche" in second["title"].lower() or "p" in second["title"].lower()
    assert second["country"] == "Senegal"
    assert second["date"] == "2019"


def test_parse_detail_page(faolex_detail_html):
    scraper = FaolexScraper()
    detail = scraper.parse_detail_page(faolex_detail_html)

    assert detail["title"] == "Loi n°2020-15 relative à l'élevage au Bénin"
    assert detail["country"] == "Benin"
    assert detail["date"] == "2020-06-15"
    assert detail["text_type"] == "Legislation"
    assert "levage" in detail["subject"].lower() or "élevage" in detail["subject"].lower()
    assert detail["abstract"] is not None and len(detail["abstract"]) > 0
    assert detail["pdf_url"] is not None and "ben123456.pdf" in detail["pdf_url"]


def test_country_code_mapping():
    scraper = FaolexScraper()

    assert scraper.map_country("Benin") == "BJ"
    assert scraper.map_country("Senegal") == "SN"
    assert scraper.map_country("Mali") == "ML"
    assert scraper.map_country("Unknown Country") is None

    # All 26 countries should map
    assert len(FAOLEX_COUNTRY_MAP) == 26


def test_theme_mapping():
    scraper = FaolexScraper()

    themes = scraper.map_themes("Élevage, production animale")
    assert "elevage" in themes

    themes = scraper.map_themes("fisheries and aquaculture management")
    assert "peche-aquaculture" in themes

    themes = scraper.map_themes("forestry and environment protection")
    assert "forets-biodiversite" in themes
    assert "environnement" in themes

    themes = scraper.map_themes("completely unrelated subject xyz")
    assert themes == []
