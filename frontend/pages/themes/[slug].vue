<template>
  <div class="theme-detail-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb fade-in-up">
      <NuxtLink to="/themes" class="breadcrumb-link">
        <ChevronLeft :size="16" />
        Thèmes
      </NuxtLink>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">{{ theme.name }}</span>
    </nav>

    <!-- Page Header -->
    <header class="page-header glass-card fade-in-up stagger-1">
      <div class="header-main">
        <div class="theme-icon-lg">
          <component :is="theme.icon" :size="36" />
        </div>
        <div class="header-info">
          <h1 class="gradient-text">{{ theme.name }}</h1>
          <p class="header-description">{{ theme.description }}</p>
        </div>
        <div class="header-badge">
          <span class="text-count-badge">
            <FileText :size="15" />
            {{ theme.textCount }} textes
          </span>
        </div>
      </div>
    </header>

    <!-- Stats Row -->
    <div class="stats-row glass-card fade-in-up stagger-2">
      <div class="stat-block">
        <span class="stat-num gradient-text">{{ theme.textCount }}</span>
        <span class="stat-lbl">textes juridiques</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-block">
        <span class="stat-num gradient-text">{{ countriesCovered }}</span>
        <span class="stat-lbl">pays couverts</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-block">
        <span class="stat-num gradient-text">{{ typeBreakdown.lois }}</span>
        <span class="stat-lbl">lois</span>
      </div>
      <div class="stat-divider" />
      <div class="stat-block">
        <span class="stat-num gradient-text">{{ typeBreakdown.decrets }}</span>
        <span class="stat-lbl">décrets & arrêtés</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar glass-card fade-in-up stagger-3">
      <div class="filter-group">
        <label class="filter-label">Pays</label>
        <Select
          v-model="selectedCountry"
          :options="countryOptions"
          option-label="label"
          option-value="value"
          placeholder="Tous les pays"
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
          <span v-if="text.isVerified" class="meta-item verified-item">
            <ShieldCheck :size="14" />
            Vérifié
          </span>
        </div>

        <div class="card-themes">
          <span
            v-for="tag in text.themes"
            :key="tag"
            class="p-tag p-tag-rounded"
            style="font-size: 0.7rem;"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronLeft, MapPin, Scale, Calendar, FileText,
  ShieldCheck, FileX, X,
  ScrollText, Briefcase, Bolt, Wifi, Leaf, Landmark, Gavel, Cpu,
  Scale as ScaleIcon, Building2, Users, Home, Truck, Heart, Banknote, Globe,
  TreePine, Fish, Wheat, Beef, Droplets, Mountain,
  Factory, Receipt, GraduationCap, Baby, Stethoscope, Plane,
  Phone, Sun, ShieldCheck as ShieldIcon,
} from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import Select from 'primevue/select';

const route = useRoute();
const slug = route.params.slug as string;

interface ThemeData {
  name: string;
  description: string;
  icon: any;
  textCount: number;
}

