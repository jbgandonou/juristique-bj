# 07 — Pipeline de données (révisé)

> Dernière mise à jour : mars 2025  
> Ce document remplace la version précédente et intègre les sources réelles identifiées.

---

## Principes directeurs

Avant d'écrire une ligne de code de scraping, deux règles s'imposent :

**1. Toujours préférer une API officielle à un scraper.** Quand une source expose ses données structurées (FAOLEX Open Data, flux RSS, API REST), on l'utilise. Un scraper est un dernier recours, jamais un premier choix.

**2. La validation humaine est non-négociable.** Un texte juridique mal extrait peut induire un professionnel en erreur avec des conséquences réelles. Chaque texte passe par un juriste-éditeur avant publication.

---

## Cartographie des sources réelles

### Niveau 1 — Sources structurées à haute valeur (priorité absolue)

---

#### FAOLEX — Base de données FAO
**URL :** https://www.fao.org/faolex/fr/  
**Couverture :** Quasi-totalité des pays membres FAO, dont tous les pays africains francophones  
**Domaines couverts :** Agriculture, alimentation, élevage, pêche/aquaculture, forêts, eau, environnement, terres/sols, énergie, ressources minérales, espèces sauvages  
**Volume estimé :** Plusieurs milliers de textes pour les pays africains francophones  
**Langue :** Français, anglais, espagnol

**Pourquoi c'est la source n°1 :**  
FAOLEX est la plus grande base de données juridiques thématiques au monde dans son domaine. Elle couvre exactement les thèmes les plus demandés sur LexAfrique (élevage, énergie, environnement, eau, foncier) et propose des données ouvertes via une section dédiée.

**Approche technique :**

```
Étape 1 : Consulter https://www.fao.org/faolex/opendata/fr/
          Vérifier l'existence d'une API REST ou d'un export bulk (JSON/XML)
          Si API disponible : intégration directe, pas de scraping

Étape 2 : Si pas d'API bulk, utiliser la recherche avancée filtrée par pays + thème
          URL : https://www.fao.org/faolex/results/fr/?search=adv
          Paramètres : pays (ex: BJ = Bénin), catégorie thématique

Étape 3 : Pour chaque résultat, accéder à la fiche détaillée
          Extraire : titre, référence, date, pays, thème, résumé FAO, lien PDF
          Le résumé FAO est déjà structuré et de qualité — réutilisable directement

Étape 4 : Télécharger le PDF si disponible, sinon utiliser le résumé FAO seul
```

**Avantage clé :** Les fiches FAOLEX contiennent déjà des métadonnées structurées (titre, date, pays, thème, mots-clés, résumé). L'extraction manuelle est minimale.

**Limitation :** Couverture thématique limitée aux domaines FAO — ne couvre pas le droit commercial, numérique, pénal, constitutionnel au sens large.

---

### Niveau 2 — Sources nationales officielles

---

#### Sénégal — Primature (site officiel du gouvernement)
**URL :** https://primature.sn/publications/lois-et-reglements/lois-et-decrets  
**Contenu :** Lois et décrets publiés par la Primature  
**Format :** Pages HTML paginées, lien vers chaque texte individuel  
**Pagination :** `?page=0`, `?page=1`... (4 pages observées)  
**Flux RSS disponible :** OUI — `https://primature.sn/taxonomy/term/15/feed`

```python
class PrimatureSNScraper(BaseJOScraper):
    RSS_URL = "https://primature.sn/taxonomy/term/15/feed"
    BASE_URL = "https://primature.sn/publications/lois-et-reglements/lois-et-decrets"

    async def watch_rss(self):
        """Surveillance en temps réel via RSS."""
        feed = feedparser.parse(self.RSS_URL)
        for entry in feed.entries:
            if not await self.already_indexed(entry.link):
                yield await self.fetch_document(entry.link)

    async def initial_collection(self):
        """Collecte initiale : paginer les archives."""
        page = 0
        while True:
            url = f"{self.BASE_URL}?page={page}"
            response = await fetch(url)
            items = self.parse_listing(response)
            if not items:
                break
            for item in items:
                yield await self.fetch_document(item['url'])
            page += 1

    def parse_listing(self, html: str) -> list:
        soup = BeautifulSoup(html, 'html.parser')
        return [
            {'title': a.text.strip(), 'url': a['href']}
            for a in soup.select('h4 a') if a.get('href')
        ]
```

