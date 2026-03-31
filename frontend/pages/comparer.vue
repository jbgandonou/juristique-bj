<template>
  <div class="comparer-page">
    <!-- Page Header -->
    <header class="page-header fade-in-up">
      <div class="header-content">
        <div class="header-icon">
          <Columns :size="32" />
        </div>
        <div>
          <h1 class="gradient-text">Droit comparé</h1>
          <p class="header-subtitle">Comparez les textes juridiques entre pays sur un même thème</p>
        </div>
      </div>
    </header>

    <PremiumGate
      title="Droit comparé"
      description="Comparez côte à côte les textes juridiques de plusieurs pays sur un même thème. Fonctionnalité réservée aux abonnés Premium."
    >
      <!-- Real content for premium users -->
      <div class="comparer-content">
        <!-- Selection bar -->
        <div class="selection-bar glass-card fade-in-up stagger-1">
          <div class="selection-field">
            <label class="field-label">Thème juridique</label>
            <Select
              v-model="selectedTheme"
              :options="themeOptions"
              option-label="label"
              option-value="value"
              placeholder="Sélectionner un thème"
              class="field-select"
            />
          </div>

          <div class="selection-field">
            <label class="field-label">Pays 1</label>
            <Select
              v-model="selectedCountry1"
              :options="countryOptions"
              option-label="label"
              option-value="value"
              placeholder="Sélectionner un pays"
              class="field-select"
            />
          </div>

          <div class="selection-field">
            <label class="field-label">Pays 2</label>
            <Select
              v-model="selectedCountry2"
              :options="countryOptions"
              option-label="label"
              option-value="value"
              placeholder="Sélectionner un pays"
              class="field-select"
            />
          </div>

          <div class="selection-field selection-action">
            <button
              class="btn-compare hover-lift"
              :disabled="!selectedTheme || !selectedCountry1 || !selectedCountry2 || loading"
              @click="runComparison"
            >
              <Loader v-if="loading" :size="16" class="spin" />
              <GitCompare v-else :size="16" />
              Comparer
            </button>
          </div>
        </div>

        <!-- Results -->
        <div v-if="hasResults" class="comparison-columns fade-in-up stagger-2">
          <!-- Column 1 -->
          <div class="comparison-column">
            <div class="column-header">
              <span class="country-flag">{{ getCountryFlag(selectedCountry1) }}</span>
              <h2 class="country-name">{{ getCountryName(selectedCountry1) }}</h2>
              <span class="results-badge">{{ (results[selectedCountry1] || []).length }} texte{{ (results[selectedCountry1] || []).length !== 1 ? 's' : '' }}</span>
            </div>

            <div v-if="(results[selectedCountry1] || []).length === 0" class="column-empty">
              <FileSearch :size="32" class="empty-icon" />
              <p>Aucun texte trouvé pour ce thème</p>
            </div>

            <div v-else class="column-texts">
              <div
                v-for="text in results[selectedCountry1]"
                :key="text.id"
                class="legal-text-card"
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
                    <Calendar :size="13" />
                    {{ formatDate(text.promulgationDate) }}
                  </span>
                  <span class="meta-item">
                    <Scale :size="13" />
                    {{ text.textType }}
                  </span>
                </div>
                <p v-if="text.summary" class="card-summary">{{ text.summary }}</p>
                <div class="card-footer">
                  <NuxtLink :to="`/textes/${text.id}`" class="read-link">
                    Lire le texte
                    <ChevronRight :size="13" />
                  </NuxtLink>
                  <span class="ref-number">{{ text.reference }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="columns-divider" />

          <!-- Column 2 -->
          <div class="comparison-column">
            <div class="column-header">
              <span class="country-flag">{{ getCountryFlag(selectedCountry2) }}</span>
              <h2 class="country-name">{{ getCountryName(selectedCountry2) }}</h2>
              <span class="results-badge">{{ (results[selectedCountry2] || []).length }} texte{{ (results[selectedCountry2] || []).length !== 1 ? 's' : '' }}</span>
            </div>

            <div v-if="(results[selectedCountry2] || []).length === 0" class="column-empty">
              <FileSearch :size="32" class="empty-icon" />
              <p>Aucun texte trouvé pour ce thème</p>
            </div>

            <div v-else class="column-texts">
              <div
                v-for="text in results[selectedCountry2]"
                :key="text.id"
                class="legal-text-card"
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
                    <Calendar :size="13" />
                    {{ formatDate(text.promulgationDate) }}
                  </span>
                  <span class="meta-item">
                    <Scale :size="13" />
                    {{ text.textType }}
                  </span>
                </div>
                <p v-if="text.summary" class="card-summary">{{ text.summary }}</p>
                <div class="card-footer">
                  <NuxtLink :to="`/textes/${text.id}`" class="read-link">
                    Lire le texte
                    <ChevronRight :size="13" />
                  </NuxtLink>
                  <span class="ref-number">{{ text.reference }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Initial empty state (no comparison run yet) -->
        <div v-else-if="!loading" class="initial-state glass-card fade-in-up stagger-2">
          <Columns :size="48" class="empty-icon" />
          <h3>Sélectionnez un thème et deux pays pour comparer</h3>
          <p>La comparaison affichera les 5 textes les plus récents publiés dans chaque pays pour le thème sélectionné.</p>
        </div>
      </div>

      <!-- Preview slot — shown blurred to free users -->
      <template #preview>
        <div class="comparer-preview">
          <div class="preview-bar glass-card">
            <div class="preview-field">
              <div class="preview-label" />
              <div class="preview-select" />
            </div>
            <div class="preview-field">
              <div class="preview-label" />
              <div class="preview-select" />
            </div>
            <div class="preview-field">
              <div class="preview-label" />
              <div class="preview-select" />
            </div>
            <div class="preview-btn" />
          </div>

          <div class="preview-columns">
            <div class="preview-column">
              <div class="preview-col-header">
                <div class="preview-flag" />
                <div class="preview-col-title" />
              </div>
              <div class="preview-card">
                <div class="preview-card-title" />
                <div class="preview-card-meta" />
                <div class="preview-card-body" />
              </div>
              <div class="preview-card">
                <div class="preview-card-title" />
                <div class="preview-card-meta" />
                <div class="preview-card-body" />
              </div>
            </div>

            <div class="preview-divider" />

            <div class="preview-column">
              <div class="preview-col-header">
                <div class="preview-flag" />
                <div class="preview-col-title" />
              </div>
              <div class="preview-card">
                <div class="preview-card-title" />
                <div class="preview-card-meta" />
                <div class="preview-card-body" />
              </div>
              <div class="preview-card">
                <div class="preview-card-title" />
                <div class="preview-card-meta" />
                <div class="preview-card-body" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </PremiumGate>
  </div>
</template>

<script setup lang="ts">
import {
  Columns, GitCompare, Loader, FileSearch,
  Calendar, Scale, ChevronRight,
} from 'lucide-vue-next';
import { ref, computed } from 'vue';
import Select from 'primevue/select';

const { compareLegalTexts } = useApi();

const selectedTheme = ref<string | null>(null);
const selectedCountry1 = ref<string | null>(null);
const selectedCountry2 = ref<string | null>(null);
const loading = ref(false);
const results = ref<Record<string, any[]>>({});

const hasResults = computed(() => Object.keys(results.value).length > 0);

const themeOptions = [
  { label: 'Constitution', value: 'constitution' },
  { label: 'Droit administratif', value: 'droit-administratif' },
  { label: 'Droit constitutionnel', value: 'droit-constitutionnel' },
  { label: 'Droit pénal', value: 'droit-penal' },
  { label: 'Procédure pénale', value: 'procedure-penale' },
  { label: 'Droit fiscal', value: 'droit-fiscal' },
  { label: 'Droit douanier', value: 'droit-douanier' },
  { label: 'Droit électoral', value: 'droit-electoral' },
  { label: 'Marchés publics', value: 'marches-publics' },
  { label: 'Droit foncier', value: 'droit-foncier' },
  { label: 'Droit des affaires', value: 'droit-affaires-ohada' },
  { label: 'Droit des sociétés', value: 'droit-societes' },
  { label: 'Droit bancaire', value: 'droit-bancaire' },
  { label: 'Droit des assurances', value: 'droit-assurances' },
  { label: 'Droit de la concurrence', value: 'droit-concurrence' },
  { label: 'Commerce international', value: 'commerce-international' },
  { label: 'Droit des contrats', value: 'droit-contrats' },
  { label: 'Propriété intellectuelle', value: 'propriete-intellectuelle' },
  { label: 'Microfinance & UMOA', value: 'microfinance-umoa' },
  { label: 'Droit du travail', value: 'droit-travail' },
  { label: 'Sécurité sociale', value: 'securite-sociale' },
  { label: 'Droit de la famille', value: 'droit-famille' },
  { label: 'Droit des personnes', value: 'droit-personnes' },
  { label: 'Santé publique', value: 'sante-publique' },
  { label: 'Éducation', value: 'education' },
  { label: 'Logement & Urbanisme', value: 'logement-urbanisme' },
  { label: 'Numérique & Télécoms', value: 'numerique-telecoms' },
  { label: 'Protection des données', value: 'donnees-personnelles' },
  { label: 'Cybersécurité', value: 'cybersecurite' },
  { label: 'Commerce électronique', value: 'commerce-electronique' },
  { label: 'Environnement', value: 'environnement' },
  { label: 'Énergie électrique', value: 'energie-electrique' },
  { label: 'Énergie renouvelable', value: 'energie-renouvelable' },
  { label: 'Gestion des déchets', value: 'gestion-dechets' },
  { label: 'Ressources en eau', value: 'ressources-eau' },
  { label: 'Biodiversité', value: 'biodiversite' },
  { label: 'Mines & Ressources', value: 'mines-ressources' },
  { label: 'Agriculture', value: 'agriculture' },
  { label: 'Élevage', value: 'elevage' },
  { label: 'Pêche', value: 'peche' },
  { label: 'Transport & Aviation', value: 'transport' },
  { label: 'Industrie', value: 'industrie' },
];

const countryOptions = [
  { label: '🇧🇯 Bénin', value: 'BJ', flag: '🇧🇯', name: 'Bénin' },
  { label: '🇧🇫 Burkina Faso', value: 'BF', flag: '🇧🇫', name: 'Burkina Faso' },
  { label: '🇨🇮 Côte d\'Ivoire', value: 'CI', flag: '🇨🇮', name: 'Côte d\'Ivoire' },
  { label: '🇬🇳 Guinée', value: 'GN', flag: '🇬🇳', name: 'Guinée' },
  { label: '🇲🇱 Mali', value: 'ML', flag: '🇲🇱', name: 'Mali' },
  { label: '🇲🇷 Mauritanie', value: 'MR', flag: '🇲🇷', name: 'Mauritanie' },
  { label: '🇳🇪 Niger', value: 'NE', flag: '🇳🇪', name: 'Niger' },
  { label: '🇸🇳 Sénégal', value: 'SN', flag: '🇸🇳', name: 'Sénégal' },
  { label: '🇹🇬 Togo', value: 'TG', flag: '🇹🇬', name: 'Togo' },
  { label: '🇧🇮 Burundi', value: 'BI', flag: '🇧🇮', name: 'Burundi' },
  { label: '🇨🇲 Cameroun', value: 'CM', flag: '🇨🇲', name: 'Cameroun' },
  { label: '🇨🇫 Centrafrique', value: 'CF', flag: '🇨🇫', name: 'Centrafrique' },
  { label: '🇨🇬 Congo', value: 'CG', flag: '🇨🇬', name: 'Congo' },
  { label: '🇨🇩 RDC', value: 'CD', flag: '🇨🇩', name: 'RDC' },
  { label: '🇬🇦 Gabon', value: 'GA', flag: '🇬🇦', name: 'Gabon' },
  { label: '🇬🇶 Guinée Équatoriale', value: 'GQ', flag: '🇬🇶', name: 'Guinée Équatoriale' },
  { label: '🇹🇩 Tchad', value: 'TD', flag: '🇹🇩', name: 'Tchad' },
  { label: '🇩🇯 Djibouti', value: 'DJ', flag: '🇩🇯', name: 'Djibouti' },
  { label: '🇷🇼 Rwanda', value: 'RW', flag: '🇷🇼', name: 'Rwanda' },
  { label: '🇰🇲 Comores', value: 'KM', flag: '🇰🇲', name: 'Comores' },
  { label: '🇲🇬 Madagascar', value: 'MG', flag: '🇲🇬', name: 'Madagascar' },
  { label: '🇸🇨 Seychelles', value: 'SC', flag: '🇸🇨', name: 'Seychelles' },
  { label: '🇹🇳 Tunisie', value: 'TN', flag: '🇹🇳', name: 'Tunisie' },
  { label: '🇭🇹 Haïti', value: 'HT', flag: '🇭🇹', name: 'Haïti' },
  { label: '🇲🇨 Monaco', value: 'MC', flag: '🇲🇨', name: 'Monaco' },
  { label: '🇻🇺 Vanuatu', value: 'VU', flag: '🇻🇺', name: 'Vanuatu' },
];

const getCountryFlag = (code: string | null) => {
  if (!code) return '';
  return countryOptions.find(c => c.value === code)?.flag || '';
};

const getCountryName = (code: string | null) => {
  if (!code) return '';
  return countryOptions.find(c => c.value === code)?.name || code;
};

const formatDate = (date: string | null) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const mockResults: Record<string, any[]> = {};

const runComparison = async () => {
  if (!selectedTheme.value || !selectedCountry1.value || !selectedCountry2.value) return;

  loading.value = true;
  results.value = {};

  try {
    const data = await compareLegalTexts(
      selectedTheme.value,
      [selectedCountry1.value, selectedCountry2.value],
    );
    results.value = data;
  } catch {
    // Fall back to mock data
    const c1 = selectedCountry1.value;
    const c2 = selectedCountry2.value;
    results.value = {
      [c1]: mockResults[c1] || [],
      [c2]: mockResults[c2] || [],
    };
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.comparer-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--juris-gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-header h1 {
  font-size: var(--font-3xl);
  font-weight: 800;
  line-height: 1.1;
}

.header-subtitle {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
  margin-top: 4px;
}

/* Comparer content */
.comparer-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Selection bar */
.selection-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  padding: 20px 24px;
}

.selection-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 180px;
}

.selection-action {
  flex: 0 0 auto;
  min-width: auto;
  justify-content: flex-end;
}

.field-label {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-select {
  width: 100%;
}

.btn-compare {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  background: var(--juris-gradient-primary);
  color: white;
  font-size: var(--font-sm);
  font-weight: 600;
  font-family: var(--font-family);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-compare:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-compare:not(:disabled):hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Comparison columns */
.comparison-columns {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: start;
}

.columns-divider {
  width: 1px;
  background: var(--juris-border);
  align-self: stretch;
  margin: 0 24px;
}

.comparison-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--juris-primary-100);
}

.country-flag {
  font-size: 1.75rem;
  line-height: 1;
}

.country-name {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--juris-text);
  flex: 1;
}

.results-badge {
  font-size: var(--font-xs);
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  border: 1px solid var(--juris-primary-100);
}

.column-texts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
  color: var(--juris-text-muted);
  border: 1px dashed var(--juris-border);
  border-radius: var(--radius-lg);
}

