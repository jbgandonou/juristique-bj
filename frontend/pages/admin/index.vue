<template>
  <div class="admin-dashboard">
    <!-- Page Header -->
    <div class="page-header fade-in-up">
      <div>
        <h2 class="page-title">Tableau de bord</h2>
        <p class="page-subtitle">Vue d'ensemble de la plateforme Jus Africa</p>
      </div>
      <div class="page-header-actions">
        <span class="last-update">Mis à jour à 14:32</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid fade-in-up stagger-1">
      <div
        v-for="(stat, i) in stats"
        :key="stat.label"
        class="stat-card glass-card card-hover"
        :style="{ animationDelay: `${i * 0.06}s` }"
      >
        <div class="stat-icon-wrapper" :style="{ background: stat.iconBg }">
          <component :is="stat.icon" :size="22" :style="{ color: stat.iconColor }" />
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
        <div class="stat-trend" :class="stat.trendUp ? 'trend-up' : 'trend-down'">
          <TrendingUp v-if="stat.trendUp" :size="14" />
          <TrendingDown v-else :size="14" />
          <span>{{ stat.trend }}</span>
        </div>
      </div>
    </div>

    <!-- Chart + Recent Activity -->
    <div class="dashboard-grid fade-in-up stagger-2">
      <!-- Chart Placeholder -->
      <div class="chart-card glass-card">
        <div class="card-header-block">
          <h3 class="card-section-title">Textes ajoutés par mois</h3>
          <div class="chart-legend">
            <span class="legend-dot" style="background: var(--juris-primary-light);"></span>
            <span class="legend-label">2025–2026</span>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div
              v-for="(bar, i) in chartBars"
              :key="i"
              class="chart-bar-col"
            >
              <div
                class="chart-bar"
                :style="{ height: bar.pct + '%', background: bar.highlight ? 'var(--juris-gradient-primary)' : 'rgba(57, 73, 171, 0.25)' }"
              ></div>
              <span class="chart-bar-label">{{ bar.month }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats-card glass-card">
        <h3 class="card-section-title">Aperçu rapide</h3>
        <div class="quick-stats-list">
          <div v-for="qs in quickStats" :key="qs.label" class="quick-stat-row">
            <div class="quick-stat-left">
              <span class="quick-stat-dot" :style="{ background: qs.color }"></span>
              <span class="quick-stat-label">{{ qs.label }}</span>
            </div>
            <div class="quick-stat-right">
              <span class="quick-stat-value">{{ qs.value }}</span>
              <div class="quick-stat-bar">
                <div class="quick-stat-fill" :style="{ width: qs.pct + '%', background: qs.color }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Pipeline Activity -->
    <div class="activity-card glass-card fade-in-up stagger-3">
      <div class="card-header-block">
        <h3 class="card-section-title">Activité récente du pipeline</h3>
        <NuxtLink to="/admin/pipeline" class="view-all-link">
          Voir tout
          <ChevronRight :size="14" />
        </NuxtLink>
      </div>

      <DataTable
        :value="recentActivity"
        :row-hover="true"
        size="small"
        class="juris-table"
      >
        <Column field="source" header="Source">
          <template #body="{ data }">
            <span class="source-name">{{ data.source }}</span>
          </template>
        </Column>
        <Column field="textes" header="Textes collectés">
          <template #body="{ data }">
            <span class="count-badge">{{ data.textes }}</span>
          </template>
        </Column>
        <Column field="status" header="Statut">
          <template #body="{ data }">
            <Tag
              :value="statusLabel(data.status)"
              :severity="statusSeverity(data.status)"
              rounded
            />
          </template>
        </Column>
        <Column field="date" header="Date" />
        <Column header="Actions">
          <template #body="{ data }">
            <div class="table-actions">
              <Button
                icon="pi pi-eye"
                size="small"
                text
                rounded
                class="action-btn-view"
                v-tooltip="'Voir détails'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  FileText, Clock, Users, Globe,
  TrendingUp, TrendingDown, ChevronRight,
} from 'lucide-vue-next';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { getLegalTexts, getPipelineJobs, getPipelineSources, getUserStats } = useApi();

const loading = ref(true);

const stats = ref([
  {
    label: 'Textes publiés',
    value: '523',
    icon: FileText,
    trend: '+12%',
    trendUp: true,
    iconBg: 'rgba(26,35,126,0.08)',
    iconColor: 'var(--juris-primary)',
  },
  {
    label: 'En attente de review',
    value: '47',
    icon: Clock,
    trend: '+5 aujourd\'hui',
    trendUp: true,
    iconBg: 'rgba(249,168,37,0.1)',
    iconColor: 'var(--juris-warning)',
  },
  {
    label: 'Utilisateurs',
    value: '1 204',
    icon: Users,
    trend: '+8%',
    trendUp: true,
    iconBg: 'rgba(0,137,123,0.08)',
    iconColor: 'var(--juris-accent)',
  },
  {
    label: 'Sources actives',
    value: '8',
    icon: Globe,
    trend: '-1 ce mois',
    trendUp: false,
    iconBg: 'rgba(198,148,42,0.1)',
    iconColor: 'var(--juris-secondary)',
  },
]);

