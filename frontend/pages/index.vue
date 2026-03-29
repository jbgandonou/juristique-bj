<template>
  <div class="home-page">
    <!-- Hero Search -->
    <section class="search-hero fade-in-up">
      <h1>Droit Africain Francophone</h1>
      <p>Tous les textes juridiques de 26 pays, classés par thème</p>

      <div class="search-input-wrapper">
        <Search :size="20" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un texte juridique, une loi, un décret..."
          @keyup.enter="goToSearch"
        />
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <FileText :size="16" />
          <span class="stat-value">500+</span> textes
        </div>
        <div class="stat-item">
          <Globe :size="16" />
          <span class="stat-value">26</span> pays
        </div>
        <div class="stat-item">
          <BookOpen :size="16" />
          <span class="stat-value">42</span> thèmes
        </div>
        <div class="stat-item">
          <ShieldCheck :size="16" />
          <span>Vérifié par des juristes</span>
        </div>
      </div>
    </section>

    <!-- Quick Themes -->
    <section class="section fade-in-up stagger-2">
      <div class="section-header">
        <h2>Thèmes populaires</h2>
        <NuxtLink to="/themes" class="see-all">
          Voir les 42 thèmes
          <ChevronRight :size="16" />
        </NuxtLink>
      </div>

      <div class="themes-grid">
        <NuxtLink
          v-for="theme in popularThemes"
          :key="theme.slug"
          :to="`/themes/${theme.slug}`"
          class="theme-card card-hover"
        >
          <div class="theme-icon">
            <component :is="theme.icon" :size="24" />
          </div>
          <span class="theme-name">{{ theme.name }}</span>
          <span class="theme-count">{{ theme.count }} textes</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Recent Texts -->
    <section class="section fade-in-up stagger-4">
      <div class="section-header">
        <h2>Derniers textes publiés</h2>
        <NuxtLink to="/recherche" class="see-all">
          Voir tout
          <ChevronRight :size="16" />
        </NuxtLink>
      </div>

      <div class="texts-list">
        <div
          v-for="text in recentTexts"
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
              <MapPin :size="14" />
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
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Search, Globe, BookOpen, FileText, ShieldCheck,
  ChevronRight, MapPin, Calendar, Scale,
  ScrollText, Briefcase, Bolt, Wifi, Leaf, Landmark, Gavel, Cpu,
} from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const loading = ref(true);

const goToSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/recherche', query: { q: searchQuery.value } });
  }
};

// Icon map for themes from API (keyed by slug)
const iconMap: Record<string, any> = {
  'constitution': ScrollText,
  'droit-affaires-ohada': Briefcase,
  'energie-electrique': Bolt,
  'numerique-telecoms': Wifi,
  'environnement': Leaf,
  'droit-bancaire': Landmark,
  'droit-penal': Gavel,
  'cybersecurite': Cpu,
};

// Mock data — kept as fallback if API is not available
const popularThemes = ref([
  { name: 'Constitution', slug: 'constitution', icon: ScrollText, count: 26 },
  { name: 'Droit des affaires', slug: 'droit-affaires-ohada', icon: Briefcase, count: 45 },
  { name: 'Énergie électrique', slug: 'energie-electrique', icon: Bolt, count: 38 },
  { name: 'Numérique', slug: 'numerique-telecoms', icon: Wifi, count: 52 },
  { name: 'Environnement', slug: 'environnement', icon: Leaf, count: 67 },
  { name: 'Droit bancaire', slug: 'droit-bancaire', icon: Landmark, count: 31 },
  { name: 'Droit pénal', slug: 'droit-penal', icon: Gavel, count: 28 },
  { name: 'Cybersécurité', slug: 'cybersecurite', icon: Cpu, count: 19 },
]);

const recentTexts = ref([
  {
    id: '1',
    title: 'Loi n°2024-15 portant Code du numérique en République du Bénin',
    country: 'Bénin',
    date: '15 mars 2024',
    type: 'Loi',
    isInForce: true,
    themes: ['Numérique', 'Données personnelles'],
  },
  {
    id: '2',
    title: "Acte uniforme révisé relatif au droit commercial général (AUDCG)",
    country: 'OHADA (17 pays)',
    date: '15 déc. 2010',
    type: 'Acte uniforme',
    isInForce: true,
    themes: ['Droit des affaires'],
  },
  {
    id: '3',
    title: "Loi n°2023-08 relative à l'énergie électrique au Togo",
    country: 'Togo',
    date: '22 juin 2023',
    type: 'Loi',
    isInForce: true,
    themes: ['Énergie électrique', 'Énergie renouvelable'],
  },
  {
    id: '4',
    title: 'Constitution de la République du Sénégal',
    country: 'Sénégal',
    date: '22 jan. 2001',
    type: 'Constitution',
    isInForce: true,
    themes: ['Constitution'],
  },
]);

const { getThemes, getLegalTexts } = useApi();

onMounted(async () => {
  try {
    const [themesRes, textsRes] = await Promise.all([
      getThemes(1, 8),
      getLegalTexts({ page: '1', limit: '4', status: 'published' }),
    ]);

    if (themesRes.data?.length) {
      popularThemes.value = themesRes.data.map(t => ({
        name: t.name,
        slug: t.slug,
        icon: iconMap[t.slug] || FileText,
        count: t.textCount,
      }));
    }

    if (textsRes.data?.length) {
      recentTexts.value = textsRes.data.map(t => ({
        id: t.id,
        title: t.title,
        country: t.country?.name || '',
        date: t.promulgationDate
          ? new Date(t.promulgationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        type: t.textType,
        isInForce: t.isInForce,
        themes: t.themes?.map(th => th.name) || [],
      }));
    }
  } catch (e) {
    console.log('API not available, using mock data');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--juris-text);
}

.see-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--juris-primary-light);
}

.see-all:hover {
  color: var(--juris-primary);
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.texts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 768px) {
  .themes-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
