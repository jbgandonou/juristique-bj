<template>
  <div class="pipeline-page">
    <!-- Page Header -->
    <div class="page-header fade-in-up">
      <div>
        <h2 class="page-title">Pipeline de collecte</h2>
        <p class="page-subtitle">Supervision des sources et des jobs de scraping</p>
      </div>
      <div class="page-header-actions">
        <button class="btn-run-all" :disabled="runningAll" @click="runAll">
          <Loader v-if="runningAll" :size="15" class="spin" />
          <Play v-else :size="15" />
          {{ runningAll ? 'Lancement...' : 'Lancer tous les jobs' }}
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

        <Column field="status" header="Statut" style="min-width: 180px;">
          <template #body="{ data }">
            <div class="job-status-wrapper">
              <span class="job-status-badge" :class="`job-${data.status}`">
                <component :is="statusIcon(data.status)" :size="12" />
                {{ statusLabel(data.status) }}
              </span>
              <div v-if="['scraping', 'extracting', 'enriching'].includes(data.status)" class="mt-2">
                <div class="job-progress-row">
                  <div class="job-progress-bar">
                    <div
                      class="job-progress-fill"
                      :class="{
                        'progress-scraping': data.status === 'scraping',
                        'progress-extracting': data.status === 'extracting',
                        'progress-enriching': data.status === 'enriching',
                      }"
                      :style="{ width: (data.progress || 10) + '%' }"
                    ></div>
                  </div>
                  <span class="progress-pct">{{ data.progress || 0 }}%</span>
                </div>
                <p v-if="data.stage" class="progress-stage">{{ data.stage }}</p>
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

        <Column header="Actions" style="min-width: 120px;">
          <template #body="{ data }">
            <div class="job-actions">
              <button class="action-btn view" title="Voir les details" @click="openJobDetail(data)">
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
                v-if="['queued', 'scraping', 'extracting', 'enriching'].includes(data.status)"
                class="action-btn cancel"
                title="Annuler"
                @click="cancelJob(data.id)"
              >
                <StopCircle :size="14" />
              </button>
              <button
                v-if="['ready_for_review', 'completed', 'failed', 'cancelled'].includes(data.status)"
                class="action-btn delete"
                title="Supprimer"
                @click="deleteJob(data.id)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Alerts Section -->
    <div class="alerts-card glass-card fade-in-up stagger-4">
      <div class="card-header-block">
        <h3 class="card-section-title">
          Alertes Pipeline
          <span v-if="alertCount > 0" class="alert-count-badge">{{ alertCount }}</span>
        </h3>
        <div class="alerts-filters">
          <select v-model="alertFilter.type" class="alert-filter-select">
            <option value="">Tous les types</option>
            <option value="scrape_failed">Échec scraping</option>
            <option value="structure_changed">Structure changée</option>
            <option value="no_results">Aucun résultat</option>
            <option value="validation_error">Erreur validation</option>
          </select>
          <select v-model="alertFilter.severity" class="alert-filter-select">
            <option value="">Toutes sévérités</option>
            <option value="error">Erreur</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      <div v-if="alerts.length === 0" class="alerts-empty">
        Aucune alerte
      </div>

      <div v-else class="alerts-list">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="alert-row"
          :class="{
            'alert-error': alert.severity === 'error',
            'alert-warning': alert.severity === 'warning',
            'alert-info': alert.severity === 'info',
            'alert-acknowledged': alert.acknowledged,
          }"
        >
          <div class="alert-body">
            <div class="alert-meta">
              <span class="alert-type-chip"
                :class="{
                  'chip-error': alert.severity === 'error',
                  'chip-warning': alert.severity === 'warning',
                  'chip-info': alert.severity === 'info',
                }">
                {{ alert.type }}
              </span>
              <span class="alert-date">{{ formatAlertDate(alert.createdAt) }}</span>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
          </div>
          <button
            v-if="!alert.acknowledged"
            class="alert-ack-btn"
            @click="acknowledgeAlert(alert.id)"
          >
            OK
          </button>
        </div>
      </div>
    </div>

    <!-- Job Detail Dialog -->
    <Dialog
      v-model:visible="showJobDetail"
      :header="`Job #${selectedJob?.id} — ${selectedJob?.source}`"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedJob" class="job-detail">
        <div class="job-detail-row">
          <span class="job-detail-label">Statut</span>
          <span class="job-status-badge" :class="`job-${selectedJob.status}`">
            {{ statusLabel(selectedJob.status) }}
          </span>
        </div>
        <div class="job-detail-row">
          <span class="job-detail-label">Source</span>
          <span>{{ selectedJob.source }}</span>
        </div>
        <div class="job-detail-row">
          <span class="job-detail-label">Demarre</span>
          <span>{{ selectedJob.started }}</span>
        </div>
        <div class="job-detail-row">
          <span class="job-detail-label">Duree</span>
          <span>{{ selectedJob.duration || '—' }}</span>
        </div>
        <div class="job-detail-row">
          <span class="job-detail-label">Textes collectes</span>
          <span class="count-chip">{{ selectedJob.textes }}</span>
        </div>
        <div v-if="selectedJob.errorMessage" class="job-error-block">
          <span class="job-detail-label">Erreur</span>
          <pre class="job-error-message">{{ selectedJob.errorMessage }}</pre>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  Globe, Clock, CheckCircle, CalendarClock, RefreshCw, Settings,
  Play, Loader, AlertTriangle, CircleCheck, Circle, Zap, Terminal, StopCircle, Trash2,
} from 'lucide-vue-next';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const {
  getPipelineJobs,
  getPipelineSources,
  createPipelineJob,
  cancelPipelineJob,
  deletePipelineJob,
  getPipelineAlerts,
  getPipelineAlertCount,
  acknowledgePipelineAlert,
} = useApi();

