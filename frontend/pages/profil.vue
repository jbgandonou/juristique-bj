<template>
  <div class="profil-page">

    <!-- Profile Header -->
    <header class="profile-header glass-card fade-in-up">
      <div class="header-left">
        <div class="avatar-circle">
          <span class="avatar-initials">{{ userInitials }}</span>
        </div>
        <div class="user-info">
          <h1 class="user-name">{{ user.name }}</h1>
          <p class="user-profession">{{ user.profession }}</p>
          <div class="user-meta">
            <span class="meta-chip">
              <MapPin :size="13" />
              {{ user.country }}
            </span>
            <span class="meta-chip">
              <Calendar :size="13" />
              Membre depuis {{ user.memberSince }}
            </span>
          </div>
        </div>
      </div>
      <button class="btn-edit hover-lift">
        <Edit :size="16" />
        Modifier le profil
      </button>
    </header>

    <!-- Tabs Navigation -->
    <div class="tabs-nav glass-card fade-in-up stagger-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" :size="17" />
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- TAB: Mes favoris -->
    <div v-if="activeTab === 'favoris'" class="tab-content fade-in-up stagger-2">
      <div v-if="bookmarks.length === 0" class="empty-state glass-card">
        <Bookmark :size="40" class="empty-icon" />
        <p>Vous n'avez pas encore de textes en favori.</p>
        <NuxtLink to="/recherche" class="btn-primary">Parcourir les textes</NuxtLink>
      </div>
      <div v-else class="texts-grid">
        <div
          v-for="item in bookmarks"
          :key="item.id"
          class="legal-text-card card-hover bookmark-card"
        >
          <div class="card-header">
            <NuxtLink :to="`/textes/${item.id}`" class="card-title">
              {{ item.title }}
            </NuxtLink>
            <div class="card-actions">
              <span :class="['status-badge', item.isInForce ? 'in-force' : 'abrogated']">
                {{ item.isInForce ? 'En vigueur' : 'Abrogé' }}
              </span>
              <button class="icon-btn danger" title="Retirer des favoris" @click="removeBookmark(item.id)">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <div class="card-meta">
            <span class="meta-item">
              <MapPin :size="14" />
              {{ item.country }}
            </span>
            <span class="meta-item">
              <Calendar :size="14" />
              {{ item.date }}
            </span>
            <span class="meta-item">
              <Scale :size="14" />
              {{ item.type }}
            </span>
          </div>

          <div class="card-themes">
            <span
              v-for="theme in item.themes"
              :key="theme"
              class="p-tag p-tag-rounded"
              style="font-size: 0.7rem;"
            >{{ theme }}</span>
          </div>

          <div v-if="item.note" class="bookmark-note">
            <MessageSquare :size="13" />
            <span>{{ item.note }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Mes commentaires -->
    <div v-if="activeTab === 'commentaires'" class="tab-content fade-in-up stagger-2">
      <div v-if="comments.length === 0" class="empty-state glass-card">
        <MessageSquare :size="40" class="empty-icon" />
        <p>Vous n'avez pas encore publié de commentaire.</p>
      </div>
      <div v-else class="comments-list">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-card glass-card card-hover"
        >
          <div class="comment-header">
            <div class="comment-text-ref">
              <FileText :size="15" />
              <NuxtLink :to="`/textes/${comment.textId}`" class="comment-text-link">
                {{ comment.textTitle }}
              </NuxtLink>
            </div>
            <span class="comment-date">{{ comment.date }}</span>
          </div>
          <p class="comment-body">{{ comment.content }}</p>
          <div class="comment-footer">
            <span class="comment-type-badge">{{ comment.type }}</span>
            <button class="icon-btn danger" title="Supprimer">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Mes alertes -->
    <div v-if="activeTab === 'alertes'" class="tab-content fade-in-up stagger-2">
      <div class="alerts-toolbar">
        <p class="alerts-info">{{ activeAlertsCount }} alerte{{ activeAlertsCount !== 1 ? 's' : '' }} active{{ activeAlertsCount !== 1 ? 's' : '' }}</p>
        <button class="btn-primary" @click="showCreateAlert = !showCreateAlert">
          <Plus :size="16" />
          Créer une alerte
        </button>
      </div>

      <!-- Create Alert Form (simple inline) -->
      <div v-if="showCreateAlert" class="create-alert-form glass-card fade-in-up">
        <h3 class="form-section-title">Nouvelle alerte</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Thème</label>
            <input v-model="newAlert.theme" type="text" class="form-input" placeholder="ex: Énergie électrique" />
          </div>
          <div class="form-group">
            <label class="form-label">Pays</label>
            <input v-model="newAlert.country" type="text" class="form-input" placeholder="ex: Bénin" />
          </div>
          <div class="form-group">
            <label class="form-label">Fréquence</label>
            <select v-model="newAlert.frequency" class="form-input">
              <option value="Quotidien">Quotidien</option>
              <option value="Hebdomadaire">Hebdomadaire</option>
              <option value="Mensuel">Mensuel</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" @click="showCreateAlert = false">Annuler</button>
          <button class="btn-primary" @click="createAlert">Créer l'alerte</button>
        </div>
      </div>

      <div v-if="alerts.length === 0" class="empty-state glass-card">
        <Bell :size="40" class="empty-icon" />
        <p>Vous n'avez pas encore créé d'alerte.</p>
      </div>
      <div v-else class="alerts-list">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="alert-card glass-card"
          :class="{ inactive: !alert.active }"
        >
          <div class="alert-left">
            <div class="alert-icon" :class="{ muted: !alert.active }">
              <Bell :size="18" />
            </div>
            <div class="alert-info">
              <p class="alert-title">{{ alert.theme }}</p>
              <div class="alert-meta">
                <span v-if="alert.country" class="alert-country">
                  <MapPin :size="12" />
                  {{ alert.country }}
                </span>
                <span class="alert-freq">{{ alert.frequency }}</span>
              </div>
            </div>
          </div>
          <div class="alert-right">
            <button class="toggle-btn" :title="alert.active ? 'Désactiver' : 'Activer'" @click="toggleAlert(alert.id)">
              <ToggleRight v-if="alert.active" :size="28" class="toggle-on" />
              <ToggleLeft v-else :size="28" class="toggle-off" />
            </button>
            <button class="icon-btn danger" title="Supprimer l'alerte" @click="removeAlert(alert.id)">
              <Trash2 :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Paramètres -->
    <div v-if="activeTab === 'parametres'" class="tab-content fade-in-up stagger-2">
      <div class="settings-layout">

        <!-- Profile Form -->
        <section class="settings-section glass-card">
          <div class="section-header-row">
            <div class="section-icon">
              <User :size="20" />
            </div>
            <div>
              <h2 class="section-title">Informations personnelles</h2>
              <p class="section-subtitle">Modifiez vos informations de profil</p>
            </div>
          </div>

          <form class="settings-form" @submit.prevent="saveProfile">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom complet</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="Votre nom" />
              </div>
              <div class="form-group">
                <label class="form-label">Adresse e-mail</label>
                <input v-model="form.email" type="email" class="form-input" placeholder="email@exemple.com" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Profession</label>
                <select v-model="form.profession" class="form-input">
                  <option value="">Sélectionner une profession</option>
                  <option value="Avocat">Avocat</option>
                  <option value="Magistrat">Magistrat</option>
                  <option value="Notaire">Notaire</option>
                  <option value="Juriste d'entreprise">Juriste d'entreprise</option>
                  <option value="Étudiant en droit">Étudiant en droit</option>
                  <option value="Chercheur">Chercheur</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Pays</label>
                <select v-model="form.country" class="form-input">
                  <option value="">Sélectionner un pays</option>
                  <option value="Bénin">Bénin</option>
                  <option value="Sénégal">Sénégal</option>
                  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                  <option value="Togo">Togo</option>
                  <option value="Cameroun">Cameroun</option>
                  <option value="Mali">Mali</option>
                  <option value="Burkina Faso">Burkina Faso</option>
                  <option value="Niger">Niger</option>
                  <option value="Guinée">Guinée</option>
                  <option value="Congo">Congo</option>
                  <option value="RDC">RDC</option>
                  <option value="Gabon">Gabon</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Numéro de barreau <span class="optional">(optionnel)</span></label>
                <input v-model="form.barNumber" type="text" class="form-input" placeholder="ex: BJ-AVT-2019-0042" />
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Enregistrer les modifications</button>
            </div>
          </form>
        </section>

        <!-- Subscription Section -->
        <section class="settings-section glass-card">
          <div class="section-header-row">
            <div class="section-icon gold">
              <Crown :size="20" />
            </div>
            <div>
              <h2 class="section-title">Abonnement</h2>
              <p class="section-subtitle">Votre plan actuel et options de mise à niveau</p>
            </div>
          </div>

          <div class="plan-card">
            <div class="plan-info">
              <div class="plan-badge">
                <span class="plan-name">Plan Gratuit</span>
              </div>
              <ul class="plan-features">
                <li class="plan-feature enabled">
                  <span class="feature-dot enabled" />
                  Accès à tous les textes publics
                </li>
                <li class="plan-feature enabled">
                  <span class="feature-dot enabled" />
                  5 favoris
                </li>
                <li class="plan-feature enabled">
                  <span class="feature-dot enabled" />
                  2 alertes
                </li>
                <li class="plan-feature disabled">
                  <span class="feature-dot disabled" />
                  Téléchargement PDF
                </li>
                <li class="plan-feature disabled">
                  <span class="feature-dot disabled" />
                  Historique complet des modifications
                </li>
                <li class="plan-feature disabled">
                  <span class="feature-dot disabled" />
                  Alertes illimitées
                </li>
              </ul>
            </div>
            <div class="upgrade-box">
              <p class="upgrade-label">Passez au plan Premium</p>
              <p class="upgrade-price"><strong>9 900 FCFA</strong> / mois</p>
              <button class="btn-gold hover-lift">
                <Crown :size="16" />
                Passer à Premium
              </button>
            </div>
          </div>
        </section>

        <!-- Security Section -->
        <section class="settings-section glass-card">
          <div class="section-header-row">
            <div class="section-icon danger">
              <Lock :size="20" />
            </div>
            <div>
              <h2 class="section-title">Sécurité</h2>
              <p class="section-subtitle">Modifier votre mot de passe</p>
            </div>
          </div>

          <form class="settings-form" @submit.prevent="changePassword">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mot de passe actuel</label>
                <input v-model="security.currentPassword" type="password" class="form-input" placeholder="••••••••" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nouveau mot de passe</label>
                <input v-model="security.newPassword" type="password" class="form-input" placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirmer le nouveau mot de passe</label>
                <input v-model="security.confirmPassword" type="password" class="form-input" placeholder="••••••••" />
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Modifier le mot de passe</button>
            </div>
          </form>
        </section>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import {
  User, Bookmark, MessageSquare, Bell, Settings, Crown, Lock,
  Plus, Trash2, ToggleLeft, ToggleRight, MapPin, Calendar, Scale,
  FileText, Edit,
} from 'lucide-vue-next';
import { ref, computed } from 'vue';

// ── User data ────────────────────────────────────────────────────
const user = ref({
  name: 'Madeleine Ahouansou',
  profession: 'Avocate au Barreau du Bénin',
  country: 'Bénin',
  memberSince: 'janvier 2024',
});

const userInitials = computed(() => {
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

// ── Tabs ────────────────────────────────────────────────────────
const activeTab = ref('favoris');

const tabs = [
  { key: 'favoris', label: 'Mes favoris', icon: Bookmark, count: 3 },
  { key: 'commentaires', label: 'Mes commentaires', icon: MessageSquare, count: 3 },
  { key: 'alertes', label: 'Mes alertes', icon: Bell, count: 3 },
  { key: 'parametres', label: 'Paramètres', icon: Settings },
];

// ── Bookmarks ───────────────────────────────────────────────────
const bookmarks = ref([
  {
    id: '1',
    title: 'Loi n°2024-15 portant Code du numérique en République du Bénin',
    country: 'Bénin',
    date: '15 mars 2024',
    type: 'Loi',
    isInForce: true,
    themes: ['Numérique', 'Données personnelles'],
    note: 'À analyser pour le dossier client Tech-Innov SA.',
  },
  {
    id: '2',
    title: 'Acte uniforme révisé relatif au droit commercial général (AUDCG)',
    country: 'OHADA (17 pays)',
    date: '15 déc. 2010',
    type: 'Acte uniforme',
    isInForce: true,
    themes: ['Droit des affaires'],
    note: 'Référence pour les clauses contractuelles OHADA.',
  },
  {
    id: '3',
    title: 'Loi n°2023-08 relative à l\'énergie électrique au Togo',
    country: 'Togo',
    date: '22 juin 2023',
    type: 'Loi',
    isInForce: true,
    themes: ['Énergie électrique', 'Énergie renouvelable'],
    note: null,
  },
]);

const removeBookmark = (id: string) => {
  const idx = bookmarks.value.findIndex(b => b.id === id);
  if (idx !== -1) bookmarks.value.splice(idx, 1);
};

// ── Comments ────────────────────────────────────────────────────
const comments = ref([
  {
    id: 'c1',
    textId: '1',
    textTitle: 'Loi n°2024-15 portant Code du numérique en République du Bénin',
    content: 'L\'article 43 sur la protection des données personnelles crée une obligation de notification en cas de violation, alignée sur le RGPD. Il conviendra d\'adapter les politiques internes en conséquence.',
    date: '18 mars 2024',
    type: 'Analyse',
  },
  {
    id: 'c2',
    textId: '2',
    textTitle: 'Acte uniforme révisé relatif au droit commercial général (AUDCG)',
    content: 'La révision de 2010 a introduit le statut de l\'entreprenant, particulièrement pertinent pour les micro-entreprises. Les formalités simplifiées facilitent grandement la formalisation des activités informelles.',
    date: '05 fév. 2024',
    type: 'Commentaire',
  },
  {
    id: 'c3',
    textId: '4',
    textTitle: 'Constitution de la République du Sénégal',
    content: 'Le préambule de la Constitution de 2001 affirme l\'attachement au principe de laïcité tout en reconnaissant la primauté des droits fondamentaux. Une tension intéressante à explorer dans le contexte régional.',
    date: '12 jan. 2024',
    type: 'Note',
  },
]);

// ── Alerts ──────────────────────────────────────────────────────
const showCreateAlert = ref(false);
const newAlert = ref({ theme: '', country: '', frequency: 'Hebdomadaire' });

const alerts = ref([
  { id: 'a1', theme: 'Énergie électrique', country: 'Bénin', frequency: 'Quotidien', active: true },
  { id: 'a2', theme: 'Numérique & Télécoms', country: '', frequency: 'Hebdomadaire', active: true },
  { id: 'a3', theme: 'Droit des affaires (OHADA)', country: '', frequency: 'Mensuel', active: false },
]);

const activeAlertsCount = computed(() => alerts.value.filter(a => a.active).length);

const toggleAlert = (id: string) => {
  const alert = alerts.value.find(a => a.id === id);
  if (alert) alert.active = !alert.active;
};

const removeAlert = (id: string) => {
  const idx = alerts.value.findIndex(a => a.id === id);
  if (idx !== -1) alerts.value.splice(idx, 1);
};

const createAlert = () => {
  if (!newAlert.value.theme.trim()) return;
  alerts.value.push({
    id: `a${Date.now()}`,
    theme: newAlert.value.theme,
    country: newAlert.value.country,
    frequency: newAlert.value.frequency,
    active: true,
  });
  newAlert.value = { theme: '', country: '', frequency: 'Hebdomadaire' };
  showCreateAlert.value = false;
};

// ── Settings Form ───────────────────────────────────────────────
const form = ref({
  name: 'Madeleine Ahouansou',
  email: 'madeleine.ahouansou@cabinet-legal.bj',
  profession: 'Avocat',
  country: 'Bénin',
  barNumber: 'BJ-AVT-2019-0127',
});

const security = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const saveProfile = () => {
  user.value.name = form.value.name;
  user.value.profession = form.value.profession;
  user.value.country = form.value.country;
};

const changePassword = () => {
  security.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
};
</script>

<style scoped>
.profil-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Profile Header ─────────────────────────────────── */
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--juris-gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-glow-primary);
}

.avatar-initials {
  font-size: var(--font-xl);
  font-weight: 700;
  color: white;
  letter-spacing: 0.05em;
}

.user-name {
  font-size: var(--font-2xl);
  font-weight: 800;
  color: var(--juris-text);
  margin-bottom: 4px;
}

.user-profession {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  margin-bottom: 10px;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  background: var(--juris-border-light);
  border: 1px solid var(--juris-border);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid var(--juris-primary-lighter);
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  font-size: var(--font-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-edit:hover {
  background: var(--juris-primary);
  color: white;
  border-color: var(--juris-primary);
}

/* ── Tabs ───────────────────────────────────────────── */
.tabs-nav {
  display: flex;
  gap: 4px;
  padding: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--juris-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--juris-primary-50);
  color: var(--juris-primary);
}

.tab-btn.active {
  background: var(--juris-primary);
  color: white;
  font-weight: 600;
}

.tab-count {
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

.tab-btn:not(.active) .tab-count {
  background: var(--juris-border);
  color: var(--juris-text-muted);
}

/* ── Tab Content ────────────────────────────────────── */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Bookmarks Grid ─────────────────────────────────── */
.texts-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bookmark-card .card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.bookmark-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--juris-primary-50);
  color: var(--juris-text-secondary);
  font-size: var(--font-xs);
  line-height: 1.5;
}

/* ── Comments ───────────────────────────────────────── */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.comment-card {
  padding: 20px 24px;
}

.comment-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-text-ref {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--juris-text-secondary);
  font-size: var(--font-xs);
  font-weight: 500;
  flex: 1;
}

