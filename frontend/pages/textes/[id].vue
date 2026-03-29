<template>
  <div class="texte-detail-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb fade-in-up">
      <NuxtLink to="/" class="breadcrumb-link">Accueil</NuxtLink>
      <ChevronRight :size="14" class="breadcrumb-sep" />
      <NuxtLink to="/recherche" class="breadcrumb-link">Textes juridiques</NuxtLink>
      <ChevronRight :size="14" class="breadcrumb-sep" />
      <span class="breadcrumb-current">{{ texte.reference }}</span>
    </nav>

    <!-- Header -->
    <header class="texte-header glass-card fade-in-up stagger-1">
      <div class="header-top">
        <div class="header-badges">
          <span :class="['status-badge', texte.isInForce ? 'in-force' : 'abrogated']">
            {{ texte.isInForce ? 'En vigueur' : 'Abrogé' }}
          </span>
          <span :class="['status-badge', texte.verified ? 'verified' : 'pending']">
            <ShieldCheck v-if="texte.verified" :size="12" />
            <Clock v-else :size="12" />
            {{ texte.verified ? 'Vérifié par un juriste' : 'Non vérifié' }}
          </span>
        </div>
        <div class="header-actions">
          <button class="action-btn hover-lift" @click="downloadPDF">
            <Download :size="16" />
            <span>Télécharger PDF</span>
          </button>
          <button class="action-btn hover-lift" @click="copyCitation">
            <Copy :size="16" />
            <span>Copier citation</span>
          </button>
          <button :class="['action-btn', 'hover-lift', { 'bookmarked': isFavorited }]" @click="toggleFavorite">
            <Bookmark :size="16" :fill="isFavorited ? 'currentColor' : 'none'" />
            <span>{{ isFavorited ? 'Sauvegardé' : 'Favoris' }}</span>
          </button>
          <div v-if="isAuthenticated" class="folder-add-wrapper">
            <button class="action-btn hover-lift" @click="toggleFolderDropdown">
              <FolderPlus :size="16" />
              <span>Ajouter au dossier</span>
            </button>
            <div v-if="showFolderDropdown" class="folder-dropdown glass-card">
              <div v-if="foldersLoading" class="folder-dropdown-loading">Chargement...</div>
              <div v-else-if="!userFolders.length" class="folder-dropdown-empty">
                <p>Aucun dossier.</p>
                <NuxtLink to="/dossiers" class="folder-dropdown-link">Créer un dossier</NuxtLink>
              </div>
              <template v-else>
                <button
                  v-for="folder in userFolders"
                  :key="folder.id"
                  class="folder-dropdown-item hover-lift"
                  @click="addToFolder(folder.id)"
                >
                  <span class="folder-dot" :style="{ background: folder.color || 'var(--juris-primary)' }"></span>
                  {{ folder.name }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <h1 class="texte-title">{{ texte.title }}</h1>

      <div class="texte-meta-row">
        <div class="meta-badge">
          <span class="meta-flag">{{ texte.flag }}</span>
          <span>{{ texte.country }}</span>
        </div>
        <div class="meta-badge">
          <Calendar :size="15" />
          <span>{{ texte.datePromulgation }}</span>
        </div>
        <div class="meta-badge">
          <Scale :size="15" />
          <span>{{ texte.type }}</span>
        </div>
        <div class="meta-badge">
          <span :class="['hierarchy-rank', `rank-${texte.hierarchyRank}`]">{{ texte.hierarchyRank }}</span>
          <span>Rang {{ texte.hierarchyRank }} de la hiérarchie</span>
        </div>
        <div class="meta-badge">
          <FileText :size="15" />
          <span>{{ texte.reference }}</span>
        </div>
      </div>
    </header>

    <!-- Two-column layout -->
    <div class="content-layout fade-in-up stagger-3">
      <!-- Left Column: Content -->
      <main class="content-main">
        <!-- Summary -->
        <section v-if="texte.summary" class="content-section glass-card">
          <div class="section-title-row">
            <AlignLeft :size="18" class="section-icon" />
            <h2>Résumé</h2>
          </div>
          <Divider />
          <p class="summary-text">{{ texte.summary }}</p>
        </section>

        <!-- Full Text -->
        <section class="content-section glass-card">
          <div class="section-title-row">
            <ScrollText :size="18" class="section-icon" />
            <h2>Texte intégral</h2>
          </div>
          <Divider />

          <div class="legal-text-content">
            <div v-for="article in texte.articles" :key="article.id" class="article-block">
              <h3 class="article-heading">{{ article.heading }}</h3>
              <p class="article-body">{{ article.body }}</p>
            </div>
          </div>
        </section>

        <!-- Comments -->
        <section class="content-section glass-card">
          <div class="section-title-row">
            <MessageSquare :size="18" class="section-icon" />
            <h2>Commentaires des juristes</h2>
            <span class="comment-count">{{ texte.comments.length }}</span>
          </div>
          <Divider />

          <div class="comments-list">
            <div v-for="comment in texte.comments" :key="comment.id" class="comment-card">
              <div class="comment-header">
                <div class="comment-author">
                  <div class="author-avatar">{{ comment.initials }}</div>
                  <div class="author-info">
                    <strong class="author-name">{{ comment.name }}</strong>
                    <span class="author-profession">{{ comment.profession }}</span>
                  </div>
                </div>
                <div class="comment-right">
                  <span class="comment-date">{{ comment.date }}</span>
                  <button class="upvote-btn hover-lift" :class="{ active: comment.upvoted }" @click="comment.upvoted = !comment.upvoted; comment.upvotes += comment.upvoted ? 1 : -1">
                    <ThumbsUp :size="14" />
                    <span>{{ comment.upvotes }}</span>
                  </button>
                </div>
              </div>
              <p class="comment-body">{{ comment.body }}</p>
            </div>
          </div>

          <!-- Write a comment — requires authentication -->
          <AuthGate
            title="Connectez-vous pour commenter"
            description="Partagez votre analyse juridique avec la communauté des juristes."
          >
            <div class="comment-form-wrapper">
              <h4 class="comment-form-title">Ajouter un commentaire</h4>
              <textarea
                v-model="newComment"
                class="comment-textarea"
                placeholder="Votre analyse ou commentaire juridique..."
                rows="4"
              />
              <button class="btn-submit-comment hover-lift" :disabled="!newComment.trim()" @click="submitComment">
                <MessageSquare :size="16" />
                Publier le commentaire
              </button>
            </div>
          </AuthGate>
        </section>
      </main>

      <!-- Right Sidebar -->
      <aside class="content-sidebar">
        <!-- Métadonnées -->
        <div class="sidebar-card glass-card stagger-2">
          <div class="sidebar-card-title">
            <Info :size="16" />
            <h3>Métadonnées</h3>
          </div>
          <Divider />
          <dl class="metadata-list">
            <div class="metadata-item">
              <dt>Pays</dt>
              <dd>{{ texte.flag }} {{ texte.country }}</dd>
            </div>
            <div class="metadata-item">
              <dt>Date de promulgation</dt>
              <dd>{{ texte.datePromulgation }}</dd>
            </div>
            <div class="metadata-item">
              <dt>Date de publication</dt>
              <dd>{{ texte.datePublication }}</dd>
            </div>
            <div class="metadata-item">
              <dt>Type</dt>
              <dd>{{ texte.type }}</dd>
            </div>
            <div class="metadata-item">
              <dt>Source</dt>
              <dd>{{ texte.source }}</dd>
            </div>
            <div class="metadata-item">
              <dt>Hiérarchie des normes</dt>
              <dd>
                <span :class="['hierarchy-rank', `rank-${texte.hierarchyRank}`]">{{ texte.hierarchyRank }}</span>
                {{ texte.hierarchyLabel }}
              </dd>
            </div>
            <div class="metadata-item">
              <dt>Référence</dt>
              <dd class="ref-mono">{{ texte.reference }}</dd>
            </div>
          </dl>
        </div>

        <!-- Thèmes -->
        <div class="sidebar-card glass-card stagger-3">
          <div class="sidebar-card-title">
            <Tag :size="16" />
            <h3>Thèmes</h3>
          </div>
          <Divider />
          <div class="themes-tags">
            <NuxtLink
              v-for="theme in texte.themes"
              :key="theme.slug"
              :to="`/themes/${theme.slug}`"
              class="theme-tag-link hover-lift"
            >
              {{ theme.name }}
            </NuxtLink>
          </div>
        </div>

        <!-- Pense-bêtes -->
        <div v-if="isAuthenticated" class="sidebar-card glass-card stagger-4">
          <StickyNotes :text-id="route.params.id as string" />
        </div>

        <!-- Textes liés -->
        <div class="sidebar-card glass-card stagger-4">
          <div class="sidebar-card-title">
            <Link2 :size="16" />
            <h3>Textes liés</h3>
          </div>
          <Divider />

          <div v-if="texte.relatedTexts.modifiedBy.length" class="related-group">
            <h4 class="related-group-title">
              <ArrowUpRight :size="14" />
              Modifié par
            </h4>
            <div v-for="rel in texte.relatedTexts.modifiedBy" :key="rel.id" class="related-text-item">
              <NuxtLink :to="`/textes/${rel.id}`" class="related-text-link">{{ rel.title }}</NuxtLink>
              <span class="related-date">{{ rel.date }}</span>
            </div>
          </div>

          <div v-if="texte.relatedTexts.abrogates.length" class="related-group">
            <h4 class="related-group-title">
              <XCircle :size="14" />
              Abroge
            </h4>
            <div v-for="rel in texte.relatedTexts.abrogates" :key="rel.id" class="related-text-item">
              <NuxtLink :to="`/textes/${rel.id}`" class="related-text-link">{{ rel.title }}</NuxtLink>
              <span class="related-date">{{ rel.date }}</span>
            </div>
          </div>

          <div v-if="texte.relatedTexts.citedBy.length" class="related-group">
            <h4 class="related-group-title">
              <Quote :size="14" />
              Cité par
            </h4>
            <div v-for="rel in texte.relatedTexts.citedBy" :key="rel.id" class="related-text-item">
              <NuxtLink :to="`/textes/${rel.id}`" class="related-text-link">{{ rel.title }}</NuxtLink>
              <span class="related-date">{{ rel.date }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronRight, ShieldCheck, Clock, Download, Copy, Bookmark,
  Calendar, Scale, FileText, AlignLeft, ScrollText, MessageSquare,
  ThumbsUp, Info, Tag, Link2, ArrowUpRight, XCircle, Quote, FolderPlus,
} from 'lucide-vue-next';
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Divider from 'primevue/divider';

const route = useRoute();
const { getLegalText, getCommentsByText } = useApi();
const { setLegalTextSeo } = useSeo();
const { isAuthenticated, authFetch } = useAuth();
const loading = ref(true);

const isFavorited = ref(false);
const newComment = ref('');

// Folder add feature
const showFolderDropdown = ref(false);
const userFolders = ref<any[]>([]);
const foldersLoading = ref(false);
const folderAddedIds = ref<string[]>([]);

const toggleFolderDropdown = async () => {
  showFolderDropdown.value = !showFolderDropdown.value;
  if (showFolderDropdown.value && !userFolders.value.length) {
    foldersLoading.value = true;
    try {
      userFolders.value = await authFetch('/folders');
    } catch {
      userFolders.value = [];
    }
    foldersLoading.value = false;
  }
};

const addToFolder = async (folderId: string) => {
  const textId = route.params.id as string;
  try {
    await authFetch(`/folders/${folderId}/texts`, { method: 'POST', body: { textId } });
    folderAddedIds.value.push(folderId);
  } catch {
    // ignore
  }
  showFolderDropdown.value = false;
};

const submitComment = () => {
  if (!newComment.value.trim()) return;
  // TODO: wire to API when comment endpoint is available
  newComment.value = '';
};

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value;
};

