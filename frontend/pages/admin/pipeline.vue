<template>
  <div class="pipeline-page">
    <!-- Page Header -->
    <div class="page-header fade-in-up">
      <div>
        <h2 class="page-title">Pipeline de collecte</h2>
        <p class="page-subtitle">Supervision des sources et des jobs de scraping</p>
      </div>
      <div class="page-header-actions">
        <button class="btn-run-all" @click="runAll">
          <Play :size="15" />
          Lancer tous les jobs
        </button>
      </div>
    </div>

    <!-- Source Status Cards -->
    <div class="sources-grid fade-in-up stagger-1">
      <div
        v-for="(src, i) in sources"
        :key="src.name"
        class="source-card glass-card card-hover"
        :style="{ animationDelay: `${i * 0.05}s` }"
      >
        <div class="source-card-top">
          <div class="source-icon-wrapper">
            <Globe :size="18" />
          </div>
          <div
            class="source-status-badge"
            :class="src.active ? 'status-active' : 'status-inactive'"
          >
            <span class="status-dot"></span>
            {{ src.active ? 'Actif' : 'Inactif' }}
          </div>
        </div>

        <div class="source-name">{{ src.name }}</div>

        <div class="source-meta">
          <div class="source-meta-row">
            <Clock :size="13" />
            <span>Dernier run : <strong>{{ src.lastRun }}</strong></span>
          </div>
          <div class="source-meta-row">
            <CheckCircle :size="13" />
            <span>Succès : <strong>{{ src.successRate }}</strong></span>
          </div>
          <div class="source-meta-row">
            <CalendarClock :size="13" />
            <span>Prochain run : <strong>{{ src.nextRun }}</strong></span>
          </div>
        </div>

        <div class="source-card-footer">
          <button class="source-action-btn" @click="triggerSource(src)">
            <RefreshCw :size="13" />
            Relancer
          </button>
          <button class="source-action-btn secondary">
            <Settings :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- Jobs Table -->
    <div class="jobs-card glass-card fade-in-up stagger-3">
      <div class="card-header-block">
        <h3 class="card-section-title">Jobs en cours & récents</h3>
        <div class="jobs-summary">
          <span v-for="s in jobSummary" :key="s.label" class="job-summary-pill" :class="s.cls">
            {{ s.value }} {{ s.label }}
          </span>
        </div>
      </div>

      <DataTable
        :value="jobs"
        :row-hover="true"
        size="small"
        class="juris-table"
        sort-field="started"
        :sort-order="-1"
      >
        <Column field="id" header="ID" style="min-width: 80px;">
          <template #body="{ data }">
            <span class="job-id">#{{ data.id }}</span>
          </template>
        </Column>

        <Column field="source" header="Source" style="min-width: 140px;">
          <template #body="{ data }">
            <span class="source-chip">{{ data.source }}</span>
          </template>
        </Column>

        <Column field="status" header="Statut" style="min-width: 160px;">
          <template #body="{ data }">
            <div class="job-status-wrapper">
              <span class="job-status-badge" :class="`job-${data.status}`">
                <component :is="statusIcon(data.status)" :size="12" />
                {{ statusLabel(data.status) }}
              </span>
              <div v-if="data.status === 'scraping' || data.status === 'extracting' || data.status === 'enriching'" class="job-progress-bar">
                <div class="job-progress-fill" :style="{ width: data.progress + '%' }"></div>
              </div>
            </div>
          </template>
        </Column>

        <Column field="started" header="Démarré" style="min-width: 140px;" />

        <Column field="duration" header="Durée" style="min-width: 100px;">
          <template #body="{ data }">
            <span class="duration-text">{{ data.duration ?? '—' }}</span>
          </template>
        </Column>

        <Column field="textes" header="Textes" style="min-width: 80px;">
          <template #body="{ data }">
            <span class="count-chip">{{ data.textes }}</span>
          </template>
        </Column>

        <Column header="Actions" style="min-width: 100px;">
          <template #body="{ data }">
            <div class="job-actions">
              <button class="action-btn view" title="Voir les logs">
                <Terminal :size="14" />
              </button>
              <button
                v-if="data.status === 'failed'"
                class="action-btn retry"
                title="Relancer"
                @click="retryJob(data)"
              >
                <RefreshCw :size="14" />
              </button>
              <button
                v-if="data.status === 'queued' || data.status === 'scraping'"
                class="action-btn cancel"
                title="Annuler"
              >
                <StopCircle :size="14" />
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Globe, Clock, CheckCircle, CalendarClock, RefreshCw, Settings,
  Play, Loader, AlertTriangle, CircleCheck, Circle, Zap, Terminal, StopCircle,
} from 'lucide-vue-next';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

