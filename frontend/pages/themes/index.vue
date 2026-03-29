<template>
  <div class="themes-page">
    <!-- Page Header -->
    <header class="page-header fade-in-up">
      <div class="header-content">
        <div class="header-icon">
          <BookOpen :size="32" />
        </div>
        <div>
          <h1 class="gradient-text">Thèmes juridiques</h1>
          <p class="header-subtitle">42 domaines du droit africain francophone</p>
        </div>
      </div>

      <!-- Search -->
      <div class="themes-search">
        <Search :size="18" class="search-icon-sm" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un thème..."
          class="themes-search-input"
        />
      </div>
    </header>

    <!-- Category Filter -->
    <div class="categories-bar glass-card fade-in-up stagger-1">
      <button
        v-for="cat in categories"
        :key="cat.value"
        :class="['cat-btn', { active: selectedCategory === cat.value }]"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
        <span class="cat-count">{{ cat.count }}</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="filteredThemes.length === 0" class="empty-state glass-card fade-in-up">
      <BookOpen :size="40" class="empty-icon" />
      <p>Aucun thème trouvé pour "<strong>{{ searchQuery }}</strong>"</p>
    </div>

    <!-- Themes Grid -->
    <div v-else class="themes-grid fade-in-up stagger-2">
      <NuxtLink
        v-for="(theme, index) in filteredThemes"
        :key="theme.slug"
        :to="`/themes/${theme.slug}`"
        :class="['theme-card', 'card-hover', `stagger-${Math.min(index + 1, 8)}`]"
      >
        <div class="theme-icon">
          <component :is="theme.icon" :size="24" />
        </div>
        <span class="theme-name">{{ theme.name }}</span>
        <span class="theme-count">{{ theme.count }} textes</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BookOpen, Search,
  ScrollText, Briefcase, Bolt, Wifi, Leaf, Landmark, Gavel, Cpu,
  Scale, ShieldCheck, Users, Home, Truck, Heart, Banknote, Globe,
  Building2, TreePine, Fish, Wheat, Beef, Droplets, Mountain,
  Factory, Receipt, GraduationCap, Baby, Stethoscope, Plane,
  Ship, Train, Radio, Phone, Camera, Wrench, FlaskConical,
  Zap, Sun, Wind,
} from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';

const searchQuery = ref('');
const selectedCategory = ref('tous');
const loading = ref(true);
const { getThemes } = useApi();

const categories = [
  { label: 'Tous', value: 'tous', count: 42 },
  { label: 'Droit public', value: 'public', count: 10 },
  { label: 'Droit des affaires', value: 'affaires', count: 9 },
  { label: 'Droit social', value: 'social', count: 7 },
  { label: 'Numérique & Tech', value: 'tech', count: 4 },
  { label: 'Environnement', value: 'environnement', count: 7 },
  { label: 'Secteurs', value: 'secteurs', count: 5 },
];

const iconMap: Record<string, any> = {
  'constitution': ScrollText, 'droit-administratif': Building2, 'droit-constitutionnel': Scale,
  'droit-penal': Gavel, 'procedure-penale': Scale, 'droit-fiscal': Receipt, 'droit-douanier': Truck,
  'droit-electoral': Users, 'marches-publics': Briefcase, 'droit-foncier': Home,
  'droit-affaires-ohada': Briefcase, 'droit-societes': Building2, 'droit-bancaire': Landmark,
  'droit-assurances': ShieldCheck, 'droit-concurrence': Scale, 'commerce-international': Globe,
  'droit-contrats': ScrollText, 'propriete-intellectuelle': ShieldCheck, 'microfinance-umoa': Banknote,
  'droit-travail': Users, 'securite-sociale': Heart, 'droit-famille': Baby, 'droit-personnes': Users,
  'sante-publique': Stethoscope, 'education': GraduationCap, 'logement-urbanisme': Home,
  'numerique-telecoms': Wifi, 'donnees-personnelles': ShieldCheck, 'cybersecurite': Cpu,
  'commerce-electronique': Phone, 'environnement': Leaf, 'energie-electrique': Bolt,
  'energie-renouvelable': Sun, 'gestion-dechets': TreePine, 'ressources-eau': Droplets,
  'biodiversite': TreePine, 'mines-ressources': Mountain, 'agriculture': Wheat, 'elevage': Beef,
  'peche': Fish, 'transport': Plane, 'industrie': Factory,
};

