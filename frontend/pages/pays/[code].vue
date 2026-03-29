<template>
  <div class="pays-detail-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb fade-in-up">
      <NuxtLink to="/pays" class="breadcrumb-link">
        <ChevronLeft :size="16" />
        Pays
      </NuxtLink>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">{{ country.name }}</span>
    </nav>

    <!-- Page Header -->
    <header class="page-header glass-card fade-in-up stagger-1">
      <div class="header-main">
        <div class="country-flag-lg">{{ country.flag }}</div>
        <div class="header-info">
          <h1 class="gradient-text">{{ country.name }}</h1>
          <div class="header-meta">
            <span class="meta-badge">
              <MapPin :size="13" />
              {{ country.region }}
            </span>
            <span class="meta-badge">
              <Scale :size="13" />
              {{ country.legalSystem }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Stats Row -->
    <div class="stats-row glass-card fade-in-up stagger-2">
      <div class="stat-block">
        <span class="stat-num gradient-text">{{ country.texts }}</span>
        <span class="stat-lbl">textes juridiques</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-block">
        <span class="stat-num gradient-text">{{ themesCovered }}</span>
        <span class="stat-lbl">thèmes couverts</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-block">
        <span class="stat-num gradient-text">{{ verifiedCount }}</span>
        <span class="stat-lbl">textes vérifiés</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar glass-card fade-in-up stagger-3">
      <div class="filter-group">
        <label class="filter-label">Thème</label>
        <Select
          v-model="selectedTheme"
          :options="themeOptions"
          option-label="label"
          option-value="value"
          placeholder="Tous les thèmes"
          class="filter-select"
        />
      </div>
      <div class="filter-group">
        <label class="filter-label">Type de texte</label>
        <Select
          v-model="selectedType"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          placeholder="Tous les types"
          class="filter-select"
        />
      </div>
      <div class="filter-group">
        <label class="filter-label">Statut</label>
        <Select
          v-model="selectedStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          placeholder="Tous les statuts"
          class="filter-select"
        />
      </div>
      <button v-if="hasActiveFilters" class="reset-btn" @click="resetFilters">
        <X :size="14" />
        Réinitialiser
      </button>
    </div>

    <!-- Results count -->
    <div class="results-header fade-in-up stagger-4">
      <span class="results-count">{{ filteredTexts.length }} texte{{ filteredTexts.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="filteredTexts.length === 0" class="empty-state glass-card fade-in-up">
      <FileX :size="40" class="empty-icon" />
      <p>Aucun texte ne correspond à vos critères de recherche.</p>
      <button class="reset-btn-lg" @click="resetFilters">Réinitialiser les filtres</button>
    </div>

    <!-- Legal Texts List -->
    <div v-else class="texts-list fade-in-up stagger-4">
      <div
        v-for="text in filteredTexts"
        :key="text.id"
        class="legal-text-card card-hover"
      >
        <div class="card-header">
          <NuxtLink :to="`/textes/${text.id}`" class="card-title">
            {{ text.title }}
          </NuxtLink>
          <span :class="['status-badge', text.isInForce ? 'in-force' : 'abrogated']">
            {{ text.isInForce ? 'En vigueur' : 'Abrogé' }}
          </span>
        </div>

        <div class="card-meta">
          <span class="meta-item">
            <Calendar :size="14" />
            {{ text.date }}
          </span>
          <span class="meta-item">
            <Scale :size="14" />
            {{ text.type }}
          </span>
          <span v-if="text.isVerified" class="meta-item verified-item">
            <ShieldCheck :size="14" />
            Vérifié
          </span>
        </div>

        <div class="card-themes">
          <span
            v-for="theme in text.themes"
            :key="theme"
            class="p-tag p-tag-rounded"
            style="font-size: 0.7rem;"
          >
            {{ theme }}
          </span>
        </div>
      </div>
    </div>

    <!-- Unknown country fallback -->
    <div v-if="!country.name" class="empty-state glass-card fade-in-up">
      <Globe :size="40" class="empty-icon" />
      <p>Pays introuvable.</p>
      <NuxtLink to="/pays" class="back-link">Retour à la liste des pays</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronLeft, MapPin, Scale, Calendar, FileText,
  ShieldCheck, Globe, FileX, X,
} from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import Select from 'primevue/select';

const route = useRoute();
const code = (route.params.code as string).toUpperCase();

const countryData: Record<string, any> = {
  BJ: {
    name: 'République du Bénin',
    flag: '🇧🇯',
    region: "Afrique de l'Ouest",
    legalSystem: 'Civil law',
    texts: 45,
  },
  SN: {
    name: 'République du Sénégal',
    flag: '🇸🇳',
    region: "Afrique de l'Ouest",
    legalSystem: 'Civil law',
    texts: 38,
  },
  CI: {
    name: "République de Côte d'Ivoire",
    flag: '🇨🇮',
    region: "Afrique de l'Ouest",
    legalSystem: 'Civil law',
    texts: 42,
  },
  TG: {
    name: 'République Togolaise',
    flag: '🇹🇬',
    region: "Afrique de l'Ouest",
    legalSystem: 'Civil law',
    texts: 22,
  },
  CM: {
    name: 'République du Cameroun',
    flag: '🇨🇲',
    region: 'Afrique Centrale',
    legalSystem: 'Mixed (Civil/Common)',
    texts: 35,
  },
};

const country = countryData[code] ?? {
  name: '',
  flag: '🏳️',
  region: '',
  legalSystem: '',
  texts: 0,
};

const themesCovered = 8;
const verifiedCount = Math.floor((country.texts ?? 0) * 0.7);

// Mock legal texts
const mockTexts = [
  {
    id: '101',
    title: `Constitution de la ${country.name || 'République'}`,
    date: '22 nov. 1990',
    type: 'Constitution',
    isInForce: true,
    isVerified: true,
    themes: ['Constitution', 'Droit constitutionnel'],
    themeSlug: 'constitution',
  },
  {
    id: '102',
    title: `Code pénal de la ${country.name || 'République'}`,
    date: '15 jan. 2012',
    type: 'Loi',
    isInForce: true,
    isVerified: true,
    themes: ['Droit pénal', 'Procédure pénale'],
    themeSlug: 'droit-penal',
  },
  {
    id: '103',
    title: `Loi portant Code du travail`,
    date: '03 avr. 2017',
    type: 'Loi',
    isInForce: true,
    isVerified: false,
    themes: ['Droit du travail', 'Sécurité sociale'],
    themeSlug: 'droit-travail',
  },
  {
    id: '104',
    title: `Décret portant règlementation des marchés publics`,
    date: '28 juil. 2020',
    type: 'Décret',
    isInForce: true,
    isVerified: true,
    themes: ['Marchés publics'],
    themeSlug: 'marches-publics',
  },
  {
    id: '105',
    title: `Loi relative à la protection des données personnelles`,
    date: '12 oct. 2022',
    type: 'Loi',
    isInForce: true,
    isVerified: true,
    themes: ['Protection des données', 'Numérique & Télécoms'],
    themeSlug: 'donnees-personnelles',
  },
  {
    id: '106',
    title: `Loi portant Code de l'environnement`,
    date: '19 fév. 2019',
    type: 'Loi',
    isInForce: false,
    isVerified: false,
    themes: ['Environnement', 'Biodiversité'],
    themeSlug: 'environnement',
  },
];

// Filters
const selectedTheme = ref<string | null>(null);
const selectedType = ref<string | null>(null);
const selectedStatus = ref<string | null>(null);

const themeOptions = [
  { label: 'Tous les thèmes', value: null },
  { label: 'Constitution', value: 'constitution' },
  { label: 'Droit pénal', value: 'droit-penal' },
  { label: 'Droit du travail', value: 'droit-travail' },
  { label: 'Marchés publics', value: 'marches-publics' },
  { label: 'Protection des données', value: 'donnees-personnelles' },
  { label: 'Environnement', value: 'environnement' },
];

const typeOptions = [
  { label: 'Tous les types', value: null },
  { label: 'Constitution', value: 'Constitution' },
  { label: 'Loi', value: 'Loi' },
  { label: 'Décret', value: 'Décret' },
  { label: 'Ordonnance', value: 'Ordonnance' },
  { label: 'Arrêté', value: 'Arrêté' },
];

const statusOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'En vigueur', value: 'in-force' },
  { label: 'Abrogé', value: 'abrogated' },
];