definePageMeta({ layout: 'admin' });

const sources = ref([
  {
    name: 'FAOLEX',
    active: true,
    lastRun: '29 mars 2026, 10:14',
    successRate: '96%',
    nextRun: 'Dans 2h',
  },
  {
    name: 'OHADA',
    active: true,
    lastRun: '28 mars 2026, 18:00',
    successRate: '99%',
    nextRun: 'Demain 08:00',
  },
  {
    name: 'Primature SN',
    active: true,
    lastRun: '29 mars 2026, 08:30',
    successRate: '88%',
    nextRun: 'Dans 6h',
  },
  {
    name: 'République TG',
    active: false,
    lastRun: '21 mars 2026, 14:00',
    successRate: '72%',
    nextRun: 'Désactivé',
  },
  {
    name: 'Assemblée CI',
    active: true,
    lastRun: '29 mars 2026, 12:00',
    successRate: '91%',
    nextRun: 'Dans 4h',
  },
  {
    name: 'JO Bénin',
    active: true,
    lastRun: '27 mars 2026, 09:45',
    successRate: '83%',
    nextRun: 'Demain 06:00',
  },
]);

const jobs = ref([
  {
    id: 1042,
    source: 'FAOLEX',
    status: 'enriching',
    started: '29 mars 2026, 10:14',
    duration: '18m',
    textes: 23,
    progress: 74,
  },
  {
    id: 1041,
    source: 'Primature SN',
    status: 'scraping',
    started: '29 mars 2026, 08:30',
    duration: '42m',
    textes: 12,
    progress: 55,
  },
  {
    id: 1040,
    source: 'Assemblée CI',
    status: 'queued',
    started: '29 mars 2026, 12:00',
    duration: null,
    textes: 0,
    progress: 0,
  },
  {
    id: 1039,
    source: 'OHADA',
    status: 'completed',
    started: '28 mars 2026, 18:00',
    duration: '7m 22s',
    textes: 8,
    progress: 100,
  },
  {
    id: 1038,
    source: 'JO Bénin',
    status: 'failed',
    started: '27 mars 2026, 09:45',
    duration: '3m 10s',
    textes: 0,
    progress: 0,
  },
  {
    id: 1037,
    source: 'République TG',
    status: 'completed',
    started: '21 mars 2026, 14:00',
    duration: '12m 45s',
    textes: 6,
    progress: 100,
  },
]);

const jobSummary = computed(() => {
  const counts: Record<string, number> = {};
  jobs.value.forEach((j) => {
    counts[j.status] = (counts[j.status] || 0) + 1;
  });
  return [
    { label: 'en cours', value: (counts.scraping || 0) + (counts.extracting || 0) + (counts.enriching || 0), cls: 'pill-running' },
    { label: 'en attente', value: counts.queued || 0, cls: 'pill-queued' },
    { label: 'terminés', value: counts.completed || 0, cls: 'pill-done' },
    { label: 'échoués', value: counts.failed || 0, cls: 'pill-failed' },
  ];
});

const statusLabel = (s: string) => ({
  queued: 'En attente',
  scraping: 'Scraping',
  extracting: 'Extraction',
  enriching: 'Enrichissement',
  completed: 'Terminé',
  failed: 'Échec',
}[s] ?? s);

const statusIcon = (s: string) => ({
  queued: Circle,
  scraping: Loader,
  extracting: Loader,
  enriching: Zap,
  completed: CircleCheck,
  failed: AlertTriangle,
}[s] ?? Circle);

