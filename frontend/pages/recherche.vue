<template>
  <div class="recherche-page">
    <!-- Search Header -->
    <section class="search-hero fade-in-up">
      <h1>Recherche de textes juridiques</h1>
      <p>Explorez la base de données du droit africain francophone</p>

      <div class="search-input-wrapper">
        <Search :size="20" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher une loi, un décret, un acte uniforme..."
          @input="onSearch"
        />
      </div>
    </section>

    <!-- Filters Bar -->
    <section class="filters-bar glass-card fade-in-up stagger-2">
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label">Pays</label>
          <Select
            v-model="selectedPays"
            :options="paysOptions"
            option-label="label"
            option-value="value"
            placeholder="Tous les pays"
            class="filter-select"
            @change="onFilter"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">Thème</label>
          <Select
            v-model="selectedTheme"
            :options="themeOptions"
            option-label="label"
            option-value="value"
            placeholder="Tous les thèmes"
            class="filter-select"
            @change="onFilter"
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
            @change="onFilter"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">Statut</label>
          <Select
            v-model="selectedStatut"
            :options="statutOptions"
            option-label="label"
            option-value="value"
            placeholder="Tous"
            class="filter-select"
            @change="onFilter"
          />
        </div>

        <div class="filter-group filter-reset">
          <button class="btn-reset hover-lift" @click="resetFilters">
            <X :size="16" />
            Réinitialiser
          </button>
        </div>
      </div>
    </section>

    <!-- Results Section -->
    <section class="results-section fade-in-up stagger-4">
      <!-- Results Count -->
      <div class="results-header">
        <p class="results-count">
          <span class="count-number">{{ filteredTexts.length }}</span>
          résultat{{ filteredTexts.length !== 1 ? 's' : '' }} trouvé{{ filteredTexts.length !== 1 ? 's' : '' }}
          <span v-if="searchQuery" class="search-term"> pour "<strong>{{ searchQuery }}</strong>"</span>
        </p>
        <div class="sort-controls">
          <span class="sort-label">Trier par :</span>
          <button
            v-for="sort in sortOptions"
            :key="sort.value"
            :class="['sort-btn', { active: selectedSort === sort.value }]"
            @click="selectedSort = sort.value"
          >
            {{ sort.label }}
          </button>
        </div>
      </div>

      <!-- Export — Premium feature -->
      <PremiumGate
        title="Export des résultats"
        description="Exportez les résultats de votre recherche en PDF ou Excel avec un abonnement Premium."
      >
        <div class="export-bar">
          <button class="btn-export hover-lift" @click="exportResults('pdf')">
            <FileSearch :size="16" />
            Exporter en PDF
          </button>
          <button class="btn-export hover-lift" @click="exportResults('excel')">
            <FileSearch :size="16" />
            Exporter en Excel
          </button>
        </div>
        <template #preview>
          <div class="export-bar export-bar--preview">
            <button class="btn-export" disabled>Exporter en PDF</button>
            <button class="btn-export" disabled>Exporter en Excel</button>
          </div>
        </template>
      </PremiumGate>

      <!-- Empty State -->
      <div v-if="paginatedTexts.length === 0" class="empty-state glass-card">
        <FileSearch :size="48" class="empty-icon" />
        <h3>Aucun texte trouvé</h3>
        <p>Essayez d'autres mots-clés ou modifiez les filtres de recherche.</p>
        <button class="btn-reset hover-lift" @click="resetFilters">
          <X :size="16" />
          Réinitialiser les filtres
        </button>
      </div>

      <!-- Results List -->
      <div v-else class="texts-list">
        <div
          v-for="(text, index) in paginatedTexts"
          :key="text.id"
          :class="['legal-text-card', 'card-hover', `stagger-${Math.min(index + 1, 8)}`]"
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
              <span class="flag">{{ text.flag }}</span>
              {{ text.country }}
            </span>
            <span class="meta-item">
              <Calendar :size="14" />
              {{ text.date }}
            </span>
            <span class="meta-item">
              <Scale :size="14" />
              {{ text.type }}
            </span>
            <span v-if="text.verified" class="meta-item verified-badge">
              <ShieldCheck :size="14" />
              Vérifié
            </span>
          </div>

          <p v-if="text.summary" class="card-summary">{{ text.summary }}</p>

          <div class="card-themes">
            <span
              v-for="theme in text.themes"
              :key="theme"
              class="theme-tag"
            >
              {{ theme }}
            </span>
          </div>

          <div class="card-footer">
            <NuxtLink :to="`/textes/${text.id}`" class="read-link">
              Lire le texte
              <ChevronRight :size="14" />
            </NuxtLink>
            <span class="ref-number">{{ text.reference }}</span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredTexts.length > perPage" class="pagination-wrapper">
        <Paginator
          v-model:first="paginationFirst"
          :rows="perPage"
          :total-records="filteredTexts.length"
          :rows-per-page-options="[5, 10, 20]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Search, X, Calendar, Scale, ShieldCheck,
  ChevronRight, FileSearch,
} from 'lucide-vue-next';
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Select from 'primevue/select';
import Paginator from 'primevue/paginator';

