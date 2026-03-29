<template>
  <div class="pays-page">
    <!-- Page Header -->
    <header class="page-header fade-in-up">
      <div class="header-content">
        <div class="header-icon">
          <Globe :size="32" />
        </div>
        <div>
          <h1 class="gradient-text">Pays</h1>
          <p class="header-subtitle">26 pays africains francophones — droit et textes juridiques</p>
        </div>
      </div>

      <!-- Search -->
      <div class="pays-search">
        <Search :size="18" class="search-icon-sm" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un pays..."
          class="pays-search-input"
        />
      </div>
    </header>

    <!-- Stats -->
    <div class="stats-row glass-card fade-in-up stagger-1">
      <div class="stat-block">
        <span class="stat-num gradient-text">26</span>
        <span class="stat-lbl">pays</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-block">
        <span class="stat-num gradient-text">500+</span>
        <span class="stat-lbl">textes juridiques</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-block">
        <span class="stat-num gradient-text">4</span>
        <span class="stat-lbl">régions</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-block">
        <span class="stat-num gradient-text">42</span>
        <span class="stat-lbl">thèmes</span>
      </div>
    </div>

    <!-- Regions -->
    <div v-if="filteredByRegion.length === 0" class="empty-state glass-card fade-in-up">
      <Globe :size="40" class="empty-icon" />
      <p>Aucun pays trouvé pour "<strong>{{ searchQuery }}</strong>"</p>
    </div>

    <section
      v-for="region in filteredByRegion"
      :key="region.name"
      class="region-section fade-in-up stagger-2"
    >
      <div class="region-header">
        <h2 class="region-title">{{ region.name }}</h2>
        <span class="region-count">{{ region.countries.length }} pays</span>
      </div>

      <div class="countries-grid">
        <NuxtLink
          v-for="(country, index) in region.countries"
          :key="country.slug"
          :to="`/pays/${country.slug}`"
          :class="['country-card', 'card-hover', `stagger-${Math.min(index + 1, 8)}`]"
        >
          <div class="country-flag-emoji">{{ country.flag }}</div>
          <div class="country-info">
            <h3 class="country-name">{{ country.name }}</h3>
            <p class="country-region">{{ region.name }}</p>
          </div>
          <div class="country-stats">
            <span class="text-count">
              <FileText :size="13" />
              {{ country.textCount }} textes
            </span>
          </div>
          <ChevronRight :size="16" class="country-arrow" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Globe, Search, FileText, ChevronRight } from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';

const searchQuery = ref('');
const loading = ref(true);
const { getCountries } = useApi();

const mockRegions = [
  {
    name: 'Afrique de l\'Ouest',
    countries: [
      { name: 'Bénin', slug: 'benin', flag: '🇧🇯', textCount: 78 },
      { name: 'Burkina Faso', slug: 'burkina-faso', flag: '🇧🇫', textCount: 54 },
      { name: 'Côte d\'Ivoire', slug: 'cote-divoire', flag: '🇨🇮', textCount: 92 },
      { name: 'Guinée', slug: 'guinee', flag: '🇬🇳', textCount: 37 },
      { name: 'Mali', slug: 'mali', flag: '🇲🇱', textCount: 61 },
      { name: 'Mauritanie', slug: 'mauritanie', flag: '🇲🇷', textCount: 29 },
      { name: 'Niger', slug: 'niger', flag: '🇳🇪', textCount: 42 },
      { name: 'Sénégal', slug: 'senegal', flag: '🇸🇳', textCount: 105 },
      { name: 'Togo', slug: 'togo', flag: '🇹🇬', textCount: 48 },
    ],
  },
  {
    name: 'Afrique Centrale',
    countries: [
      { name: 'Burundi', slug: 'burundi', flag: '🇧🇮', textCount: 23 },
      { name: 'Cameroun', slug: 'cameroun', flag: '🇨🇲', textCount: 87 },
      { name: 'Centrafrique', slug: 'centrafrique', flag: '🇨🇫', textCount: 18 },
      { name: 'Congo', slug: 'congo', flag: '🇨🇬', textCount: 31 },
      { name: 'RDC', slug: 'rdc', flag: '🇨🇩', textCount: 64 },
      { name: 'Gabon', slug: 'gabon', flag: '🇬🇦', textCount: 55 },
      { name: 'Guinée Équatoriale', slug: 'guinee-equatoriale', flag: '🇬🇶', textCount: 14 },
      { name: 'Tchad', slug: 'tchad', flag: '🇹🇩', textCount: 27 },
    ],
  },
  {
    name: 'Afrique de l\'Est',
    countries: [
      { name: 'Djibouti', slug: 'djibouti', flag: '🇩🇯', textCount: 16 },
      { name: 'Rwanda', slug: 'rwanda', flag: '🇷🇼', textCount: 33 },
    ],
  },
  {
    name: 'Océan Indien',
    countries: [
      { name: 'Comores', slug: 'comores', flag: '🇰🇲', textCount: 12 },
      { name: 'Madagascar', slug: 'madagascar', flag: '🇲🇬', textCount: 44 },
      { name: 'Seychelles', slug: 'seychelles', flag: '🇸🇨', textCount: 19 },
    ],
  },
  {
    name: 'Afrique du Nord',
    countries: [
      { name: 'Tunisie', slug: 'tunisie', flag: '🇹🇳', textCount: 71 },
    ],
  },
  {
    name: 'Autres',
    countries: [
      { name: 'Haïti', slug: 'haiti', flag: '🇭🇹', textCount: 38 },
      { name: 'Monaco', slug: 'monaco', flag: '🇲🇨', textCount: 9 },
      { name: 'Vanuatu', slug: 'vanuatu', flag: '🇻🇺', textCount: 7 },
    ],
  },
];

