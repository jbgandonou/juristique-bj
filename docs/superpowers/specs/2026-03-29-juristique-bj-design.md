# Juristique.bj — Design Spec

> Date : 2026-03-29
> Statut : Approuvé

---

## Vision

Plateforme de droit africain francophone regroupant tous les textes juridiques de 26 pays francophones, classés par thème (42 thèmes), avec recherche avancée, commentaires communautaires et analyses par des juristes professionnels.

---

## Contexte & Décisions

### Utilisateurs cibles
- **Prioritaire :** Juristes / avocats professionnels
- **Secondaire :** Étudiants en droit, entreprises/investisseurs, ONG/organisations internationales

### Modèle économique
- **Freemium** — accès gratuit aux textes, fonctionnalités premium payantes

### Périmètre au lancement
- **26 pays** francophones (couverture inégale acceptée)
- **42 thèmes** dès le départ (constitution, élevage, énergie électrique, numérique, droit foncier, environnement, etc.)

### Budget
- Confortable (200$+/mois en production)
- Gratuit en développement (free tiers ou Docker local)

### Pas de deadline — on fait bien les choses

---

## Stack technique

| Couche | Technologie |
|---|---|
| **Frontend** | Nuxt.js 3 (Vue 3, Composition API, Pinia, SSR) |
| **Backend** | NestJS (TypeScript, TypeORM, Guards, Swagger) |
| **Base de données** | PostgreSQL 16 |
| **Recherche** | Typesense (full-text, français, auto-hébergeable) |
| **Cache / Queues** | Redis 7 (cache NestJS, sessions, BullMQ) |
| **Stockage fichiers** | S3 (AWS en prod, MinIO en dev, Cloudflare R2 en option) |
| **Pipeline de collecte** | Python (Celery Beat, BeautifulSoup, Playwright, PyMuPDF) |
| **OCR** | PyMuPDF (direct) → Mistral OCR → Tesseract (fallback) |
| **Enrichissement IA** | Claude API (métadonnées, thèmes, résumés) |
| **Paiement** | Stripe (international) + Fedapay (Mobile Money Afrique de l'Ouest) |
| **Email** | Resend (100/jour gratuit en dev) |
| **Déploiement** | Docker Compose |
| **Hébergement prod** | VPS (Hetzner ou Contabo) ~150$/mois |

---

## Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                      UTILISATEURS                       │
│              (Juristes, avocats, étudiants)              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND — Nuxt.js 3                    │
│  SSR pour SEO · Vue 3 + Composition API · Pinia (state)  │
│  Pages : Accueil · Recherche · Texte · Profil · Admin    │
└──────────────────────┬──────────────────────────────────┘
                       │ API REST (JSON)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND — NestJS                         │
│                                                          │
│  Modules :                                               │
│  ├── Auth (JWT + refresh tokens, rôles)                  │
│  ├── Texts (CRUD textes juridiques, versions)            │
│  ├── Search (proxy Typesense)                            │
│  ├── Comments (commentaires, analyses communautaires)    │
│  ├── Alerts (veille juridique, notifications)            │
│  ├── Countries (26 pays, métadonnées)                    │
│  ├── Themes (42 thèmes, classification)                  │
│  ├── Users (profils, abonnements, favoris)               │
│  └── Admin (queue éditoriale, modération)                │
│                                                          │
│  TypeORM · Guards · Interceptors · Swagger               │
└───────┬──────────┬──────────────┬───────────────────────┘
        │          │              │
        ▼          ▼              ▼
   PostgreSQL   Typesense      Redis
   (données)   (recherche)   (cache, sessions,
                              queues BullMQ)
                                │
┌───────────────────────────────┼─────────────────────────┐
│          PIPELINE DE COLLECTE — Python                    │
│                                                          │
│  Celery Beat (orchestration)                             │
│  ├── Scrapers (FAOLEX, OHADA, JO nationaux...)           │
│  ├── OCR (PyMuPDF → Mistral OCR → Tesseract)            │
│  ├── Enrichissement (Claude API : métadonnées, thèmes)   │
│  └── Insertion via API NestJS (source de vérité unique)   │
│                                                          │
│  S3 (stockage PDFs originaux)                            │
└─────────────────────────────────────────────────────────┘
```

---

## Modèle de données

### countries

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | "République du Bénin" |
| code | CHAR(2) | "BJ" (ISO 3166) |
| flag_url | VARCHAR | |
| region | VARCHAR | "Afrique de l'Ouest" |
| legal_system | VARCHAR | "Civil law" |
| official_lang | VARCHAR | "Français" |
| created_at | TIMESTAMP | |

### legal_texts

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| country_id | UUID FK → countries | |
| title | VARCHAR | "Loi n°2023-15 portant..." |
| reference | VARCHAR | "Loi n°2023-15" |
| text_type | ENUM | constitution, loi_organique, loi, ordonnance, decret, arrete, traite, acte_uniforme |
| hierarchy_rank | INT | 1=constitution ... 7=arrêté |
| content_text | TEXT | Texte intégral |
| summary | TEXT | Résumé IA ou éditorial |
| promulgation_date | DATE | |
| publication_date | DATE | |
| effective_date | DATE | Entrée en vigueur |
| status | ENUM | draft, pending_review, verified, published |
| is_verified | BOOLEAN | |
| verified_by | UUID FK → users | |
| verified_at | TIMESTAMP | |
| source_url | VARCHAR | |
| source_name | VARCHAR | "FAOLEX", "JO Bénin" |
| pdf_s3_key | VARCHAR | |
| ocr_quality | FLOAT | 0.0 → 1.0 |
| version | INT | 1, 2, 3... |
| parent_text_id | UUID FK → legal_texts | Texte amendé |
| replaces_id | UUID FK → legal_texts | Texte abrogé |
| is_in_force | BOOLEAN | En vigueur ou abrogé |
| view_count | INT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### themes

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | "Énergie électrique" |
| slug | VARCHAR | "energie-electrique" |
| description | TEXT | |
| parent_id | UUID FK → themes | Hiérarchie thématique |
| icon | VARCHAR | |
| text_count | INT | Compteur dénormalisé |

### text_themes (jointure)

| Colonne | Type |
|---|---|
| text_id | UUID FK → legal_texts |
| theme_id | UUID FK → themes |

### text_references

| Colonne | Type | Description |
|---|---|---|
| source_text | UUID FK → legal_texts | |
| target_text | UUID FK → legal_texts | |
| ref_type | ENUM | cite, modifie, abroge, applique |

### text_versions

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| text_id | UUID FK → legal_texts | |
| version | INT | |
| content | TEXT | |
| change_summary | TEXT | |
| changed_by | UUID FK → users | |
| created_at | TIMESTAMP | |

### users

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | |
| full_name | VARCHAR | |
| role | ENUM | free, premium, editor, admin |
| profession | VARCHAR | "Avocat", "Notaire"... |
| country_id | UUID FK → countries | |
| bar_number | VARCHAR | Numéro barreau (optionnel) |
| avatar_url | VARCHAR | |
| is_verified | BOOLEAN | Email vérifié |
| created_at | TIMESTAMP | |
| last_login_at | TIMESTAMP | |

### comments

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| text_id | UUID FK → legal_texts | |
| user_id | UUID FK → users | |
| parent_id | UUID FK → comments | Réponses imbriquées |
| content | TEXT | |
| type | ENUM | comment, analysis, annotation |
| article_ref | VARCHAR | "Art. 15" (optionnel) |
| upvotes | INT | |
| is_flagged | BOOLEAN | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### alerts

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| alert_type | ENUM | theme, country, keyword |
| filter_value | VARCHAR | "energie", "BJ", "foncier" |
| frequency | ENUM | realtime, daily, weekly |
| channel | ENUM | email, push, in_app |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |

### bookmarks

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| text_id | UUID FK → legal_texts | |
| note | TEXT | Optionnel |
| created_at | TIMESTAMP | |

### subscriptions

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| plan | ENUM | monthly, yearly |
| provider | ENUM | stripe, fedapay |
| provider_sub_id | VARCHAR | ID chez le provider |
| status | ENUM | active, cancelled, expired |
| starts_at | TIMESTAMP | |
| expires_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

### pipeline_jobs

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| source_name | VARCHAR | "FAOLEX", "JO Bénin" |
| source_url | VARCHAR | |
| status | ENUM | queued, scraping, extracting, enriching, ready_for_review, failed |
| raw_s3_key | VARCHAR | PDF/HTML brut |
| extracted_text | TEXT | |
| ocr_method | VARCHAR | "direct", "mistral", "tesseract" |
| ocr_quality | FLOAT | |
| metadata_json | JSONB | Métadonnées extraites |
| legal_text_id | UUID FK → legal_texts | Une fois inséré |
| error_message | TEXT | |
| retry_count | INT | |
| started_at | TIMESTAMP | |
| completed_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

### source_configs

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | "FAOLEX", "Primature SN" |
| scraper_type | VARCHAR | "api", "rss", "html", "playwright" |
| base_url | VARCHAR | |
| schedule | VARCHAR | "daily", "weekly" |
| is_active | BOOLEAN | |
| last_run_at | TIMESTAMP | |
| last_success_at | TIMESTAMP | |
| config_json | JSONB | Paramètres spécifiques |
| created_at | TIMESTAMP | |

---

## Fonctionnalités

### Pages publiques (SEO, sans compte)

- **Accueil** — Barre de recherche centrale, stats (X textes · 26 pays · 42 thèmes), derniers textes, thèmes populaires
- **Recherche** — Full-text via Typesense, filtres combinables (pays, thème, type, date, en vigueur), tri par pertinence/date/hiérarchie, snippet + surlignage
- **Page texte juridique** — En-tête (titre, référence, pays, type, date, statut en vigueur/abrogé), badge "Vérifié", texte intégral avec table des articles, sidebar (métadonnées, thèmes, textes liés), commentaires/analyses, télécharger PDF, copier citation, favoris, partager
- **Navigation par pays** — Carte d'Afrique ou grille 26 pays, page pays avec textes filtrables
- **Navigation par thème** — 42 thèmes en grille avec compteurs, page thème avec textes filtrables

### Pages authentifiées (compte requis)

- **Profil** — Infos personnelles, profession, barreau, favoris, commentaires, alertes
- **Alertes / veille** — Créer alerte (thème + pays), fréquence (temps réel, quotidien, hebdomadaire), canal (email, in-app)

### Pages premium (payant)

- Recherche avancée (opérateurs booléens, recherche articles, export)
- Droit comparé (comparaison côte à côte entre pays)
- Export (PDF, Word, citation BibTeX)
- Alertes illimitées (free = 3 max)
- Analyses communautaires complètes (free = 3 premières en lecture seule)

### Admin / Éditorial

- **Queue éditoriale** — Textes en pending_review, interface validation, comparaison PDF vs texte extrait
- **Dashboard pipeline** — État scrapers, jobs, taux OCR, volume par source/pays
- **Modération** — Commentaires signalés, gestion utilisateurs

### Répartition Free vs Premium

| Fonctionnalité | Free | Premium |
|---|---|---|
| Lire les textes | Oui | Oui |
| Recherche simple | Oui | Oui |
| Recherche avancée + export | Non | Oui |
| Commentaires (lire) | 3 premiers | Tous |
| Commentaires (écrire) | Non | Oui |
| Alertes veille | 3 max | Illimité |
| Droit comparé | Non | Oui |
| Télécharger PDF | Oui | Oui |
| Copier citation | Oui | Oui |

---

## Sécurité & Authentification

### Auth

- **Inscription** : Email + mot de passe (bcrypt, 12 rounds) ou OAuth2 Google
- **Vérification email** obligatoire
- **JWT** : access token (15min, mémoire côté front) + refresh token (7 jours, httpOnly cookie)
- **Rotation** du refresh token à chaque usage
- **Rate limiting** : 5 tentatives / 15min sur la connexion

### Rôles (Guards NestJS)

- `free` → lecture textes, recherche simple
- `premium` → tout free + fonctions payantes
- `editor` → queue éditoriale, validation textes
- `admin` → tout + gestion users, pipeline

### Sécurité API

| Mesure | Implémentation |
|---|---|
| Rate limiting | `@nestjs/throttler` — 100 req/min (free), 500 req/min (premium) |
| Validation input | `class-validator` sur tous les DTOs |
| SQL injection | TypeORM paramétré |
| XSS | sanitize-html (API) + DOMPurify (front) |
| CORS | Whitelist domaines |
| Headers | Helmet |
| CSRF | Token CSRF pour mutations |

### Données sensibles

- Mots de passe → bcrypt
- Tokens API → variables d'environnement
- PDFs sur S3 → signed URLs (expiration 1h)
- Logs → jamais de données personnelles

### Paiement

- **Stripe** — Cartes internationales
- **Fedapay** — Mobile Money (MTN, Moov), cartes locales (Bénin, Togo, CI, Sénégal)
- Webhooks → NestJS met à jour le rôle free → premium
- Table `subscriptions` pour tracer les abonnements

---

## Pipeline de collecte

### Sources (par priorité)

| Priorité | Source | Volume estimé | Effort |
|---|---|---|---|
| P0 | OHADA officiel (17 pays) | 17 actes + révisions | Faible |
| P0 | FAOLEX (26 pays, 11 thèmes) | 3 000+ textes | Faible |
| P0 | Constitutions (26 pays) | 26 textes | Faible |
| P1 | CCJA jurisprudence | ~2 000 arrêts | Moyen |
| P1 | République Togolaise | ~20 textes | Très faible |
| P1 | Primature Sénégal | ~40 textes | Faible |
| P1 | Assemblée nationale CI | À évaluer | Moyen |
| P2 | UEMOA (8 pays) | ~200 textes | Moyen |
| P2 | JO Bénin, CI, Sénégal | 500+ textes | Élevé |
| P3 | JO 23 autres pays | Variable | Très élevé |

### Flux pipeline

```
Sources → Celery Beat → Dédoublonnage (hash MD5) → S3 (PDF brut)
→ Extraction texte (PyMuPDF / Mistral OCR / Tesseract)
→ Métadonnées (Claude API) → Enrichissement (thèmes, résumés, embeddings)
→ Queue éditoriale (pending_review) → Validation juriste → Publication
```

### Stratégie OCR

1. Extraction directe PyMuPDF (PDF textuel) — si qualité > 0.85 → OK
2. Mistral OCR (documents français) — si qualité > 0.80 → OK
3. Tesseract fallback (fra) — si qualité < 0.70 → flag pour review humaine

---

## Infrastructure

### Production (~150$/mois)

| Service | Spec | Coût |
|---|---|---|
| VPS principal | 8 vCPU, 16GB RAM, 200GB SSD | ~40€ |
| VPS pipeline | 4 vCPU, 8GB RAM | ~20€ |
| S3 (AWS) | ~50GB PDFs | ~5$ |
| Claude API | ~500 textes/mois | ~50$ |
| Domaine + SSL | juristique.bj | ~15$/an |
| Email | Resend ou Brevo | ~10$/mois |

### Développement (gratuit)

| Service | Option gratuite |
|---|---|
| Frontend Nuxt.js | Vercel ou Netlify |
| Backend NestJS | Render ou Railway |
| PostgreSQL | Neon ou Supabase (512MB) |
| Redis | Upstash |
| Typesense | Typesense Cloud free tier |
| S3 | Cloudflare R2 (10GB) |
| Email | Resend (100/jour) |

**Recommandation dev :** Docker Compose local pour zéro contrainte.

---

## Stratégie de lancement

### Phase 1 — Fondation (semaines 1-4)

- Setup projet (NestJS + Nuxt.js + Docker Compose)
- Modèle de données PostgreSQL + migrations TypeORM
- Pipeline FAOLEX (~3000 textes) + OHADA (17 actes) + 26 constitutions
- OCR pipeline + enrichissement Claude API
- **Résultat : ~500-1000 textes vérifiés en base**

### Phase 2 — Produit minimum (semaines 5-8)

- Auth (inscription, connexion, JWT, Google OAuth)
- API CRUD textes, pays, thèmes
- Indexation Typesense
- Frontend : accueil, recherche, page texte, navigation pays/thèmes
- SEO : SSR, sitemap, meta tags, Schema.org
- **Résultat : on peut chercher et lire des textes juridiques**

### Phase 3 — Communauté + Premium (semaines 9-12)

- Commentaires et analyses par article
- Favoris / bookmarks
- Alertes veille juridique (BullMQ + email)
- Paiement Stripe + Fedapay
- Fonctions premium
- Queue éditoriale (admin)
- **Résultat : produit complet, prêt à lancer**

### Phase 4 — Croissance (après lancement)

- Scrapers nationaux supplémentaires
- PWA / mode offline
- API publique
- Mobile Money élargi
- Gamification communauté
- Partenariats institutionnels

### KPIs mois 1

| Métrique | Objectif |
|---|---|
| Textes publiés | 500+ |
| Pays couverts | 26 |
| Thèmes couverts | 42 |
| Utilisateurs inscrits | 100 |
| Conversion premium | 5% |

---

## Éléments ajoutés lors du brainstorming (non prévus initialement)

1. **Versionnement des textes** — historique des amendements
2. **Hiérarchie des normes** — constitution > loi > décret > arrêté
3. **Références croisées** — liens entre textes qui se citent
4. **Veille juridique / alertes** — notifications par thème/pays
5. **Droit comparé** — comparaison côte à côte entre pays
6. **Citations normalisées** — copier une citation formatée
7. **Export** — PDF, Word
8. **Badge authenticité** — "vérifié par un juriste"
9. **Accès offline / PWA** — pour les zones à connectivité limitée
10. **API publique** — intégration par des tiers (cabinets, legaltech)