**Points d'attention :**
- Volume limité (~40 textes) : textes récents uniquement depuis ~2024
- Compléter avec le Journal Officiel du Sénégal (jo.gouv.sn) pour les archives

---

#### Togo — Portail officiel de la République Togolaise
**URL :** https://www.republiquetogolaise.com/documents-officiels/listes  
**Contenu :** Textes officiels majeurs — Constitution 2024, Code foncier, Loi énergie renouvelable, Code du travail, Loi communications électroniques, Loi de Finances  
**Format :** Tableau HTML avec liens PDF directs — très simple à extraire

```python
class RepubliqueTgScraper(BaseJOScraper):
    SOURCE_URL = "https://www.republiquetogolaise.com/documents-officiels/listes"

    async def collect(self):
        response = await fetch(self.SOURCE_URL)
        soup = BeautifulSoup(response, 'html.parser')

        for row in soup.select('table tr'):
            link = row.find('a', href=lambda h: h and '.pdf' in h)
            if not link:
                continue
            yield RawDocument(
                title=link.text.strip(),
                pdf_url=urljoin(self.SOURCE_URL, link['href']),
                country_code='TG',
                source='republiquetogolaise.com',
                likely_text_pdf=True,   # PDFs officiels bien formés
            )
```

**Points d'attention :**
- Volume volontairement limité : textes clés seulement, pas exhaustif
- Bonne qualité documentaire — compléter avec l'Assemblée nationale du Togo

---

#### Togo — Assemblée nationale
**URL :** https://assemblee-nationale.tg/ (onglet "Documents")  
**Statut :** Site retourne une erreur 403 lors d'un accès direct automatisé

**Approche alternative :**

```
Option A : Accès avec headers navigateur complets (User-Agent, Referer, Accept)
           Certains sites bloquent les bots mais acceptent des requêtes simulant un navigateur

Option B : Contact direct du secrétariat de l'Assemblée nationale du Togo
           Demande d'accès ou d'export — démarche de partenariat recommandée de toute façon

Option C : Agrégateurs tiers qui ont déjà collecté des textes togolais
           (Juriafrica, Droit-Afrique)
```

---

#### Côte d'Ivoire — Assemblée nationale
**URL :** https://www.assnat.ci/ — Ressources > Documents officiels  
**Contenu :** Constitution, lois adoptées, textes en instance (projets et propositions de loi)

```python
class AssnatCIScraper(BaseJOScraper):
    """
    Site dynamique (JavaScript). Utiliser Playwright pour simuler la navigation.
    """
    async def collect(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.goto("https://www.assnat.ci/")

            await page.click("text=RESSOURCES")
            await page.click("text=Lois")
            await page.wait_for_load_state("networkidle")

            links = await page.query_selector_all('a[href*=".pdf"], a[href*="loi"]')
            for link in links:
                href = await link.get_attribute('href')
                title = await link.inner_text()
                yield RawDocument(
                    title=title.strip(),
                    source_url=href,
                    country_code='CI',
                    source='assnat.ci'
                )
            await browser.close()
```

---

### Niveau 3 — Sources supranationales (couverture multi-pays)

| Source | URL | Couverture | Priorité |
|---|---|---|---|
| OHADA officiel | ohada.com | 17 pays — 17 actes uniformes + révisions | P0 |
| CCJA | ccja-ohada.org | Jurisprudence supranationale OHADA (~2 000 arrêts) | P1 |
| UEMOA | uemoa.int | 8 pays — fiscalité, douanes, microfinance | P2 |
| CEMAC | cemac.int | 6 pays Afrique Centrale | P2 |
| Union Africaine | au.int/fr/treaties | 55 pays — traités continentaux | P2 |