.comment-text-link {
  color: var(--juris-primary-light);
  font-weight: 600;
  font-size: var(--font-sm);
  line-height: 1.4;
}

.comment-text-link:hover {
  color: var(--juris-primary);
}

.comment-date {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.comment-body {
  font-size: var(--font-sm);
  color: var(--juris-text);
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comment-type-badge {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: 600;
  background: var(--juris-primary-100);
  color: var(--juris-primary);
}

/* ── Alerts ─────────────────────────────────────────── */
.alerts-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.alerts-info {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  font-weight: 500;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  transition: all 0.2s ease;
}

.alert-card.inactive {
  opacity: 0.55;
}

.alert-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.alert-icon.muted {
  background: var(--juris-border-light);
  color: var(--juris-text-muted);
}

.alert-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-text);
  margin-bottom: 4px;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

.alert-country {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.alert-freq {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--juris-border-light);
  font-weight: 600;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.alert-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.toggle-btn:hover {
  transform: scale(1.1);
}

.toggle-on {
  color: var(--juris-accent);
}

.toggle-off {
  color: var(--juris-text-muted);
}

/* Create alert form */
.create-alert-form {
  padding: 24px;
}

/* ── Settings Layout ────────────────────────────────── */
.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  padding: 28px 32px;
}

.section-header-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.section-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-icon.gold {
  background: rgba(198, 148, 42, 0.1);
  color: var(--juris-secondary);
}

.section-icon.danger {
  background: rgba(198, 40, 40, 0.06);
  color: var(--juris-danger);
}

.section-title {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 2px;
}

.section-subtitle {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

/* ── Forms ──────────────────────────────────────────── */
.settings-form,
.create-alert-form .form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--juris-text-muted);
}