const downloadPDF = () => {
  alert('Téléchargement du PDF en cours...');
};

const copyCitation = () => {
  const citation = `${texte.title} (${texte.reference}), ${texte.country}, ${texte.datePromulgation}.`;
  navigator.clipboard?.writeText(citation);
  alert('Citation copiée dans le presse-papiers !');
};

// Mock data for Beninese digital law
const texte = reactive({
  id: '1',
  title: 'Loi n°2024-15 portant Code du numérique en République du Bénin',
  reference: 'LOI-BJ-2024-15',
  country: 'Bénin',
  flag: '🇧🇯',
  type: 'Loi',
  isInForce: true,
  verified: true,
  hierarchyRank: 2,
  hierarchyLabel: 'Loi ordinaire',
  datePromulgation: '15 mars 2024',
  datePublication: '20 mars 2024',
  source: 'Journal Officiel du Bénin n°09/2024',
  summary: `La loi n°2024-15 portant Code du numérique établit le cadre juridique complet de la gouvernance numérique en République du Bénin. Elle régit les transactions électroniques, la cybersécurité, la protection des données à caractère personnel, ainsi que les obligations des opérateurs de services numériques opérant sur le territoire béninois. Ce texte fondateur vise à doter le Bénin d'un arsenal juridique moderne, aligné sur les meilleures pratiques internationales, pour accompagner la transformation digitale du pays.`,
  themes: [
    { name: 'Numérique & Télécoms', slug: 'numerique-telecoms' },
    { name: 'Protection des données', slug: 'donnees-personnelles' },
    { name: 'Cybersécurité', slug: 'cybersecurite' },
    { name: 'Commerce électronique', slug: 'commerce-electronique' },
  ],
  articles: [
    {
      id: 'preambule',
      heading: 'Préambule',
      body: "La présente loi s'inscrit dans le cadre de la mise en œuvre de la stratégie nationale de développement du numérique du Bénin. Elle vise à créer un environnement juridique propice au développement de l'économie numérique, à la protection des droits des citoyens dans le cyberespace et au renforcement de la confiance numérique.",
    },
    {
      id: 'art1',
      heading: 'Article 1 — Objet',
      body: "La présente loi a pour objet d'établir les règles applicables aux communications électroniques, aux transactions en ligne, à la protection des données à caractère personnel, à la cybersécurité et aux infractions commises au moyen des technologies de l'information et de la communication sur le territoire de la République du Bénin.",
    },
    {
      id: 'art2',
      heading: 'Article 2 — Champ d\'application',
      body: "La présente loi s'applique à toute personne physique ou morale, publique ou privée, qui collecte, traite, stocke ou transmet des données électroniques sur le territoire béninois, y compris les entités étrangères dont les services sont accessibles depuis le Bénin et traitent des données de ressortissants béninois.",
    },
    {
      id: 'art3',
      heading: 'Article 3 — Définitions',
      body: "Au sens de la présente loi, on entend par : (1) « Donnée à caractère personnel » : toute information se rapportant à une personne physique identifiée ou identifiable ; (2) « Traitement » : toute opération appliquée à des données personnelles, notamment la collecte, l'enregistrement, l'organisation, la conservation, la modification, l'extraction, la consultation, l'utilisation ou la communication ; (3) « Responsable du traitement » : la personne physique ou morale qui détermine les finalités et les moyens du traitement de données.",
    },
    {
      id: 'art12',
      heading: 'Article 12 — Consentement',
      body: "Le traitement des données à caractère personnel est licite si la personne concernée a consenti à celui-ci pour une ou plusieurs finalités spécifiques. Le consentement doit être libre, éclairé, spécifique et univoque. Il peut être retiré à tout moment, sans que ce retrait porte atteinte à la licéité du traitement fondé sur le consentement effectué avant ce retrait.",
    },
    {
      id: 'art25',
      heading: 'Article 25 — Autorité de régulation',
      body: "Il est institué une Autorité de Protection des Données Personnelles (APDP), autorité administrative indépendante chargée de veiller au respect des dispositions de la présente loi. Elle est dotée de la personnalité morale et de l'autonomie financière. L'APDP dispose d'un pouvoir d'instruction, d'enquête et de sanction à l'égard des responsables de traitement.",
    },
    {
      id: 'art38',
      heading: 'Article 38 — Sanctions pénales',
      body: "Toute personne qui collecte ou traite des données à caractère personnel sans satisfaire aux formalités préalables est punie d'un emprisonnement de six mois à cinq ans et d'une amende de 500.000 à 50.000.000 de francs CFA ou de l'une de ces deux peines seulement. En cas de récidive, les peines sont portées au double.",
    },
  ],
  comments: [
    {
      id: 'c1',
      name: 'Me Aïda Sossou',
      initials: 'AS',
      profession: 'Avocate au Barreau du Bénin',
      date: '18 mars 2024',
      body: "Ce Code du numérique représente une avancée majeure pour le droit béninois. L'article 25 instituant l'APDP est particulièrement bienvenu : le Bénin se dote enfin d'une autorité de régulation comparable aux CNIL européennes. Les entreprises opérant au Bénin ont désormais un interlocuteur institutionnel clair pour leurs questions de conformité.",
      upvotes: 34,
      upvoted: false,
    },
    {
      id: 'c2',
      name: 'Prof. Kodjo Akakpo',
      initials: 'KA',
      profession: 'Professeur de droit public, UAC Cotonou',
      date: '22 mars 2024',
      body: "Du point de vue académique, la définition du consentement à l'article 12 s'aligne étroitement sur le RGPD européen, ce qui facilitera la convergence juridique nécessaire pour les flux transfrontaliers de données. Toutefois, la pratique des transferts de données vers des pays tiers mériterait d'être précisée dans les décrets d'application.",
      upvotes: 21,
      upvoted: false,
    },
    {
      id: 'c3',
      name: 'Romuald Gbaguidi',
      initials: 'RG',
      profession: 'Consultant en conformité numérique',
      date: '5 avr. 2024',
      body: "Les sanctions prévues à l'article 38 sont significatives et crédibles. Avec 50 millions de FCFA d'amende maximale, le législateur béninois envoie un signal fort. Il sera néanmoins important que l'APDP soit dotée de ressources humaines et techniques suffisantes pour assurer une application effective de la loi.",
      upvotes: 15,
      upvoted: false,
    },
  ],
  relatedTexts: {
    modifiedBy: [
      {
        id: '11',
        title: 'Décret n°2024-412 fixant les modalités d\'application du Code du numérique',
        date: '10 juin 2024',
      },
    ],
    abrogates: [
      {
        id: '12',
        title: 'Loi n°2017-20 portant Code du numérique en République du Bénin (ancienne version)',
        date: '20 avr. 2018',
      },
    ],
    citedBy: [
      {
        id: '13',
        title: 'Décret n°2024-523 portant organisation de l\'APDP',
        date: '1 août 2024',
      },
      {
        id: '14',
        title: 'Arrêté n°2024-189 relatif aux conditions de traitement des données de santé',
        date: '15 sept. 2024',
      },
    ],
  },
});