const mockThemes = [
  // Droit public
  { name: 'Constitution', slug: 'constitution', icon: ScrollText, count: 26, category: 'public' },
  { name: 'Droit administratif', slug: 'droit-administratif', icon: Building2, count: 43, category: 'public' },
  { name: 'Droit constitutionnel', slug: 'droit-constitutionnel', icon: Scale, count: 18, category: 'public' },
  { name: 'Droit pénal', slug: 'droit-penal', icon: Gavel, count: 28, category: 'public' },
  { name: 'Procédure pénale', slug: 'procedure-penale', icon: Scale, count: 21, category: 'public' },
  { name: 'Droit fiscal', slug: 'droit-fiscal', icon: Receipt, count: 57, category: 'public' },
  { name: 'Droit douanier', slug: 'droit-douanier', icon: Truck, count: 32, category: 'public' },
  { name: 'Droit électoral', slug: 'droit-electoral', icon: Users, count: 19, category: 'public' },
  { name: 'Marchés publics', slug: 'marches-publics', icon: Briefcase, count: 36, category: 'public' },
  { name: 'Droit foncier', slug: 'droit-foncier', icon: Home, count: 44, category: 'public' },

  // Droit des affaires
  { name: 'Droit des affaires', slug: 'droit-affaires-ohada', icon: Briefcase, count: 45, category: 'affaires' },
  { name: 'Droit des sociétés', slug: 'droit-societes', icon: Building2, count: 38, category: 'affaires' },
  { name: 'Droit bancaire', slug: 'droit-bancaire', icon: Landmark, count: 31, category: 'affaires' },
  { name: 'Droit des assurances', slug: 'droit-assurances', icon: ShieldCheck, count: 24, category: 'affaires' },
  { name: 'Droit de la concurrence', slug: 'droit-concurrence', icon: Scale, count: 17, category: 'affaires' },
  { name: 'Commerce international', slug: 'commerce-international', icon: Globe, count: 29, category: 'affaires' },
  { name: 'Droit des contrats', slug: 'droit-contrats', icon: ScrollText, count: 33, category: 'affaires' },
  { name: 'Propriété intellectuelle', slug: 'propriete-intellectuelle', icon: ShieldCheck, count: 22, category: 'affaires' },
  { name: 'Microfinance & UMOA', slug: 'microfinance-umoa', icon: Banknote, count: 16, category: 'affaires' },

  // Droit social
  { name: 'Droit du travail', slug: 'droit-travail', icon: Users, count: 62, category: 'social' },
  { name: 'Sécurité sociale', slug: 'securite-sociale', icon: Heart, count: 27, category: 'social' },
  { name: 'Droit de la famille', slug: 'droit-famille', icon: Baby, count: 19, category: 'social' },
  { name: 'Droit des personnes', slug: 'droit-personnes', icon: Users, count: 14, category: 'social' },
  { name: 'Santé publique', slug: 'sante-publique', icon: Stethoscope, count: 48, category: 'social' },
  { name: 'Éducation', slug: 'education', icon: GraduationCap, count: 35, category: 'social' },
  { name: 'Logement & Urbanisme', slug: 'logement-urbanisme', icon: Home, count: 26, category: 'social' },

  // Numérique & Tech
  { name: 'Numérique & Télécoms', slug: 'numerique-telecoms', icon: Wifi, count: 52, category: 'tech' },
  { name: 'Protection des données', slug: 'donnees-personnelles', icon: ShieldCheck, count: 34, category: 'tech' },
  { name: 'Cybersécurité', slug: 'cybersecurite', icon: Cpu, count: 19, category: 'tech' },
  { name: 'Commerce électronique', slug: 'commerce-electronique', icon: Phone, count: 23, category: 'tech' },

  // Environnement
  { name: 'Environnement', slug: 'environnement', icon: Leaf, count: 67, category: 'environnement' },
  { name: 'Énergie électrique', slug: 'energie-electrique', icon: Bolt, count: 38, category: 'environnement' },
  { name: 'Énergie renouvelable', slug: 'energie-renouvelable', icon: Sun, count: 21, category: 'environnement' },
  { name: 'Gestion des déchets', slug: 'gestion-dechets', icon: TreePine, count: 15, category: 'environnement' },
  { name: 'Ressources en eau', slug: 'ressources-eau', icon: Droplets, count: 29, category: 'environnement' },
  { name: 'Biodiversité', slug: 'biodiversite', icon: TreePine, count: 18, category: 'environnement' },
  { name: 'Mines & Ressources', slug: 'mines-ressources', icon: Mountain, count: 41, category: 'environnement' },

  // Secteurs
  { name: 'Agriculture', slug: 'agriculture', icon: Wheat, count: 53, category: 'secteurs' },
  { name: 'Élevage', slug: 'elevage', icon: Beef, count: 31, category: 'secteurs' },
  { name: 'Pêche', slug: 'peche', icon: Fish, count: 24, category: 'secteurs' },
  { name: 'Transport & Aviation', slug: 'transport', icon: Plane, count: 37, category: 'secteurs' },
  { name: 'Industrie', slug: 'industrie', icon: Factory, count: 28, category: 'secteurs' },
];

const allThemes = ref(mockThemes);

onMounted(async () => {
  try {
    const res = await getThemes(1, 100);
    if (res.data?.length) {
      allThemes.value = res.data.map(t => ({
        name: t.name,
        slug: t.slug,
        icon: iconMap[t.slug] || BookOpen,
        count: t.textCount,
        category: 'tous', // API doesn't have categories; keep filtering by name search only
      }));
    }
  } catch (e) {
    console.log('API not available, using mock theme data');
  } finally {
    loading.value = false;
  }
});

const filteredThemes = computed(() => {
  let results = allThemes.value;

  if (selectedCategory.value !== 'tous') {
    results = results.filter(t => t.category === selectedCategory.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    results = results.filter(t => t.name.toLowerCase().includes(q) || t.slug.includes(q));
  }

  return results;
});
</script>

<style scoped>
.themes-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Header */
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

.themes-search {
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

.themes-search-input {
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

.themes-search-input:focus {
  border-color: var(--juris-primary-lighter);
  box-shadow: 0 0 0 3px var(--juris-primary-100);
}

/* Categories Bar */
.categories-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 20px;
  align-items: center;
}

.cat-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--juris-border);
  background: transparent;
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--juris-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cat-btn:hover {
  border-color: var(--juris-primary-lighter);
  color: var(--juris-primary);
  background: var(--juris-primary-50);
}

.cat-btn.active {
  background: var(--juris-primary);
  border-color: var(--juris-primary);
  color: white;
}

.cat-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  font-size: 0.65rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
}

.cat-btn:not(.active) .cat-count {
  background: var(--juris-border-light);
  color: var(--juris-text-muted);
}

/* Themes Grid */
.themes-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
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
@media (max-width: 1280px) {
  .themes-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1024px) {
  .themes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .themes-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .themes-search {
    width: 100%;
  }

  .categories-bar {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .themes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