const themeMap: Record<string, ThemeData> = {
  // Droit public
  'constitution': { name: 'Constitution', description: 'Textes fondamentaux organisant les institutions et les droits fondamentaux', icon: ScrollText, textCount: 0 },
  'droit-administratif': { name: 'Droit administratif', description: "Organisation et fonctionnement de l'administration publique", icon: Building2, textCount: 0 },
  'droit-constitutionnel': { name: 'Droit constitutionnel', description: "Normes régissant l'organisation et l'exercice du pouvoir politique", icon: Scale, textCount: 0 },
  'droit-penal': { name: 'Droit pénal', description: "Infractions, sanctions et protection de l'ordre social", icon: Gavel, textCount: 0 },
  'procedure-penale': { name: 'Procédure pénale', description: 'Règles gouvernant les poursuites judiciaires en matière pénale', icon: Scale, textCount: 0 },
  'droit-fiscal': { name: 'Droit fiscal', description: 'Règles régissant les impôts, taxes et contributions', icon: Receipt, textCount: 0 },
  'droit-douanier': { name: 'Droit douanier', description: 'Réglementation des importations, exportations et droits de douane', icon: Truck, textCount: 0 },
  'droit-electoral': { name: 'Droit électoral', description: 'Règles organisant les élections et la participation citoyenne', icon: Users, textCount: 0 },
  'marches-publics': { name: 'Marchés publics', description: 'Passation et exécution des contrats publics de fournitures et services', icon: Briefcase, textCount: 0 },
  'droit-foncier': { name: 'Droit foncier', description: "Régimes de propriété et d'exploitation des terres", icon: Home, textCount: 0 },

  // Droit des affaires
  'droit-affaires-ohada': { name: 'Droit des affaires', description: 'Textes OHADA et règlements relatifs au commerce et aux entreprises', icon: Briefcase, textCount: 0 },
  'droit-societes': { name: 'Droit des sociétés', description: 'Constitution, fonctionnement et dissolution des sociétés commerciales', icon: Building2, textCount: 0 },
  'droit-bancaire': { name: 'Droit bancaire', description: 'Régulation des établissements de crédit et des opérations bancaires', icon: Landmark, textCount: 0 },
  'droit-assurances': { name: 'Droit des assurances', description: 'Contrats, entreprises et réglementation du secteur assurantiel', icon: ShieldIcon, textCount: 0 },
  'droit-concurrence': { name: 'Droit de la concurrence', description: 'Pratiques anticoncurrentielles, abus de position et ententes', icon: Scale, textCount: 0 },
  'commerce-international': { name: 'Commerce international', description: 'Règles régissant les échanges commerciaux transfrontaliers', icon: Globe, textCount: 0 },
  'droit-contrats': { name: 'Droit des contrats', description: 'Formation, exécution et résiliation des obligations contractuelles', icon: ScrollText, textCount: 0 },
  'propriete-intellectuelle': { name: 'Propriété intellectuelle', description: "Protection des créations de l'esprit, marques et brevets", icon: ShieldIcon, textCount: 0 },
  'microfinance-umoa': { name: 'Microfinance & UMOA', description: 'Institutions de microfinance et réglementation monétaire UEMOA', icon: Banknote, textCount: 0 },

  // Droit social
  'droit-travail': { name: 'Droit du travail', description: "Relations d'emploi, contrats de travail et conditions de travail", icon: Users, textCount: 0 },
  'securite-sociale': { name: 'Sécurité sociale', description: 'Régimes de prévoyance, retraite et couverture sociale', icon: Heart, textCount: 0 },
  'droit-famille': { name: 'Droit de la famille', description: 'Mariage, filiation, adoption et statut personnel', icon: Baby, textCount: 0 },
  'droit-personnes': { name: 'Droit des personnes', description: 'Capacité juridique, état civil et droits individuels', icon: Users, textCount: 0 },
  'sante-publique': { name: 'Santé publique', description: 'Organisation du système de santé et politiques sanitaires', icon: Stethoscope, textCount: 0 },
  'education': { name: 'Éducation', description: "Système éducatif, établissements d'enseignement et politiques scolaires", icon: GraduationCap, textCount: 0 },
  'logement-urbanisme': { name: 'Logement & Urbanisme', description: "Règles relatives à la construction, au logement et à l'aménagement urbain", icon: Home, textCount: 0 },

  // Numérique & Tech
  'numerique-telecoms': { name: 'Numérique & Télécoms', description: 'Régulation des communications électroniques et du secteur numérique', icon: Wifi, textCount: 0 },
  'donnees-personnelles': { name: 'Protection des données', description: 'Collecte, traitement et protection des données à caractère personnel', icon: ShieldIcon, textCount: 0 },
  'cybersecurite': { name: 'Cybersécurité', description: 'Sécurité des systèmes informatiques et lutte contre la cybercriminalité', icon: Cpu, textCount: 0 },
  'commerce-electronique': { name: 'Commerce électronique', description: 'Transactions en ligne, paiements mobiles et contrats électroniques', icon: Phone, textCount: 0 },

  // Environnement
  'environnement': { name: 'Environnement', description: "Protection de l'environnement, évaluation environnementale et normes", icon: Leaf, textCount: 0 },
  'energie-electrique': { name: 'Énergie électrique', description: "Production, transport et distribution de l'électricité", icon: Bolt, textCount: 0 },
  'energie-renouvelable': { name: 'Énergie renouvelable', description: 'Développement et promotion des énergies solaire, éolienne et hydraulique', icon: Sun, textCount: 0 },
  'gestion-dechets': { name: 'Gestion des déchets', description: 'Collecte, traitement et valorisation des déchets', icon: TreePine, textCount: 0 },
  'ressources-eau': { name: 'Ressources en eau', description: 'Gestion, accès et protection des ressources hydriques', icon: Droplets, textCount: 0 },
  'biodiversite': { name: 'Biodiversité', description: 'Conservation des écosystèmes, faune et flore', icon: TreePine, textCount: 0 },
  'mines-ressources': { name: 'Mines & Ressources', description: 'Extraction, exploitation et fiscalité des ressources minières', icon: Mountain, textCount: 0 },

  // Secteurs
  'agriculture': { name: 'Agriculture', description: 'Production agricole, foncier rural et politiques agro-alimentaires', icon: Wheat, textCount: 0 },
  'elevage': { name: 'Élevage', description: 'Santé animale, production et commerce du bétail', icon: Beef, textCount: 0 },
  'peche': { name: 'Pêche', description: 'Ressources halieutiques, pêche artisanale et aquaculture', icon: Fish, textCount: 0 },
  'transport': { name: 'Transport & Aviation', description: 'Règles applicables aux transports terrestres, aériens et maritimes', icon: Plane, textCount: 0 },
  'industrie': { name: 'Industrie', description: 'Règlementation industrielle, normes et politiques de développement', icon: Factory, textCount: 0 },
};