const chartBars = [
  { month: 'Sep', pct: 38, highlight: false },
  { month: 'Oct', pct: 52, highlight: false },
  { month: 'Nov', pct: 45, highlight: false },
  { month: 'Déc', pct: 30, highlight: false },
  { month: 'Jan', pct: 60, highlight: false },
  { month: 'Fév', pct: 72, highlight: false },
  { month: 'Mar', pct: 88, highlight: true },
];

const quickStats = [
  { label: 'Bénin', value: '134', pct: 78, color: 'var(--juris-primary-light)' },
  { label: 'OHADA', value: '112', pct: 65, color: 'var(--juris-accent)' },
  { label: 'Sénégal', value: '98', pct: 57, color: 'var(--juris-secondary)' },
  { label: 'Togo', value: '76', pct: 44, color: '#7986CB' },
  { label: 'Côte d\'Ivoire', value: '63', pct: 37, color: 'var(--juris-primary-lighter)' },
];

const recentActivity = ref([
  { source: 'FAOLEX', textes: 23, status: 'completed', date: '28 mars 2026' },
  { source: 'OHADA', textes: 8, status: 'completed', date: '27 mars 2026' },
  { source: 'JO Bénin', textes: 5, status: 'failed', date: '27 mars 2026' },
  { source: 'Primature SN', textes: 12, status: 'running', date: '29 mars 2026' },
  { source: 'Assemblée CI', textes: 0, status: 'queued', date: '29 mars 2026' },
]);

onMounted(async () => {
  try {
    const [publishedRes, pendingRes, jobsRes, sourcesRes, userStatsRes] = await Promise.all([
      getLegalTexts({ status: 'published', limit: '1' }),
      getLegalTexts({ status: 'pending_review', limit: '1' }),
      getPipelineJobs(1, 5),
      getPipelineSources(),
      getUserStats(),
    ]);
    // Update stats with real data
    stats.value[0].value = publishedRes.total.toLocaleString();
    stats.value[1].value = pendingRes.total.toLocaleString();
    stats.value[2].value = (userStatsRes.total ?? userStatsRes.count ?? 0).toLocaleString();
    stats.value[3].value = sourcesRes.length.toString();
    // Update activity table with real jobs
    if (jobsRes.data?.length) {
      recentActivity.value = jobsRes.data.map((job: any) => ({
        source: job.source ?? job.sourceName ?? '—',
        textes: job.textsCount ?? job.textes ?? 0,
        status: job.status ?? 'queued',
        date: job.startedAt
          ? new Date(job.startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          : job.date ?? '—',
      }));
    }
  } catch (e) {
    console.log('Admin API not available, using mock data');
  } finally {
    loading.value = false;
  }
});

const statusLabel = (s: string) => ({
  completed: 'Terminé',
  failed: 'Échec',
  running: 'En cours',
  queued: 'En attente',
}[s] ?? s);

const statusSeverity = (s: string) => ({
  completed: 'success',
  failed: 'danger',
  running: 'info',
  queued: 'warn',
}[s] ?? 'secondary');
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
}

.page-subtitle {
  font-size: var(--font-sm);
  color: var(--juris-text-muted);
  margin-top: 4px;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-update {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  background: var(--juris-border-light);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
}

.stat-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-xs);
  color: var(--juris-text-secondary);
  font-weight: 500;
}

.stat-trend {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-xs);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.trend-up {
  background: rgba(46, 125, 50, 0.1);
  color: var(--juris-success);
}

.trend-down {
  background: rgba(198, 40, 40, 0.08);
  color: var(--juris-danger);
}

/* Dashboard grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
}

.chart-card,
.quick-stats-card {
  padding: 20px;
}

.card-header-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}

.card-section-title {
  font-size: var(--font-base);
  font-weight: 700;
  color: var(--juris-text);
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-label {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

/* Chart */
.chart-placeholder {
  height: 180px;
  display: flex;
  align-items: flex-end;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding-bottom: 24px;
  position: relative;
}

.chart-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 6px;
}

.chart-bar {
  width: 100%;
  border-radius: 6px 6px 0 0;
  min-height: 6px;
  transition: all 0.3s ease;
}

.chart-bar-label {
  font-size: 10px;
  color: var(--juris-text-muted);
  white-space: nowrap;
}

/* Quick Stats */
.quick-stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quick-stat-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 110px;
}

.quick-stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.quick-stat-label {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
}

.quick-stat-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.quick-stat-value {
  font-size: var(--font-sm);
  font-weight: 700;
  color: var(--juris-text);
  min-width: 32px;
  text-align: right;
}

.quick-stat-bar {
  flex: 1;
  height: 6px;
  background: var(--juris-border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.quick-stat-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

/* Activity Table */
.activity-card {
  padding: 20px;
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-sm);
  color: var(--juris-primary-light);
  text-decoration: none;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: var(--juris-primary);
}

.source-name {
  font-weight: 600;
  font-size: var(--font-sm);
  color: var(--juris-text);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  font-size: var(--font-xs);
  font-weight: 700;
  border-radius: var(--radius-full);
  padding: 0 8px;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn-view {
  color: var(--juris-primary-light) !important;
}

/* Responsive */
@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 16px;
  }
}
</style>
