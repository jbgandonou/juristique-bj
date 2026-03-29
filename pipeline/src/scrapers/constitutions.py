from .base import BaseScraper, RawDocument

CONSTITUTIONS = [
    {
        "country_code": "BJ",
        "title": "Constitution de la République du Bénin du 11 décembre 1990",
        "date": "1990-12-11",
        "source_url": "https://www.constituteproject.org/constitution/Benin_1990",
    },
    {
        "country_code": "BF",
        "title": "Constitution du Burkina Faso du 2 juin 1991",
        "date": "1991-06-02",
        "source_url": "https://www.constituteproject.org/constitution/Burkina_Faso_2012",
    },
    {
        "country_code": "BI",
        "title": "Constitution de la République du Burundi du 7 juin 2018",
        "date": "2018-06-07",
        "source_url": "https://www.constituteproject.org/constitution/Burundi_2018",
    },
    {
        "country_code": "CM",
        "title": "Constitution de la République du Cameroun du 18 janvier 1996",
        "date": "1996-01-18",
        "source_url": "https://www.constituteproject.org/constitution/Cameroon_2008",
    },
    {
        "country_code": "CF",
        "title": "Constitution de la République Centrafricaine du 30 mars 2016",
        "date": "2016-03-30",
        "source_url": "https://www.constituteproject.org/constitution/Central_African_Republic_2016",
    },
    {
        "country_code": "KM",
        "title": "Constitution de l'Union des Comores du 23 décembre 2001",
        "date": "2001-12-23",
        "source_url": "https://www.constituteproject.org/constitution/Comoros_2018",
    },
    {
        "country_code": "CG",
        "title": "Constitution de la République du Congo du 25 octobre 2015",
        "date": "2015-10-25",
        "source_url": "https://www.constituteproject.org/constitution/Congo_2015",
    },
    {
        "country_code": "CD",
        "title": "Constitution de la République Démocratique du Congo du 18 février 2006",
        "date": "2006-02-18",
        "source_url": "https://www.constituteproject.org/constitution/Democratic_Republic_of_the_Congo_2011",
    },
    {
        "country_code": "CI",
        "title": "Constitution de la République de Côte d'Ivoire du 8 novembre 2016",
        "date": "2016-11-08",
        "source_url": "https://www.constituteproject.org/constitution/Cote_DIvoire_2016",
    },
    {
        "country_code": "DJ",
        "title": "Constitution de la République de Djibouti du 15 septembre 1992",
        "date": "1992-09-15",
        "source_url": "https://www.constituteproject.org/constitution/Djibouti_2010",
    },
    {
        "country_code": "GA",
        "title": "Constitution de la République Gabonaise du 26 mars 1991",
        "date": "1991-03-26",
        "source_url": "https://www.constituteproject.org/constitution/Gabon_2011",
    },
    {
        "country_code": "GN",
        "title": "Constitution de la République de Guinée du 7 mai 2010",
        "date": "2010-05-07",
        "source_url": "https://www.constituteproject.org/constitution/Guinea_2010",
    },
    {
        "country_code": "GQ",
        "title": "Constitution de la République de Guinée Équatoriale du 17 novembre 2012",
        "date": "2012-11-17",
        "source_url": "https://www.constituteproject.org/constitution/Equatorial_Guinea_2012",
    },
    {
        "country_code": "HT",
        "title": "Constitution de la République d'Haïti du 29 mars 1987",
        "date": "1987-03-29",
        "source_url": "https://www.constituteproject.org/constitution/Haiti_2012",
    },
    {
        "country_code": "MG",
        "title": "Constitution de la République de Madagascar du 11 décembre 2010",
        "date": "2010-12-11",
        "source_url": "https://www.constituteproject.org/constitution/Madagascar_2010",
    },
    {
        "country_code": "ML",
        "title": "Constitution de la République du Mali du 25 février 1992",
        "date": "1992-02-25",
        "source_url": "https://www.constituteproject.org/constitution/Mali_1992",
    },
    {
        "country_code": "MR",
        "title": "Constitution de la République Islamique de Mauritanie du 12 juillet 1991",
        "date": "1991-07-12",
        "source_url": "https://www.constituteproject.org/constitution/Mauritania_2012",
    },
    {
        "country_code": "MC",
        "title": "Constitution de la Principauté de Monaco du 17 décembre 1962",
        "date": "1962-12-17",
        "source_url": "https://www.constituteproject.org/constitution/Monaco_2002",
    },
    {
        "country_code": "NE",
        "title": "Constitution de la République du Niger du 25 novembre 2010",
        "date": "2010-11-25",
        "source_url": "https://www.constituteproject.org/constitution/Niger_2010",
    },
    {
        "country_code": "RW",
        "title": "Constitution de la République du Rwanda du 26 mai 2003",
        "date": "2003-05-26",
        "source_url": "https://www.constituteproject.org/constitution/Rwanda_2015",
    },
    {
        "country_code": "SN",
        "title": "Constitution de la République du Sénégal du 22 janvier 2001",
        "date": "2001-01-22",
        "source_url": "https://www.constituteproject.org/constitution/Senegal_2016",
    },
    {
        "country_code": "SC",
        "title": "Constitution de la République des Seychelles du 18 juin 1993",
        "date": "1993-06-18",
        "source_url": "https://www.constituteproject.org/constitution/Seychelles_2017",
    },
    {
        "country_code": "TD",
        "title": "Constitution de la République du Tchad du 31 mars 1996",
        "date": "1996-03-31",
        "source_url": "https://www.constituteproject.org/constitution/Chad_1996",
    },
    {
        "country_code": "TG",
        "title": "Constitution de la République Togolaise du 14 octobre 1992",
        "date": "1992-10-14",
        "source_url": "https://www.constituteproject.org/constitution/Togo_2007",
    },
    {
        "country_code": "TN",
        "title": "Constitution de la République Tunisienne du 26 janvier 2014",
        "date": "2014-01-26",
        "source_url": "https://www.constituteproject.org/constitution/Tunisia_2022",
    },
    {
        "country_code": "VU",
        "title": "Constitution de la République de Vanuatu du 30 juillet 1980",
        "date": "1980-07-30",
        "source_url": "https://www.constituteproject.org/constitution/Vanuatu_1983",
    },
]


class ConstitutionsScraper(BaseScraper):
    BASE_URL = "https://www.constituteproject.org"
    SOURCE_NAME = "ConstitutionNet"

    async def collect(self) -> list[RawDocument]:
        documents = []
        for entry in CONSTITUTIONS:
            doc = RawDocument(
                title=entry["title"],
                source_url=entry["source_url"],
                country_code=entry["country_code"],
                source_name=self.SOURCE_NAME,
                date=entry["date"],
                text_type="Constitution",
                themes=["constitution", "droit-public"],
                metadata={},
            )
            documents.append(doc)
        return documents