const theme: ThemeData = themeMap[slug] ?? {
  name: slug,
  description: 'Thème juridique',
  icon: ScrollText,
  textCount: 0,
};

const countriesCovered = 0;
const typeBreakdown = { lois: 0, decrets: 0 };

// Legal texts — populated from API
const mockTexts: any[] = [];

// Filters
const selectedCountry = ref<string | null>(null);
const selectedType = ref<string | null>(null);
const selectedStatus = ref<string | null>(null);

const countryOptions = [
  { label: 'Tous les pays', value: null },
  { label: 'Bénin', value: 'BJ' },
  { label: 'Sénégal', value: 'SN' },
  { label: "Côte d'Ivoire", value: 'CI' },
  { label: 'Togo', value: 'TG' },
  { label: 'Cameroun', value: 'CM' },
  { label: 'OHADA (17 pays)', value: 'OHADA' },
];

const typeOptions = [
  { label: 'Tous les types', value: null },
  { label: 'Constitution', value: 'Constitution' },
  { label: 'Loi', value: 'Loi' },
  { label: 'Décret', value: 'Décret' },
  { label: 'Ordonnance', value: 'Ordonnance' },
  { label: 'Acte uniforme', value: 'Acte uniforme' },
  { label: 'Arrêté', value: 'Arrêté' },
];

const statusOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'En vigueur', value: 'in-force' },
  { label: 'Abrogé', value: 'abrogated' },
];

const hasActiveFilters = computed(
  () => selectedCountry.value !== null || selectedType.value !== null || selectedStatus.value !== null,
);

const filteredTexts = computed(() => {
  let results = mockTexts;

  if (selectedCountry.value) {
    results = results.filter(t => t.countryCode === selectedCountry.value);
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
  selectedCountry.value = null;
  selectedType.value = null;
  selectedStatus.value = null;
};
</script>

<style scoped>
.theme-detail-page {
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
  flex-wrap: wrap;
}

.theme-icon-lg {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xl);
  background: var(--juris-gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-info h1 {
  font-size: var(--font-3xl);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 8px;
}

.header-description {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
  line-height: 1.5;
  max-width: 560px;
}

.header-badge {
  flex-shrink: 0;
}

.text-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-sm);
  font-weight: 700;
  color: var(--juris-primary);
  background: var(--juris-primary-50);
  border: 1px solid var(--juris-primary-100);
  padding: 8px 16px;
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

/* Card meta override */
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

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    padding: 20px;
  }

  .header-main {
    gap: 16px;
  }

  .theme-icon-lg {
    width: 56px;
    height: 56px;
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

  .header-badge {
    display: none;
  }
}

@media (max-width: 480px) {
  .theme-icon-lg {
    width: 48px;
    height: 48px;
  }
}
</style>