onMounted(async () => {
  const id = String(route.params.id);
  try {
    const [textData, commentsData] = await Promise.all([
      getLegalText(id),
      getCommentsByText(id, 1, 20),
    ]);

    if (textData) {
      texte.id = textData.id;
      texte.title = textData.title;
      texte.reference = textData.reference;
      texte.country = textData.country?.name || texte.country;
      texte.flag = '';
      texte.type = textData.textType;
      texte.isInForce = textData.isInForce;
      texte.verified = textData.isVerified;
      texte.hierarchyRank = textData.hierarchyRank;
      texte.datePromulgation = textData.promulgationDate
        ? new Date(textData.promulgationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : texte.datePromulgation;
      texte.datePublication = textData.publicationDate
        ? new Date(textData.publicationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : texte.datePublication;
      texte.source = textData.sourceName || texte.source;
      texte.summary = textData.summary || '';
      texte.themes = (textData.themes || []).map(t => ({ name: t.name, slug: t.slug }));

      // Parse articles from contentText if available
      if (textData.contentText) {
        texte.articles = [{ id: 'content', heading: 'Texte intégral', body: textData.contentText }];
      }

      setLegalTextSeo({
        title: texte.title,
        reference: texte.reference,
        summary: texte.summary,
        country: texte.country ? { name: texte.country } : undefined,
        promulgationDate: textData.promulgationDate,
        themes: texte.themes,
      });
    }

    if (commentsData?.data?.length) {
      texte.comments = commentsData.data.map((c: any) => ({
        id: c.id,
        name: c.user?.fullName || 'Anonyme',
        initials: (c.user?.fullName || 'AN').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
        profession: c.user?.profession || '',
        date: c.createdAt
          ? new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        body: c.content || c.body || '',
        upvotes: c.upvoteCount || 0,
        upvoted: false,
      }));
    }
  } catch (e) {
    console.log('API not available, using mock text data');
    setLegalTextSeo({
      title: texte.title,
      reference: texte.reference,
      summary: texte.summary,
      country: texte.country ? { name: texte.country } : undefined,
      themes: texte.themes,
    });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.texte-detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-sm);
}

.breadcrumb-link {
  color: var(--juris-text-secondary);
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: var(--juris-primary);
}

.breadcrumb-sep {
  color: var(--juris-text-muted);
}

.breadcrumb-current {
  color: var(--juris-text);
  font-weight: 500;
}

/* Header */
.texte-header {
  padding: 28px 32px;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.header-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--juris-border);
  background: var(--juris-surface);
  color: var(--juris-text-secondary);
  font-size: var(--font-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn:hover {
  border-color: var(--juris-primary-lighter);
  color: var(--juris-primary);
  background: var(--juris-primary-50);
}

.action-btn.bookmarked {
  background: var(--juris-secondary);
  border-color: var(--juris-secondary);
  color: white;
}

.texte-title {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
  line-height: 1.35;
  margin-bottom: 20px;
}

.texte-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--juris-bg);
  border: 1px solid var(--juris-border-light);
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
}

.meta-flag {
  font-size: 1rem;
}

/* Content Layout */
.content-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

/* Content Main */
.content-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-section {
  padding: 24px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.section-title-row h2 {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--juris-text);
}

.section-icon {
  color: var(--juris-primary);
  flex-shrink: 0;
}

.comment-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--juris-primary);
  color: white;
  font-size: var(--font-xs);
  font-weight: 700;
  margin-left: 4px;
}