.form-input {
  width: 100%;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid var(--juris-border);
  background: var(--juris-surface);
  font-size: var(--font-sm);
  color: var(--juris-text);
  font-family: var(--font-family);
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: var(--juris-primary-lighter);
  box-shadow: 0 0 0 3px var(--juris-primary-100);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

/* ── Plan Card ──────────────────────────────────────── */
.plan-card {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.plan-info {
  flex: 1;
  min-width: 240px;
}

.plan-badge {
  margin-bottom: 16px;
}

.plan-name {
  display: inline-flex;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
  font-weight: 700;
  background: var(--juris-border-light);
  color: var(--juris-text-secondary);
  border: 1px solid var(--juris-border);
}

.plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-sm);
}

.plan-feature.disabled {
  color: var(--juris-text-muted);
}

.feature-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.feature-dot.enabled {
  background: var(--juris-success);
}

.feature-dot.disabled {
  background: var(--juris-border);
}

.upgrade-box {
  background: linear-gradient(135deg, rgba(198, 148, 42, 0.08), rgba(198, 148, 42, 0.04));
  border: 1px solid rgba(198, 148, 42, 0.25);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  text-align: center;
  min-width: 200px;
}

.upgrade-label {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-text);
  margin-bottom: 6px;
}

.upgrade-price {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
  margin-bottom: 16px;
}