const route = useRoute();
const { searchTexts, getLegalTexts } = useApi();

const { setPageSeo } = useSeo();
setPageSeo('Recherche', 'Recherchez parmi 500+ textes juridiques de 26 pays africains francophones');

// Search & Filters
const searchQuery = ref('');
const selectedPays = ref(null);
const selectedTheme = ref(null);
const selectedType = ref(null);
const selectedStatut = ref(null);
const selectedSort = ref('date-desc');
const paginationFirst = ref(0);
const perPage = ref(10);
const loading = ref(false);
const apiTexts = ref<any[]>([]);
const usingApiData = ref(false);

// Pre-fill from URL query param and trigger search
onMounted(async () => {
  if (route.query.q) {
    searchQuery.value = String(route.query.q);
  }
  await fetchFromApi();
});

const fetchFromApi = async () => {
  loading.value = true;
  try {
    const params: Record<string, string> = { page: '1', limit: '50', status: 'published' };
    if (selectedPays.value) params.countryCode = selectedPays.value;
    if (selectedTheme.value) params.themeSlug = selectedTheme.value;
    if (selectedType.value) params.textType = selectedType.value;

    // Use legal-texts endpoint directly (works without Typesense)
    const textsRes = await getLegalTexts(params);
    const results = textsRes?.data || [];

    if (results.length > 0) {
      apiTexts.value = results.map((t: any) => ({
        id: t.id,
        title: t.title,
        reference: t.reference || '',
        country: t.country?.name || '',
        countryCode: t.country?.code || '',
        flag: '',
        date: t.promulgationDate
          ? new Date(t.promulgationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        dateSort: t.promulgationDate
          ? parseInt(new Date(t.promulgationDate).toISOString().slice(0, 10).replace(/-/g, ''))
          : 0,
        type: t.textType || '',
        isInForce: t.isInForce ?? true,
        verified: t.isVerified ?? false,
        themes: (t.themes || []).map((th: any) => th.name || th),
        summary: t.summary || '',
      }));
      usingApiData.value = true;
    } else {
      usingApiData.value = false;
    }
  } catch (e) {
    console.log('API not available, using mock data');
    usingApiData.value = false;
  } finally {
    loading.value = false;
  }
};

// Filter options
const paysOptions = [
  { label: 'Tous les pays', value: null },
  { label: '🇧🇯 Bénin', value: 'Bénin' },
  { label: '🇸🇳 Sénégal', value: 'Sénégal' },
  { label: '🇨🇮 Côte d\'Ivoire', value: 'Côte d\'Ivoire' },
  { label: '🇹🇬 Togo', value: 'Togo' },
  { label: '🇨🇲 Cameroun', value: 'Cameroun' },
  { label: '🌍 OHADA', value: 'OHADA' },
];

const themeOptions = [
  { label: 'Tous les thèmes', value: null },
  { label: 'Constitution', value: 'Constitution' },
  { label: 'Droit des affaires', value: 'Droit des affaires' },
  { label: 'Énergie électrique', value: 'Énergie électrique' },
  { label: 'Numérique', value: 'Numérique' },
  { label: 'Environnement', value: 'Environnement' },
  { label: 'Élevage', value: 'Élevage' },
];

const typeOptions = [
  { label: 'Tous les types', value: null },
  { label: 'Constitution', value: 'Constitution' },
  { label: 'Loi', value: 'Loi' },
  { label: 'Décret', value: 'Décret' },
  { label: 'Ordonnance', value: 'Ordonnance' },
  { label: 'Arrêté', value: 'Arrêté' },
  { label: 'Acte uniforme', value: 'Acte uniforme' },
  { label: 'Traité', value: 'Traité' },
];

const statutOptions = [
  { label: 'Tous', value: null },
  { label: 'En vigueur', value: true },
  { label: 'Abrogé', value: false },
];

const sortOptions = [
  { label: 'Plus récent', value: 'date-desc' },
  { label: 'Plus ancien', value: 'date-asc' },
  { label: 'Pertinence', value: 'relevance' },
];

// Texts — populated from API
const allTexts: any[] = [];

// Computed: filtered results
const filteredTexts = computed(() => {
  let results = usingApiData.value ? [...apiTexts.value] : [...allTexts];

  // Client-side text search filter (applies to both API and mock data)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    results = results.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.themes.some((th: string) => th.toLowerCase().includes(q)) ||
      (t.summary && t.summary.toLowerCase().includes(q))
    );
  }

  // Only apply dropdown filters on mock data (API already filters server-side)
  if (!usingApiData.value) {
    if (selectedPays.value) {
      results = results.filter(t => t.country === selectedPays.value);
    }
    if (selectedTheme.value) {
      results = results.filter(t => t.themes.includes(selectedTheme.value));
    }
    if (selectedType.value) {
      results = results.filter(t => t.type === selectedType.value);
    }
    if (selectedStatut.value !== null && selectedStatut.value !== undefined) {
      results = results.filter(t => t.isInForce === selectedStatut.value);
    }
  }

  // Sort
  if (selectedSort.value === 'date-desc') {
    results.sort((a, b) => b.dateSort - a.dateSort);
  } else if (selectedSort.value === 'date-asc') {
    results.sort((a, b) => a.dateSort - b.dateSort);
  }

  return results;
});

