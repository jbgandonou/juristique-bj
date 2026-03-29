from src.extraction.pdf_extractor import PdfExtractor


def test_quality_score_good_text():
    extractor = PdfExtractor()
    good_text = (
        "La présente loi régit les activités d'élevage sur le territoire national. "
        "Elle s'applique à toutes les personnes physiques et morales qui exercent des "
        "activités d'élevage au Bénin. Les dispositions de cette loi visent à "
        "promouvoir un élevage durable et respectueux de l'environnement."
    )
    score = extractor.quality_score(good_text)
    assert score >= 0.5, f"Expected score >= 0.5, got {score}"


def test_quality_score_bad_text():
    extractor = PdfExtractor()
    # Simulated garbled OCR output
    bad_text = "xZk@#$! %%% ||||| ~~~~ ^^^^ !!!! ????  ..... /////"
    score = extractor.quality_score(bad_text)
    assert score < 0.5, f"Expected score < 0.5, got {score}"


def test_quality_score_empty():
    extractor = PdfExtractor()
    assert extractor.quality_score("") == 0.0
    assert extractor.quality_score("   ") == 0.0
    assert extractor.quality_score("\n\n\n") == 0.0


def test_clean_text():
    extractor = PdfExtractor()

    # Multiple spaces should be collapsed
    text = "Hello   world   foo"
    cleaned = extractor.clean(text)
    assert "   " not in cleaned
    assert "Hello world foo" in cleaned

    # Multiple newlines should be collapsed
    text = "Line one\n\n\n\nLine two"
    cleaned = extractor.clean(text)
    assert "\n\n\n" not in cleaned
    assert "Line one" in cleaned
    assert "Line two" in cleaned

    # Leading/trailing whitespace should be stripped
    text = "   stripped text   "
    cleaned = extractor.clean(text)
    assert cleaned == "stripped text"
