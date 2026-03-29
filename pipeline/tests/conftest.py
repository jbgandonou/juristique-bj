import pytest


@pytest.fixture
def faolex_search_html():
    return """
    <div class="result-item">
        <h3><a href="/faolex/results/details/en/c/LEX-FAOC123456/">
            Loi n°2020-15 relative à l'élevage au Bénin
        </a></h3>
        <div class="field-country">Benin</div>
        <div class="field-date">2020</div>
        <div class="field-type">Legislation</div>
    </div>
    <div class="result-item">
        <h3><a href="/faolex/results/details/en/c/LEX-FAOC789012/">
            Décret sur la pêche au Sénégal
        </a></h3>
        <div class="field-country">Senegal</div>
        <div class="field-date">2019</div>
        <div class="field-type">Legislation</div>
    </div>
    """


@pytest.fixture
def faolex_detail_html():
    return """
    <div class="faolex-detail">
        <h1>Loi n°2020-15 relative à l'élevage au Bénin</h1>
        <div class="field-country">Benin</div>
        <div class="field-date-of-text">2020-06-15</div>
        <div class="field-type-of-text">Legislation</div>
        <div class="field-subject">Élevage, production animale</div>
        <div class="field-abstract">
            Cette loi régit les activités d'élevage sur le territoire national.
        </div>
        <a class="pdf-link" href="/docs/pdf/ben123456.pdf">PDF</a>
    </div>
    """