// Computed: paginated results
const paginatedTexts = computed(() => {
  return filteredTexts.value.slice(paginationFirst.value, paginationFirst.value + perPage.value);
});

// Reset pagination when filters change
watch(filteredTexts, () => {
  paginationFirst.value = 0;
});

const onSearch = () => {
  paginationFirst.value = 0;
  fetchFromApi();
};

const onFilter = () => {
  paginationFirst.value = 0;
  fetchFromApi();
};

const exportResults = (format: 'pdf' | 'excel') => {
  // TODO: wire to API export endpoint when available
  console.log(`Export as ${format}`, filteredTexts.value.length, 'results');
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedPays.value = null;
  selectedTheme.value = null;
  selectedType.value = null;
  selectedStatut.value = null;
  paginationFirst.value = 0;
  usingApiData.value = false;
};
</script>

<style scoped>
.recherche-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Filters Bar */
.filters-bar {
  padding: 20px 24px;
}

.filters-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
  flex: 1;
}

.filter-label {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-select {
  width: 100%;
}

.filter-reset {
  min-width: auto;
  justify-content: flex-end;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--juris-border);
  background: transparent;
  color: var(--juris-text-secondary);
  font-size: var(--font-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-reset:hover {
  border-color: var(--juris-danger);
  color: var(--juris-danger);
  background: rgba(198, 40, 40, 0.04);
}

/* Results */
.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.results-count {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
}

.count-number {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--juris-primary);
  margin-right: 4px;
}

.search-term {
  color: var(--juris-text-muted);
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  font-weight: 500;
}

.sort-btn {
  padding: 6px 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--juris-border);
  background: transparent;
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--juris-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-btn:hover,
.sort-btn.active {
  background: var(--juris-primary);
  border-color: var(--juris-primary);
  color: white;
}

/* Texts List */
.texts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Card Extensions */
.flag {
  font-size: 1rem;
  line-height: 1;
}

.verified-badge {
  color: var(--juris-success) !important;
}

.card-summary {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  line-height: 1.5;
  margin-top: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.theme-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid var(--juris-primary-100);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--juris-border-light);
}

.read-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-primary-light);
  transition: color 0.2s ease;
}

.read-link:hover {
  color: var(--juris-primary);
}

.ref-number {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  font-family: monospace;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  color: var(--juris-text-muted);
}

.empty-state h3 {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--juris-text);
}

.empty-state p {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  max-width: 400px;
}

/* Pagination */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .filters-grid {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .sort-controls {
    flex-wrap: wrap;
  }
}

.export-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--juris-surface);
  border: 1px solid var(--juris-border);
  border-radius: 8px;
  font-size: var(--font-sm);
  font-weight: 500;
  font-family: var(--font-family);
  color: var(--juris-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-export:hover:not(:disabled) {
  background: var(--juris-surface-hover);
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
