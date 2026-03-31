# Refonte des Scrapers Jus Africa

**Date** : 2026-03-31
**Statut** : Approuvé
**Approche** : Itérative par source

## Objectif

Rendre les scrapers de Jus Africa fiables : corriger les 3 existants (FAOLEX, Constitute, OHADA) et ajouter 3 nouvelles sources (CCJA, Assemblées nationales, Journaux officiels). Supprimer le pipeline Python dupliqué — tout passe par NestJS + BullMQ.

## Architecture commune

### BaseScraper (classe abstraite TypeScript)

Tous les scrapers héritent de `BaseScraper` qui fournit :

- `scrape(): ScrapedText[]` — méthode principale, appelle collect() + validate()
- `collect(): RawDocument[]` — abstract, chaque scraper implémente sa logique
- `validate(doc): boolean` — vérifie titre, contenu, pays, langue
- `retry(fn, maxAttempts=3)` — retry avec backoff exponentiel (1s, 4s, 16s)
- `fetchPage(url): string` — HTTP GET avec timeout 30s, user-agent, retry
- `fetchJson(url): object` — HTTP GET JSON avec retry
- `notify(type, message)` — envoie alerte admin via pipeline_alerts
- `log(level, message, meta)` — logging structuré avec contexte scraper

### Modèle RawDocument

```typescript
interface RawDocument {
  title: string;
  content: string;              // texte brut extrait
  contentHtml?: string;         // HTML original si disponible
  sourceUrl: string;            // URL source pour vérification
  sourceName: string;           // identifiant de la source
  countryCode: string;          // ISO2
  language: string;             // 'fr' requis, sinon rejeté
  documentType: TextType;       // LOI, DECRET, CONSTITUTION, etc.
  datePublished?: Date;
  themes?: string[];
  metadata?: Record<string, any>;
}
```

### Système d'alertes

Table `pipeline_alerts` :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| jobId | uuid | FK vers pipeline_jobs |
| type | enum | SCRAPE_FAILED, STRUCTURE_CHANGED, NO_RESULTS, VALIDATION_ERROR |
| severity | enum | INFO, WARNING, ERROR |
| message | string | Description de l'alerte |
| metadata | jsonb | URL, erreur, stack trace, etc. |
| acknowledged | boolean | L'admin a vu l'alerte |
| createdAt | timestamp | Date de création |

Types d'alertes :
- `SCRAPE_FAILED` — échec HTTP après 3 retries
- `STRUCTURE_CHANGED` — sélecteurs CSS ne matchent plus (0 éléments trouvés là où on en attendait)
- `NO_RESULTS` — scraper retourne 0 documents
- `VALIDATION_ERROR` — document rejeté (langue, contenu vide, etc.)

Dashboard admin : section "Alertes pipeline" avec badge compteur, liste filtrable par type/sévérité, bouton acknowledge, lien vers le job.

Retry : 3 tentatives, backoff exponentiel (1s, 4s, 16s), timeout 30s par requête.

## Scrapers existants (refonte)

### 1. FAOLEX (améliorer)

- **Source** : `fao-faolex-prod.appspot.com/api/query` (API POST)
- **Actuel** : Fonctionne, vrais appels API. On garde la base.
- **Améliorations** :
  - Filtrer par langue française (`language:FRA` dans la query Lucene)
  - Télécharger et extraire le contenu des PDFs via PyMuPDF (actuellement juste les métadonnées)
  - Pagination complète (actuellement limité à 50/pays)
  - Mapper les thèmes FAOLEX (`mainAreaEn`) vers nos 42 thèmes automatiquement
- **Pays** : 6 prioritaires (BEN, SEN, CIV, CMR, BFA, MLI), puis extension aux 26
- **Types** : LOI, DECRET, ARRETE, ORDONNANCE (mappés depuis les codes FAOLEX)

### 2. Constitutions (remplacement complet)

- **Abandon** de Constitute Project (contenu en anglais uniquement)
- **Nouvelles sources francophones par pays** :
  - Sites gouvernementaux officiels de chaque pays
  - Digithèque MJP (mjp.univ-perp.fr) — constitutions francophones historiques
  - Journal officiel de chaque pays
- **Stratégie** : pour chaque pays prioritaire, identifier la meilleure source de la constitution en français, implémenter un sous-scraper dédié
- **Fallback** : si source nationale indisponible, chercher sur source secondaire (MJP, autre)
- **Pays prioritaires** : Bénin, Sénégal, Côte d'Ivoire, Cameroun, Burkina Faso, Mali
- **Type** : CONSTITUTION

