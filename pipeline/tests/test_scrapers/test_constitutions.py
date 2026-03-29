import pytest
from src.scrapers.constitutions import ConstitutionsScraper, CONSTITUTIONS


def test_has_26_countries():
    assert len(CONSTITUTIONS) == 26

    # All country codes should be unique
    country_codes = [entry["country_code"] for entry in CONSTITUTIONS]
    assert len(country_codes) == len(set(country_codes))


def test_each_entry_has_required_fields():
    required_fields = ["country_code", "title", "date", "source_url"]
    for entry in CONSTITUTIONS:
        for field in required_fields:
            assert field in entry, f"Missing field '{field}' in entry: {entry}"
            assert entry[field], f"Empty value for field '{field}' in entry: {entry}"

        # Country code should be 2 uppercase letters
        assert len(entry["country_code"]) == 2
        assert entry["country_code"].isupper()

        # Date should be in YYYY-MM-DD format
        assert len(entry["date"]) == 10
        assert entry["date"][4] == "-" and entry["date"][7] == "-"

        # Source URL should start with https://
        assert entry["source_url"].startswith("https://")


def test_benin_constitution():
    benin = next((e for e in CONSTITUTIONS if e["country_code"] == "BJ"), None)
    assert benin is not None
    assert "Bénin" in benin["title"] or "Benin" in benin["title"]
    assert benin["date"] == "1990-12-11"
    assert "constituteproject.org" in benin["source_url"]


@pytest.mark.asyncio
async def test_collect_returns_raw_documents():
    scraper = ConstitutionsScraper()
    docs = await scraper.collect()

    assert len(docs) == 26
    for doc in docs:
        assert doc.title
        assert doc.source_url
        assert doc.country_code
        assert doc.source_name == "ConstitutionNet"
        assert doc.text_type == "Constitution"