/* Summary */
.summary-text {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
  line-height: 1.75;
  font-style: italic;
  border-left: 3px solid var(--juris-primary-lighter);
  padding-left: 16px;
}

/* Legal Text Content */
.legal-text-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.article-block {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--juris-border-light);
}

.article-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.article-heading {
  font-size: var(--font-base);
  font-weight: 700;
  color: var(--juris-primary);
  margin-bottom: 10px;
}

.article-body {
  font-size: var(--font-sm);
  color: var(--juris-text);
  line-height: 1.8;
}

/* Comments */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-card {
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--juris-bg);
  border: 1px solid var(--juris-border-light);
}

.comment-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--juris-gradient-primary);
  color: white;
  font-size: var(--font-xs);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-text);
}

.author-profession {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

.comment-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.comment-date {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

.upvote-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--juris-border);
  background: transparent;
  color: var(--juris-text-secondary);
  font-size: var(--font-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upvote-btn:hover,
.upvote-btn.active {
  border-color: var(--juris-accent);
  color: var(--juris-accent);
  background: rgba(0, 137, 123, 0.06);
}

.comment-body {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  line-height: 1.65;
}

/* Sidebar */
.content-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: calc(var(--header-height) + 16px);
}

.sidebar-card {
  padding: 20px;
}

.sidebar-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: var(--juris-primary);
}