### 3. OHADA (refonte complète)

- **Abandon** du hardcoded
- **Scraping dynamique** de `ohada.org` :
  - `/actes-uniformes/` — liste et contenu des 10+ actes uniformes
  - `/reglements/` — règlements OHADA
  - `/decisions/` — décisions du conseil des ministres
- Parse les pages de détail pour extraire contenu complet, date, référence
- Télécharger les PDFs depuis `biblio.ohada.org` quand disponibles
- **Couverture** : 17 pays membres OHADA
- **Types** : LOI (actes uniformes), REGLEMENT, DECISION

## Nouvelles sources (P1)

### 4. CCJA (jurisprudence OHADA)

- **Source** : `ccja.org`
- **Données** : Arrêts, avis consultatifs, ordonnances
- **Scraping** : Liste paginée des décisions → page de détail → extraction du texte
- **Couverture** : Supranational (17 pays OHADA)
- **Type** : JURISPRUDENCE
- **Thèmes** : Droit des affaires principalement, mappé automatiquement depuis le sujet de l'arrêt

### 5. Assemblées nationales (6 pays)

Sources par pays :
- Bénin : `assemblee-nationale.bj`
- Sénégal : `assemblee-nationale.sn`
- Côte d'Ivoire : `assnat.ci`
- Cameroun : `assemblee-nationale.cm`
- Burkina Faso : `assemblee.bf`
- Mali : `assemblee-nationale.ml` ou `cntml.ml`

- **Données** : Lois votées, propositions de loi
- **Scraping** : Chaque site a sa structure propre → un sous-scraper par pays
- **Types** : LOI, LOI_ORGANIQUE

### 6. Journaux officiels (6 pays)

Sources par pays :
- Bénin : `sgg.gouv.bj` (SGG)
- Sénégal : `jo.gouv.sn`
- Côte d'Ivoire : `jogouv.ci` ou `abidjan.net/JO`
- Cameroun : `sppm.cm`
- Burkina Faso : `legiburkina.bf`
- Mali : `sgg.gouv.ml`

- **Données** : Décrets, arrêtés, ordonnances publiés au JO
- **Scraping** : PDF du JO → extraction texte via PyMuPDF/OCR → découpage en textes individuels
- **Types** : DECRET, ARRETE, ORDONNANCE

## Pipeline de traitement

### 4 étapes

1. **SCRAPING** : Le scraper collecte les RawDocument depuis la source
2. **VALIDATION** :
   - Langue = français (rejet si anglais/autre)
   - Titre non vide, > 10 caractères
   - Contenu non vide, > 100 caractères
   - Pays valide (ISO2 reconnu dans notre base)
   - URL source accessible
   - Détection de doublons (même titre + même pays + même date = doublon)
3. **ENRICHISSEMENT** :
   - Classification thématique automatique (matching mots-clés dans le contenu)
   - Extraction de la date si absente (regex sur le contenu)
   - Détection du type de texte si non fourni par la source
   - Génération d'un résumé court (premières lignes ou extraction intelligente)
4. **REVIEW** : Texte créé en PENDING_REVIEW, l'admin valide/rejette depuis le dashboard

## Stratégie de déploiement

### Vague 1 — Fondations + corrections (priorité max)

1. BaseScraper + système retry/alertes/logging
2. Table pipeline_alerts + endpoint API + UI admin alertes
3. Refonte FAOLEX (filtre langue, extraction PDF, pagination complète)
4. Refonte OHADA (scraping dynamique ohada.org)
5. Remplacement Constitute → ConstitutionsScraper (sources francophones)

### Vague 2 — Nouvelles sources

6. CCJA (jurisprudence OHADA)
7. Assemblées nationales (6 pays)
8. Journaux officiels (6 pays)

### Vague 3 — Extension

9. Étendre les scrapers aux 26 pays
10. Sources P2 additionnelles si besoin

## Suppressions

- Dossier `pipeline/` (Python/Celery) supprimé entièrement
- Tout passe par backend NestJS + BullMQ (une seule stack)

## Tests

- **Unitaires** : mock des réponses HTTP, vérifier le parsing de chaque scraper
- **Intégration** : un scraper fait un vrai appel et vérifie la structure de la réponse
- **Validation** : données mal formées rejetées correctement
- **Alertes** : vérifier que les échecs déclenchent bien les bonnes alertes

## 6 pays prioritaires

1. Bénin (BJ)
2. Sénégal (SN)
3. Côte d'Ivoire (CI)
4. Cameroun (CM)
5. Burkina Faso (BF)
6. Mali (ML)