const regions = ref(mockRegions);

onMounted(async () => {
  try {
    const res = await getCountries(1, 100);
    if (res.data?.length) {
      // Group API countries by region
      const regionMap: Record<string, typeof mockRegions[0]['countries']> = {};
      for (const c of res.data) {
        const regionName = c.region || 'Autres';
        if (!regionMap[regionName]) regionMap[regionName] = [];
        regionMap[regionName].push({
          name: c.name,
          slug: c.code.toLowerCase(),
          flag: '',
          textCount: 0,
        });
      }
      const apiRegions = Object.entries(regionMap).map(([name, countries]) => ({ name, countries }));
      if (apiRegions.length > 0) {
        regions.value = apiRegions;
      }
    }
  } catch (e) {
    console.log('API not available, using mock country data');
  } finally {
    loading.value = false;
  }
});

const filteredByRegion = computed(() => {
  if (!searchQuery.value.trim()) return regions.value;

  const q = searchQuery.value.toLowerCase();
  return regions.value
    .map(region => ({
      ...region,
      countries: region.countries.filter(c => c.name.toLowerCase().includes(q)),
    }))
    .filter(region => region.countries.length > 0);
});
</script>

<style scoped>
.pays-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
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

.pays-search {
  position: relative;
  min-width: 260px;
}

.search-icon-sm {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--juris-text-muted);
  pointer-events: none;
}

.pays-search-input {
  width: 100%;
  padding: 10px 16px 10px 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--juris-border);
  background: var(--juris-surface);
  font-size: var(--font-sm);
  color: var(--juris-text);
  outline: none;
  transition: all 0.2s ease;
}

.pays-search-input:focus {
  border-color: var(--juris-primary-lighter);
  box-shadow: 0 0 0 3px var(--juris-primary-100);
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
  padding: 0 32px;
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

/* Region Section */
.region-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.region-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.region-title {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--juris-text);
}

.region-count {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-muted);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--juris-border-light);
  border: 1px solid var(--juris-border);
}

/* Countries Grid */
.countries-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.country-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--juris-surface);
  border: 1px solid var(--juris-border-light);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.country-card:hover {
  border-color: var(--juris-primary-lighter);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.country-flag-emoji {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.country-info {
  flex: 1;
  min-width: 0;
}

.country-name {
  font-size: var(--font-sm);
  font-weight: 700;
  color: var(--juris-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.country-region {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.country-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.text-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  font-weight: 500;
}

.country-arrow {
  color: var(--juris-text-muted);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.country-card:hover .country-arrow {
  opacity: 1;
  color: var(--juris-primary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  color: var(--juris-text-muted);
}

.empty-state p {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
}

/* Responsive */
@media (max-width: 1024px) {
  .countries-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .countries-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .pays-search {
    width: 100%;
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
}

@media (max-width: 480px) {
  .countries-grid {
    grid-template-columns: 1fr;
  }

  .country-card {
    padding: 12px;
  }
}
</style>