.sidebar-card-title h3 {
  font-size: var(--font-base);
  font-weight: 700;
  color: var(--juris-text);
}

/* Metadata */
.metadata-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metadata-item dt {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metadata-item dd {
  font-size: var(--font-sm);
  color: var(--juris-text);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ref-mono {
  font-family: monospace;
  font-size: var(--font-xs) !important;
  color: var(--juris-text-secondary) !important;
}

/* Themes */
.themes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.theme-tag-link {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  font-size: var(--font-xs);
  font-weight: 600;
  border: 1px solid var(--juris-primary-100);
  transition: all 0.2s ease;
  text-decoration: none;
}

.theme-tag-link:hover {
  background: var(--juris-primary);
  color: white;
}

/* Related Texts */
.related-group {
  margin-bottom: 16px;
}

.related-group:last-child {
  margin-bottom: 0;
}

.related-group-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-xs);
  font-weight: 700;
  color: var(--juris-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.related-text-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: var(--radius-sm);
  border-left: 2px solid var(--juris-primary-lighter);
  background: var(--juris-primary-50);
  margin-bottom: 6px;
}

.related-text-link {
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--juris-primary);
  line-height: 1.4;
  transition: color 0.2s ease;
}

.related-text-link:hover {
  color: var(--juris-primary-dark);
  text-decoration: underline;
}