.upgrade-price strong {
  font-size: var(--font-xl);
  color: var(--juris-secondary);
}

/* ── Buttons ────────────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: var(--juris-gradient-primary);
  color: white;
  font-size: var(--font-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  color: white;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid var(--juris-border);
  background: transparent;
  color: var(--juris-text-secondary);
  font-size: var(--font-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--juris-primary-lighter);
  color: var(--juris-primary);
}

.btn-gold {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: var(--juris-gradient-gold);
  color: white;
  font-size: var(--font-sm);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-gold:hover {
  box-shadow: var(--shadow-glow-gold);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--juris-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn.danger:hover {
  background: rgba(198, 40, 40, 0.08);
  color: var(--juris-danger);
}

/* ── Empty State ────────────────────────────────────── */
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

/* ── Form section title ─────────────────────────────── */
.form-section-title {
  font-size: var(--font-base);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 16px;
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 768px) {
  .profile-header {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
  }

  .tabs-nav {
    gap: 2px;
    padding: 6px;
  }

  .tab-btn {
    padding: 8px 12px;
    font-size: var(--font-xs);
    gap: 6px;
  }

  .settings-section {
    padding: 20px;
  }

  .plan-card {
    flex-direction: column;
  }

  .upgrade-box {
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .avatar-circle {
    width: 56px;
    height: 56px;
  }

  .user-name {
    font-size: var(--font-xl);
  }

  .tab-btn span:not(.tab-count) {
    display: none;
  }
}
</style>