const loading = ref(true);
const showJobDetail = ref(false);
const selectedJob = ref<any>(null);

// Real sources configured in the pipeline
const defaultSources = [
  { name: 'FAOLEX', active: true, lastRun: '—', successRate: '—', nextRun: '—' },
  { name: 'OHADA', active: true, lastRun: '—', successRate: '—', nextRun: '—' },
  { name: 'Constitutions', active: true, lastRun: '—', successRate: '—', nextRun: '—' },
  { name: 'CCJA', active: true, lastRun: '—', successRate: '—', nextRun: '—' },
  { name: 'Assemblées nationales', active: true, lastRun: '—', successRate: '—', nextRun: '—' },
  { name: 'Journaux officiels', active: true, lastRun: '—', successRate: '—', nextRun: '—' },
];

const sources = ref<any[]>([...defaultSources]);
const jobs = ref<any[]>([]);

// Auto-refresh for active jobs
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const mapJob = (j: any) => ({
  id: j.id,
  source: j.source ?? j.sourceName ?? '—',
  status: j.status ?? 'queued',
  started: j.startedAt
    ? new Date(j.startedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : j.started ?? '—',
  duration: j.completedAt && j.startedAt
    ? `${Math.round((new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime()) / 1000)}s`
    : j.durationMs != null ? `${Math.round(j.durationMs / 1000)}s` : j.duration ?? null,
  textes: j.textsCount ?? j.textes ?? 0,
  progress: j.metadataJson?.progress ?? j.progress ?? 0,
  stage: j.metadataJson?.stage ?? '',
  errorMessage: j.errorMessage ?? null,
});

const fetchJobs = async () => {
  try {
    const jobsRes = await getPipelineJobs(1, 20);
    if (jobsRes.data?.length) {
      jobs.value = jobsRes.data.map(mapJob);
    }
  } catch (e) {
    console.error('Failed to fetch jobs', e);
  }
};

const startAutoRefresh = () => {
  if (refreshInterval) return;
  refreshInterval = setInterval(async () => {
    await fetchJobs();
    const hasActive = jobs.value.some(j =>
      ['queued', 'scraping', 'extracting', 'enriching'].includes(j.status),
    );
    if (!hasActive && refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }, 5000);
};

const cancelJob = async (id: string) => {
  try {
    await cancelPipelineJob(id);
    await fetchJobs();
  } catch (e) {
    console.error('Failed to cancel job', e);
  }
};

const deleteJob = async (id: string) => {
  if (!confirm('Supprimer ce job ?')) return;
  try {
    await deletePipelineJob(id);
    await fetchJobs();
  } catch (e) {
    console.error('Failed to delete job', e);
  }
};

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

// Alert state
const alerts = ref<any[]>([]);
const alertCount = ref(0);
const alertFilter = ref({ type: '', severity: '' });

const fetchAlerts = async () => {
  try {
    const params: Record<string, string> = { limit: '50' };
    if (alertFilter.value.type) params.type = alertFilter.value.type;
    if (alertFilter.value.severity) params.severity = alertFilter.value.severity;
    const data = await getPipelineAlerts(params);
    alerts.value = data?.data ?? data ?? [];
  } catch (e) {
    console.error('Failed to fetch alerts', e);
  }
};

const fetchAlertCount = async () => {
  try {
    const data = await getPipelineAlertCount();
    alertCount.value = typeof data === 'number' ? data : data?.count ?? 0;
  } catch (e) {
    console.error('Failed to fetch alert count', e);
  }
};

const acknowledgeAlert = async (id: string) => {
  try {
    await acknowledgePipelineAlert(id);
    await fetchAlerts();
    await fetchAlertCount();
  } catch (e) {
    console.error('Failed to acknowledge alert', e);
  }
};

const formatAlertDate = (date: string) => {
  return new Date(date).toLocaleString('fr-FR');
};

watch(alertFilter, fetchAlerts, { deep: true });

onMounted(async () => {
  try {
    const sourcesRes = await getPipelineSources();
    if (sourcesRes?.length) {
      sources.value = sourcesRes.map((s: any) => ({
        name: s.name ?? s.slug ?? '—',
        active: s.isActive ?? s.active ?? true,
        lastRun: s.lastRunAt
          ? new Date(s.lastRunAt).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : s.lastRun ?? '—',
        successRate: s.successRate != null ? `${s.successRate}%` : '—',
        nextRun: s.nextRunAt
          ? new Date(s.nextRunAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : s.nextRun ?? '—',
      }));
    }
  } catch (e) {
    console.log('Pipeline sources API not available');
  }

  await fetchJobs();
  startAutoRefresh();
  loading.value = false;

  // Fetch alerts independently so a failure doesn't block the rest
  await Promise.all([fetchAlerts(), fetchAlertCount()]);
});

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

const runningAll = ref(false);

const addJobToList = (job: any, sourceName: string) => {
  jobs.value.unshift({
    id: job.id,
    source: job.sourceName ?? sourceName,
    status: job.status ?? 'queued',
    started: new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    duration: null,
    textes: 0,
    progress: 0,
    stage: '',
    errorMessage: null,
  });
  startAutoRefresh();
};

const runAll = async () => {
  runningAll.value = true;
  try {
    const activeSources = sources.value.filter((s) => s.active);
    const results = await Promise.allSettled(
      activeSources.map((src) => createPipelineJob(src.name)),
    );
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        addJobToList(result.value, activeSources[i].name);
      } else {
        alert(`Erreur pour ${activeSources[i].name}: ${result.reason?.message || result.reason}`);
      }
    });
  } catch (e: any) {
    alert('Erreur lors du lancement des jobs: ' + (e?.message || e));
  } finally {
    runningAll.value = false;
  }
};