.related-date {
  font-size: 0.65rem;
  color: var(--juris-text-muted);
}

/* Responsive */
@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .content-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .texte-header {
    padding: 20px 16px;
  }

  .texte-title {
    font-size: var(--font-xl);
  }

  .header-top {
    flex-direction: column;
  }

  .action-btn span {
    display: none;
  }

  .action-btn {
    padding: 8px 12px;
  }
}

.comment-form-wrapper {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--juris-border);
}

.comment-form-title {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--juris-text);
  margin-bottom: 12px;
}

.comment-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--juris-border);
  border-radius: 10px;
  font-size: var(--font-sm);
  font-family: var(--font-family);
  color: var(--juris-text);
  background: var(--juris-surface);
  resize: vertical;
  outline: none;
  transition: border-color 0.2s ease;
}

.comment-textarea:focus {
  border-color: var(--juris-primary-lighter);
  box-shadow: 0 0 0 3px var(--juris-primary-100);
}

.btn-submit-comment {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 20px;
  background: var(--juris-gradient-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: var(--font-sm);
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit-comment:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Folder Add Dropdown */
.folder-add-wrapper {
  position: relative;
}

.folder-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  z-index: 200;
  padding: 8px 0;
}

.folder-dropdown-loading,
.folder-dropdown-empty {
  padding: 12px 16px;
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
}

.folder-dropdown-link {
  display: block;
  margin-top: 8px;
  font-size: var(--font-sm);
  color: var(--juris-primary-light);
}

.folder-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: var(--font-sm);
  color: var(--juris-text);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-family);
  transition: background 0.15s ease;
}

.folder-dropdown-item:hover {
  background: var(--juris-primary-50);
  color: var(--juris-primary);
}

.folder-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