const hasActiveFilters = computed(
  () => selectedTheme.value !== null || selectedType.value !== null || selectedStatus.value !== null,
);

const filteredTexts = computed(() => {
  let results = mockTexts;

  if (selectedTheme.value) {
    results = results.filter(t => t.themeSlug === selectedTheme.value);
  }

  if (selectedType.value) {
    results = results.filter(t => t.type === selectedType.value);
  }

  if (selectedStatus.value === 'in-force') {
    results = results.filter(t => t.isInForce);
  } else if (selectedStatus.value === 'abrogated') {
    results = results.filter(t => !t.isInForce);
  }

  return results;
});

const resetFilters = () => {
  selectedTheme.value = null;
  selectedType.value = null;
  selectedStatus.value = null;
};
</script>

<style scoped>
.pays-detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-sm);
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--juris-primary-light);
  font-weight: 500;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: var(--juris-primary);
}

.breadcrumb-sep {
  color: var(--juris-text-muted);
}

.breadcrumb-current {
  color: var(--juris-text-secondary);
  font-weight: 500;
}

/* Page Header */
.page-header {
  padding: 28px 32px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.country-flag-lg {
  font-size: 4rem;
  line-height: 1;
  flex-shrink: 0;
}

.header-info h1 {
  font-size: var(--font-3xl);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 10px;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  background: var(--juris-border-light);
  border: 1px solid var(--juris-border);
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

/* Stats Row */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 20px 32px;
}

.stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 40px;
}

.stat-num {
  font-size: var(--font-2xl);
  font-weight: 800;
}

.stat-lbl {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--juris-border);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  padding: 20px 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 160px;
}

.filter-label {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-select {
  width: 100%;
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--juris-border);
  background: transparent;
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--juris-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-end;
  white-space: nowrap;
}

.reset-btn:hover {
  border-color: var(--juris-danger);
  color: var(--juris-danger);
  background: rgba(198, 40, 40, 0.05);
}

/* Results Header */
.results-header {
  display: flex;
  align-items: center;
}

.results-count {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-text-secondary);
}

/* Texts List */
.texts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Card overrides */
.verified-item {
  color: var(--juris-success) !important;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 56px 24px;
  text-align: center;
}

.empty-icon {
  color: var(--juris-text-muted);
}

.empty-state p {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
}

.reset-btn-lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--juris-border);
  background: transparent;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn-lg:hover {
  background: var(--juris-primary-50);
  border-color: var(--juris-primary-lighter);
}

.back-link {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-primary-light);
}

.back-link:hover {
  color: var(--juris-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    padding: 20px;
  }

  .header-main {
    gap: 16px;
  }

  .country-flag-lg {
    font-size: 3rem;
  }

  .header-info h1 {
    font-size: var(--font-2xl);
  }

  .stats-row {
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
  }

  .stat-divider {
    display: none;
  }

  .stat-block {
    padding: 0 16px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
    gap: 12px;
  }

  .filter-group {
    min-width: unset;
  }

  .reset-btn {
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .country-flag-lg {
    font-size: 2.5rem;
  }
}
</style>