---

### Niveau 4 — Sources nationales complémentaires

| Pays | Source | URL | Format | Difficulté |
|---|---|---|---|---|
| Bénin | Journal Officiel | jo.bj | PDF | Moyenne |
| Sénégal | Journal Officiel | jo.gouv.sn | PDF | Moyenne |
| Côte d'Ivoire | Journal Officiel | journalofficiel.gouv.ci | PDF | Faible |
| Mali | Assemblée nationale | assemblee-nationale.ml | HTML | Moyenne |
| Burkina Faso | Légibf | legiburkina.bf | HTML/PDF | Faible |
| Cameroun | Primature | spm.gov.cm | PDF | Haute |
| Niger | Journal Officiel | lesahel.org/jo | PDF | Haute |
| RDC | Leganet | leganet.cd | HTML | Haute |
| Gabon | Légigabon | legigabon.org | HTML/PDF | Moyenne |
| Madagascar | Textes officiels | textes-officiels.gov.mg | PDF | Moyenne |

**Difficulté Haute :** Site instable ou bloqué, PDFs scannés nécessitant OCR + correction manuelle importante.

---

## Architecture du pipeline

```
SOURCES
  FAOLEX (API/bulk)
  Primature SN (RSS + HTML)
  République Togolaise (PDF direct)
  Assemblée nationale CI (Playwright)
  OHADA, CCJA, UEMOA (HTML/PDF)
  JO nationaux (PDF, souvent scannés)
         |
         v
ORCHESTRATEUR Celery Beat
  Planification : temps réel (RSS) / quotidien / hebdomadaire / mensuel
         |
         v
DÉTECTION DES NOUVEAUTÉS
  Hash MD5 du contenu + URL → dédoublonnage
         |
         v
STOCKAGE BRUT
  PDF/HTML original → AWS S3 (bucket lexafrique-raw)
         |
         v
EXTRACTION DU TEXTE
  PDF textuel → PyMuPDF (extraction directe)
  PDF scanné  → Mistral OCR → Tesseract (fallback)
  HTML        → BeautifulSoup + nettoyage
  FAOLEX      → résumé FAO réutilisé directement (pas d'OCR)
         |
         v
EXTRACTION DES MÉTADONNÉES
  Source FAOLEX  → métadonnées déjà propres, mapping direct
  Autres sources → LLM (Claude API) : titre, référence, date, pays, type
         |
         v
ENRICHISSEMENT
  Classification thèmes → LLM multi-label (42 thèmes LexAfrique)
  Résumé IA            → Claude API (si résumé FAO absent)
  Extraction articles  → Regex + LLM
  Embedding            → text-embedding API
         |
         v
QUEUE ÉDITORIALE
  is_published = false, is_verified = false
  Juriste-éditeur : valide, corrige, approuve
         |  Approbation
         v
PUBLICATION
  is_published = true, is_verified = true
  Indexation Typesense · Déclenchement alertes veille
```

---

## Correspondance thématique FAOLEX → LexAfrique

| Code FAO | Domaine FAO | Thème LexAfrique |
|---|---|---|
| AG | Développement agricole et rural | Agriculture |
| AN | Élevage | Élevage & production animale |
| FI | Pêche et aquaculture | Pêche & aquaculture |
| LA | Terres et sols | Droit foncier & immobilier |
| WA | Eau | Eau & assainissement |
| FO | Forêts | Environnement & forêts |
| EN | Environnement | Environnement & climat |
| MR | Ressources minérales | Mines & ressources naturelles |
| EG | Énergie | Énergie électrique |
| FD | Alimentation et nutrition | Santé publique (partiel) |
| WB | Espèces sauvages | Environnement & biodiversité |
| SE | Mer | Pêche & droit maritime |
| PL | Plantes cultivées | Agriculture |

---

## Stratégie OCR