.column-empty p {
  font-size: var(--font-sm);
}

/* Card extensions */
.card-summary {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  line-height: 1.5;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
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

.empty-icon {
  color: var(--juris-text-muted);
}

/* Initial state */
.initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 24px;
  text-align: center;
}

.initial-state h3 {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--juris-text);
}

.initial-state p {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  max-width: 480px;
}

/* Preview (for PremiumGate blur slot) */
.comparer-preview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-bar {
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  align-items: flex-end;
}

.preview-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.preview-label {
  height: 12px;
  width: 60%;
  border-radius: 4px;
  background: var(--juris-border);
}

.preview-select {
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--juris-border-light);
  border: 1px solid var(--juris-border);
}

.preview-btn {
  width: 100px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--juris-primary-100);
}

.preview-columns {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
}

.preview-divider {
  width: 1px;
  background: var(--juris-border);
  margin: 0 24px;
}

.preview-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-col-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--juris-border);
}

.preview-flag {
  width: 32px;
  height: 24px;
  border-radius: 4px;
  background: var(--juris-border);
}

.preview-col-title {
  height: 20px;
  flex: 1;
  border-radius: 4px;
  background: var(--juris-border);
}

.preview-card {
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--juris-surface);
  border: 1px solid var(--juris-border-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-card-title {
  height: 16px;
  width: 90%;
  border-radius: 4px;
  background: var(--juris-border);
}

.preview-card-meta {
  height: 12px;
  width: 60%;
  border-radius: 4px;
  background: var(--juris-border-light);
}

.preview-card-body {
  height: 10px;
  width: 100%;
  border-radius: 4px;
  background: var(--juris-border-light);
}

/* Responsive */
@media (max-width: 768px) {
  .comparison-columns {
    grid-template-columns: 1fr;
  }

  .columns-divider {
    width: 100%;
    height: 1px;
    margin: 16px 0;
  }

  .selection-bar {
    flex-direction: column;
  }

  .selection-field {
    min-width: 100%;
  }

  .preview-columns {
    grid-template-columns: 1fr;
  }

  .preview-divider {
    width: 100%;
    height: 1px;
    margin: 12px 0;
  }

  .preview-bar {
    flex-direction: column;
  }
}
</style>
