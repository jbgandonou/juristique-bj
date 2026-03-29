from src.scrapers.ohada import OhadaScraper, OHADA_COUNTRIES


def test_parse_actes_list():
    scraper = OhadaScraper()
    html = """
    <html><body>
        <ul>
            <li><a href="/acte-uniforme-commercial.html">Acte Uniforme sur le Droit Commercial Général</a></li>
            <li><a href="/acte-uniforme-societes.html">Acte Uniforme relatif au Droit des Sociétés Commerciales</a></li>
            <li><a href="/about.html">À propos de l'OHADA</a></li>
        </ul>
    </body></html>
    """
    actes = scraper.parse_actes_list(html)

    assert len(actes) >= 2
    titles = [a["title"] for a in actes]
    assert any("Acte Uniforme" in t for t in titles)
    # Should not include non-acte links
    assert all("À propos" not in t for t in titles)


def test_ohada_covers_17_countries():
    assert len(OHADA_COUNTRIES) == 17

    # Key francophone African member states must be present
    assert "BJ" in OHADA_COUNTRIES  # Benin
    assert "SN" in OHADA_COUNTRIES  # Senegal
    assert "CI" in OHADA_COUNTRIES  # Côte d'Ivoire
    assert "CM" in OHADA_COUNTRIES  # Cameroon
    assert "GA" in OHADA_COUNTRIES  # Gabon
    assert "ML" in OHADA_COUNTRIES  # Mali
    assert "TG" in OHADA_COUNTRIES  # Togo
    assert "CD" in OHADA_COUNTRIES  # DRC

    # All entries must be 2-letter ISO codes
    for code in OHADA_COUNTRIES:
        assert len(code) == 2
        assert code.isupper()