```python
async def ocr_pipeline(pdf_path: str) -> str:
    # Étape 1 : Extraction directe (PDF textuel)
    direct_text = extract_text_direct(pdf_path)
    if quality_score(direct_text) > 0.85:
        return clean(direct_text)

    # Étape 2 : Mistral OCR (meilleur sur documents français)
    try:
        result = await mistral_ocr(pdf_path)
        if quality_score(result) > 0.80:
            return clean(result)
    except Exception:
        pass

    # Étape 3 : Tesseract (fallback open source)
    result = await tesseract_ocr(pdf_path, lang='fra')
    cleaned = clean(result)

    # Flaguer pour vérification humaine si qualité insuffisante
    if quality_score(cleaned) < 0.70:
        await flag_for_human_review(pdf_path, score=quality_score(cleaned))

    return cleaned

# Règle par source :
# FAOLEX              → souvent PDF textuel, qualité élevée
# République Togolaise → PDF officiels, généralement textuels
# Assemblée nationale  → variable, parfois scannés
# OHADA               → PDF textuels de bonne qualité
# JO locaux           → souvent scannés → OCR systématique
```

---

## Plan de collecte initiale

Ordonnée par rapport valeur / effort :

| Priorité | Source | Périmètre | Volume estimé | Effort |
|---|---|---|---|---|
| P0 | OHADA officiel | 17 pays — droit des affaires | 17 actes + révisions | Faible |
| P0 | FAOLEX | 26 pays — 11 thèmes | 3 000+ textes | Faible |
| P0 | Constitutions (sources directes) | 26 pays | 26 textes | Faible |
| P1 | CCJA — jurisprudence | Supranational | ~2 000 arrêts | Moyen |
| P1 | République Togolaise | Togo | ~20 textes | Très faible |
| P1 | Primature Sénégal | Sénégal | ~40 textes | Faible |
| P1 | Assemblée nationale CI | Côte d'Ivoire | À évaluer | Moyen |
| P2 | UEMOA | 8 pays | ~200 textes | Moyen |
| P2 | JO Bénin, CI, Sénégal | 3 pays pilotes | 500+ textes | Élevé |
| P3 | JO des 23 autres pays | 23 pays | Variable | Très élevé |

**Objectif lancement :** ~500 textes vérifiés couvrant les 26 pays sur les thèmes prioritaires.  
FAOLEX seul peut fournir la majorité de ces textes avec un effort minimal.

---

## Surveillance continue

```python
MONITORING_SCHEDULE = {
    'primature_sn_rss':    'realtime',  # RSS disponible — aucun scraping
    'faolex':              'daily',
    'ohada_officiel':      'daily',
    'ccja_jurisprudence':  'daily',
    'republique_togolaise':'weekly',
    'assnat_ci':           'weekly',
    'uemoa':               'weekly',
    'jo_benin':            'monthly',
    'jo_autres_pays':      'monthly',
}

# Alertes automatiques :
# → Scraper en échec 3 fois de suite      → notification équipe technique
# → Queue éditoriale > 50 textes          → notification éditeurs
# → Score OCR moyen < 0.75 sur 24h       → vérification de la source
```

---

## Critères de publication

Un texte ne peut être publié (`is_published = true`) que si tous les critères suivants sont remplis :

1. `is_verified = true` — validé par un juriste-éditeur
2. `title` non vide et cohérent avec le contenu
3. `country_id` renseigné
4. `text_type` renseigné (parmi les types autorisés)
5. `promulgation_date` ou `publication_date` renseignée
6. `content_text` d'au moins 200 caractères
7. Au moins un `theme` assigné

Tout texte ne respectant pas ces critères reste en `pending` dans la queue éditoriale.

---

## Équipe éditoriale minimale au lancement

| Rôle | Responsabilités | Profil |
|---|---|---|
| Éditeur en chef | Validation finale, arbitrages thématiques | Juriste senior droit africain |
| Éditeur OHADA | Textes OHADA + jurisprudence CCJA | Juriste spécialisé OHADA |
| Éditeur données | Correction OCR, normalisation métadonnées | Juriste avec appétence technique |
| Responsable pipeline | Maintenance scrapers, monitoring | Développeur data |
