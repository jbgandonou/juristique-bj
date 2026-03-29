from src.enrichment.theme_classifier import ThemeClassifier, VALID_THEME_SLUGS


def test_build_prompt_includes_title():
    classifier = ThemeClassifier.__new__(ThemeClassifier)
    title = "Loi n°2020-15 relative à l'élevage au Bénin"
    text = "Cette loi régit les activités d'élevage sur le territoire national."

    prompt = classifier.build_prompt(title, text)

    assert title in prompt
    assert text[:50] in prompt
    # Should include the list of valid slugs
    assert "elevage" in prompt
    assert "themes" in prompt.lower()


def test_parse_response_valid_json():
    classifier = ThemeClassifier.__new__(ThemeClassifier)

    response = '{"themes": ["elevage", "agriculture", "environnement"]}'
    themes = classifier.parse_response(response)

    assert "elevage" in themes
    assert "agriculture" in themes
    assert "environnement" in themes
    assert len(themes) == 3


def test_parse_response_filters_invalid():
    classifier = ThemeClassifier.__new__(ThemeClassifier)

    # Response with mix of valid and invalid slugs
    response = '{"themes": ["elevage", "invalid-theme", "fake-slug", "droit-foncier"]}'
    themes = classifier.parse_response(response)

    assert "elevage" in themes
    assert "droit-foncier" in themes
    assert "invalid-theme" not in themes
    assert "fake-slug" not in themes


def test_parse_response_handles_bad_json():
    classifier = ThemeClassifier.__new__(ThemeClassifier)

    # Completely broken response
    bad_responses = [
        "I cannot classify this document.",
        "",
        "Error: unexpected token",
        '{"broken": json without closing',
        "null",
        "[]",
    ]

    for bad_response in bad_responses:
        themes = classifier.parse_response(bad_response)
        assert isinstance(themes, list), f"Expected list for input: {bad_response!r}"
        # All returned themes must be valid slugs
        for theme in themes:
            assert theme in VALID_THEME_SLUGS, f"Invalid slug '{theme}' returned for input: {bad_response!r}"


def test_valid_theme_slugs_count():
    assert len(VALID_THEME_SLUGS) == 42
    # No duplicates
    assert len(VALID_THEME_SLUGS) == len(set(VALID_THEME_SLUGS))