const runAll = () => {
  console.log('Running all jobs...');
};

const triggerSource = (src: any) => {
  console.log('Triggering', src.name);
};

const retryJob = (job: any) => {
  const idx = jobs.value.findIndex((j) => j.id === job.id);
  if (idx !== -1) jobs.value[idx].status = 'queued';
};
</script>

<style scoped>
.pipeline-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
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

.btn-run-all {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--juris-gradient-primary);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: var(--font-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-md);
}

.btn-run-all:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

/* Sources Grid */
.sources-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.source-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.source-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.source-icon-wrapper {
  width: 36px;
  height: 36px;
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.source-status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-xs);
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.status-active {
  background: rgba(46, 125, 50, 0.1);
  color: var(--juris-success);
}

.status-inactive {
  background: rgba(159, 166, 189, 0.15);
  color: var(--juris-text-muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.source-name {
  font-size: var(--font-base);
  font-weight: 700;
  color: var(--juris-text);
}

.source-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-meta-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--font-xs);
  color: var(--juris-text-secondary);
}

.source-meta-row strong {
  color: var(--juris-text);
  font-weight: 600;
}

.source-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid var(--juris-border-light);
}

.source-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-md);
  background: none;
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.source-action-btn:hover {
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  border-color: var(--juris-primary-lighter);
}

.source-action-btn.secondary {
  padding: 6px 8px;
}

/* Jobs Card */
.jobs-card {
  padding: 20px;
}

.card-header-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.card-section-title {
  font-size: var(--font-base);
  font-weight: 700;
  color: var(--juris-text);
}

.jobs-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.job-summary-pill {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: 600;
}

.pill-running { background: rgba(21, 101, 192, 0.1); color: var(--juris-info); }
.pill-queued { background: rgba(249, 168, 37, 0.1); color: var(--juris-warning); }
.pill-done { background: rgba(46, 125, 50, 0.1); color: var(--juris-success); }
.pill-failed { background: rgba(198, 40, 40, 0.08); color: var(--juris-danger); }

/* Job ID */
.job-id {
  font-size: var(--font-sm);
  font-weight: 700;
  color: var(--juris-text-muted);
  font-family: 'Courier New', monospace;
}

/* Source chip */
.source-chip {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(0, 137, 123, 0.08);
  color: var(--juris-accent);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: 600;
}

/* Job Status */
.job-status-wrapper {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 130px;
}

.job-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: 600;
  width: fit-content;
}

.job-queued { background: rgba(249, 168, 37, 0.1); color: var(--juris-warning); }
.job-scraping { background: rgba(21, 101, 192, 0.1); color: var(--juris-info); }
.job-extracting { background: rgba(57, 73, 171, 0.1); color: var(--juris-primary-light); }
.job-enriching { background: rgba(0, 137, 123, 0.1); color: var(--juris-accent); }
.job-completed { background: rgba(46, 125, 50, 0.1); color: var(--juris-success); }
.job-failed { background: rgba(198, 40, 40, 0.08); color: var(--juris-danger); }

.job-progress-bar {
  height: 4px;
  background: var(--juris-border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.job-progress-fill {
  height: 100%;
  background: var(--juris-gradient-accent);
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

/* Duration */
.duration-text {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  font-variant-numeric: tabular-nums;
}

/* Count */
.count-chip {
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

/* Job Actions */
.job-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn.view {
  background: var(--juris-primary-50);
  color: var(--juris-primary-light);
}

.action-btn.view:hover {
  background: var(--juris-primary-100);
  color: var(--juris-primary);
}

.action-btn.retry {
  background: rgba(249, 168, 37, 0.1);
  color: var(--juris-warning);
}

.action-btn.retry:hover {
  background: rgba(249, 168, 37, 0.2);
}

.action-btn.cancel {
  background: rgba(198, 40, 40, 0.06);
  color: var(--juris-danger);
}

.action-btn.cancel:hover {
  background: rgba(198, 40, 40, 0.14);
}

/* Responsive */
@media (max-width: 1100px) {
  .sources-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .sources-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