const triggerSource = async (src: any) => {
  try {
    const job = await createPipelineJob(src.name);
    addJobToList(job, src.name);
  } catch (e: any) {
    alert(`Erreur pour ${src.name}: ${e?.message || e}`);
  }
};

const openJobDetail = (job: any) => {
  selectedJob.value = job;
  showJobDetail.value = true;
};

const retryJob = async (job: any) => {
  try {
    const newJob = await createPipelineJob(job.source);
    addJobToList(newJob, job.source);
  } catch (e: any) {
    alert(`Erreur relance job #${job.id}: ${e?.message || e}`);
  }
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

.mt-2 {
  margin-top: 6px;
}

.job-progress-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.job-progress-bar {
  flex: 1;
  height: 4px;
  background: var(--juris-border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.job-progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progress-scraping {
  background: var(--juris-info, #1565c0);
}

.progress-extracting {
  background: #3949ab;
}

.progress-enriching {
  background: var(--juris-accent, #00897b);
}

.progress-pct {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  white-space: nowrap;
  min-width: 28px;
  text-align: right;
}

.progress-stage {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  margin: 3px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
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

.action-btn.delete {
  background: rgba(198, 40, 40, 0.06);
  color: var(--juris-danger);
}

.action-btn.delete:hover {
  background: rgba(198, 40, 40, 0.18);
}

/* Job Detail Dialog */
.job-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.job-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--juris-border-light);
}

.job-detail-label {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-text-secondary);
}

.job-error-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.job-error-message {
  background: rgba(198, 40, 40, 0.06);
  border: 1px solid rgba(198, 40, 40, 0.15);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--font-xs);
  color: var(--juris-danger);
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

/* Alerts Card */
.alerts-card {
  padding: 20px;
}

.alert-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  background: var(--juris-danger);
  color: white;
  font-size: var(--font-xs);
  font-weight: 700;
  border-radius: var(--radius-full);
  padding: 0 6px;
  margin-left: 8px;
  vertical-align: middle;
}

.alerts-filters {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.alert-filter-select {
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-md);
  padding: 5px 10px;
  font-size: var(--font-xs);
  background: var(--juris-surface);
  color: var(--juris-text);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease;
}

.alert-filter-select:focus {
  border-color: var(--juris-primary-lighter);
}

.alerts-empty {
  text-align: center;
  padding: 32px 0;
  color: var(--juris-text-muted);
  font-size: var(--font-sm);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid;
  transition: opacity 0.2s ease;
}

.alert-error {
  border-color: rgba(198, 40, 40, 0.25);
  background: rgba(198, 40, 40, 0.04);
}

.alert-warning {
  border-color: rgba(249, 168, 37, 0.3);
  background: rgba(249, 168, 37, 0.04);
}

.alert-info {
  border-color: rgba(21, 101, 192, 0.2);
  background: rgba(21, 101, 192, 0.04);
}

.alert-acknowledged {
  opacity: 0.45;
}

.alert-body {
  flex: 1;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.alert-type-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.chip-error {
  background: rgba(198, 40, 40, 0.12);
  color: var(--juris-danger);
}

.chip-warning {
  background: rgba(249, 168, 37, 0.15);
  color: var(--juris-warning);
}

.chip-info {
  background: rgba(21, 101, 192, 0.1);
  color: var(--juris-info);
}

.alert-date {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

.alert-message {
  font-size: var(--font-sm);
  color: var(--juris-text);
  margin: 0;
}

.alert-ack-btn {
  margin-left: 12px;
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-md);
  background: var(--juris-surface);
  color: var(--juris-text-secondary);
  font-size: var(--font-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.alert-ack-btn:hover {
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  border-color: var(--juris-primary-lighter);
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
