<template>
  <div class="queue-page">
    <!-- Page Header -->
    <div class="page-header fade-in-up">
      <div class="page-header-left">
        <h2 class="page-title">Queue éditoriale</h2>
        <span class="count-badge">{{ filteredRows.length }} textes</span>
      </div>
      <div class="page-header-actions">
        <Button
          label="Tout approuver"
          icon="pi pi-check-circle"
          size="small"
          class="btn-approve-all"
        />
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar glass-card fade-in-up stagger-1">
      <div class="filter-group">
        <label class="filter-label">Source</label>
        <select v-model="filterSource" class="filter-select">
          <option value="">Toutes les sources</option>
          <option value="FAOLEX">FAOLEX</option>
          <option value="OHADA">OHADA</option>
          <option value="JO Bénin">JO Bénin</option>
          <option value="Primature SN">Primature SN</option>
          <option value="Assemblée CI">Assemblée CI</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Pays</label>
        <select v-model="filterCountry" class="filter-select">
          <option value="">Tous les pays</option>
          <option value="Bénin">Bénin</option>
          <option value="Sénégal">Sénégal</option>
          <option value="Togo">Togo</option>
          <option value="Côte d'Ivoire">Côte d'Ivoire</option>
          <option value="OHADA">OHADA</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Statut</label>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="pending_review">En attente</option>
          <option value="verified">Vérifié</option>
          <option value="draft">Brouillon</option>
        </select>
      </div>
      <button class="filter-reset" @click="resetFilters">
        <X :size="14" />
        Réinitialiser
      </button>
    </div>

    <!-- Data Table -->
    <div class="table-card glass-card fade-in-up stagger-2">
      <DataTable
        :value="filteredRows"
        :row-hover="true"
        paginator
        :rows="8"
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        class="juris-table"
        :global-filter-fields="['title', 'country', 'source']"
      >
        <Column field="title" header="Titre" style="min-width: 280px;">
          <template #body="{ data }">
            <div class="title-cell">
              <span class="text-title">{{ data.title }}</span>
              <span class="text-type">{{ data.type }}</span>
            </div>
          </template>
        </Column>

        <Column field="country" header="Pays" style="min-width: 120px;">
          <template #body="{ data }">
            <span class="country-chip">{{ data.country }}</span>
          </template>
        </Column>

        <Column field="source" header="Source" style="min-width: 120px;">
          <template #body="{ data }">
            <span class="source-chip">{{ data.source }}</span>
          </template>
        </Column>

        <Column field="ocrScore" header="Score OCR" style="min-width: 110px;">
          <template #body="{ data }">
            <div class="ocr-score-wrapper">
              <span
                class="ocr-score"
                :class="ocrScoreClass(data.ocrScore)"
              >{{ data.ocrScore }}%</span>
              <div class="ocr-bar">
                <div
                  class="ocr-fill"
                  :style="{ width: data.ocrScore + '%' }"
                  :class="ocrScoreClass(data.ocrScore)"
                ></div>
              </div>
            </div>
          </template>
        </Column>

        <Column field="date" header="Date" style="min-width: 120px;" />

        <Column field="status" header="Statut" style="min-width: 130px;">
          <template #body="{ data }">
            <Tag
              :value="statusLabel(data.status)"
              :severity="statusSeverity(data.status)"
              rounded
            />
          </template>
        </Column>

        <Column header="Actions" style="min-width: 140px;">
          <template #body="{ data }">
            <div class="row-actions">
              <button class="action-btn view" title="Voir le document">
                <Eye :size="15" />
              </button>
              <button
                class="action-btn approve"
                title="Approuver"
                @click="approveRow(data)"
              >
                <Check :size="15" />
              </button>
              <button
                class="action-btn reject"
                title="Rejeter"
                @click="rejectRow(data)"
              >
                <XCircle :size="15" />
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { X, Eye, Check, XCircle } from 'lucide-vue-next';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { getLegalTextsByStatus } = useApi();
const { authFetch } = useAuth();

const loading = ref(true);
const filterSource = ref('');
const filterCountry = ref('');
const filterStatus = ref('');

const mockRows = [
  {
    id: '1',
    title: 'Loi n°2024-15 portant Code du numérique',
    type: 'Loi',
    country: 'Bénin',
    source: 'JO Bénin',
    ocrScore: 94,
    date: '15 mars 2024',
    status: 'pending_review',
  },
  {
    id: '2',
    title: 'Acte uniforme révisé relatif au droit commercial général',
    type: 'Acte uniforme',
    country: 'OHADA',
    source: 'OHADA',
    ocrScore: 98,
    date: '15 déc. 2023',
    status: 'verified',
  },
  {
    id: '3',
    title: "Décret n°2023-412 relatif à l'environnement",
    type: 'Décret',
    country: 'Sénégal',
    source: 'Primature SN',
    ocrScore: 76,
    date: '22 oct. 2023',
    status: 'pending_review',
  },
  {
    id: '4',
    title: 'Loi portant réglementation des télécommunications',
    type: 'Loi',
    country: 'Togo',
    source: 'FAOLEX',
    ocrScore: 88,
    date: '08 jan. 2024',
    status: 'pending_review',
  },
  {
    id: '5',
    title: "Ordonnance n°2023-09 relative au droit foncier",
    type: 'Ordonnance',
    country: "Côte d'Ivoire",
    source: "Assemblée CI",
    ocrScore: 61,
    date: '30 nov. 2023',
    status: 'draft',
  },
  {
    id: '6',
    title: 'Règlement CEMAC sur les changes extérieurs',
    type: 'Règlement',
    country: 'OHADA',
    source: 'OHADA',
    ocrScore: 91,
    date: '05 fév. 2024',
    status: 'verified',
  },
  {
    id: '7',
    title: 'Loi n°2023-32 portant code minier',
    type: 'Loi',
    country: 'Bénin',
    source: 'JO Bénin',
    ocrScore: 83,
    date: '12 déc. 2023',
    status: 'pending_review',
  },
  {
    id: '8',
    title: 'Directive sur la protection des données personnelles',
    type: 'Directive',
    country: 'OHADA',
    source: 'FAOLEX',
    ocrScore: 72,
    date: '20 mars 2024',
    status: 'draft',
  },
];

const rows = ref<any[]>([...mockRows]);

onMounted(async () => {
  try {
    const res = await getLegalTextsByStatus('pending_review', 1, 50);
    if (res.data?.length) {
      rows.value = res.data.map((t: any) => ({
        id: t.id,
        title: t.title,
        type: t.textType ?? '—',
        country: t.country?.name ?? '—',
        source: t.sourceName ?? '—',
        ocrScore: t.ocrScore ?? 80,
        date: t.publicationDate
          ? new Date(t.publicationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—',
        status: t.status,
      }));
    }
  } catch (e) {
    console.log('Queue API not available, using mock data');
  } finally {
    loading.value = false;
  }
});

const filteredRows = computed(() =>
  rows.value.filter((r) => {
    if (filterSource.value && r.source !== filterSource.value) return false;
    if (filterCountry.value && r.country !== filterCountry.value) return false;
    if (filterStatus.value && r.status !== filterStatus.value) return false;
    return true;
  }),
);

const resetFilters = () => {
  filterSource.value = '';
  filterCountry.value = '';
  filterStatus.value = '';
};

const approveRow = async (data: any) => {
  try {
    // TODO: wire to real PATCH endpoint when available
    await authFetch(`/legal-texts/${data.id}`, {
      method: 'PATCH',
      body: { status: 'published', isVerified: true },
    });
  } catch (e) {
    console.log('Approve API not available, updating locally');
  }
  const idx = rows.value.findIndex((r) => r.id === data.id);
  if (idx !== -1) rows.value[idx].status = 'verified';
};

const rejectRow = async (data: any) => {
  try {
    // TODO: wire to real PATCH endpoint when available
    await authFetch(`/legal-texts/${data.id}`, {
      method: 'PATCH',
      body: { status: 'draft' },
    });
  } catch (e) {
    console.log('Reject API not available, updating locally');
  }
  const idx = rows.value.findIndex((r) => r.id === data.id);
  if (idx !== -1) rows.value[idx].status = 'draft';
};

const statusLabel = (s: string) =>
  ({ pending_review: 'En attente', verified: 'Vérifié', draft: 'Brouillon', published: 'Publié' }[s] ?? s);

const statusSeverity = (s: string) =>
  ({ pending_review: 'warn', verified: 'success', draft: 'secondary', published: 'success' }[s] ?? 'secondary');

const ocrScoreClass = (score: number) => {
  if (score >= 90) return 'ocr-high';
  if (score >= 75) return 'ocr-mid';
  return 'ocr-low';
};
</script>

<style scoped>
.queue-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
}

.count-badge {
  background: var(--juris-primary-100);
  color: var(--juris-primary);
  font-size: var(--font-sm);
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.btn-approve-all {
  background: var(--juris-success) !important;
  border-color: var(--juris-success) !important;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 16px 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.filter-label {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--juris-text);
  background: var(--juris-surface);
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}

.filter-select:focus {
  border-color: var(--juris-primary-lighter);
  box-shadow: 0 0 0 3px var(--juris-primary-100);
}

.filter-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: none;
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-end;
}

.filter-reset:hover {
  background: var(--juris-border-light);
  color: var(--juris-text);
}

/* Table */
.table-card {
  padding: 0;
  overflow: hidden;
}

/* Title Cell */
.title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.text-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-text);
  line-height: 1.4;
}

.text-type {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

/* Chips */
.country-chip,
.source-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: 600;
}

.country-chip {
  background: rgba(26, 35, 126, 0.06);
  color: var(--juris-primary);
}

.source-chip {
  background: rgba(0, 137, 123, 0.08);
  color: var(--juris-accent);
}

/* OCR Score */
.ocr-score-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 70px;
}

.ocr-score {
  font-size: var(--font-sm);
  font-weight: 700;
}

.ocr-score.ocr-high { color: var(--juris-success); }
.ocr-score.ocr-mid { color: var(--juris-warning); }
.ocr-score.ocr-low { color: var(--juris-danger); }

.ocr-bar {
  height: 4px;
  background: var(--juris-border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.ocr-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.ocr-fill.ocr-high { background: var(--juris-success); }
.ocr-fill.ocr-mid { background: var(--juris-warning); }
.ocr-fill.ocr-low { background: var(--juris-danger); }

/* Row Actions */
.row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: none;
}

.action-btn.view {
  color: var(--juris-primary-light);
  background: var(--juris-primary-50);
}

.action-btn.view:hover {
  background: var(--juris-primary-100);
  color: var(--juris-primary);
}

.action-btn.approve {
  color: var(--juris-success);
  background: rgba(46, 125, 50, 0.08);
}

.action-btn.approve:hover {
  background: rgba(46, 125, 50, 0.18);
}

.action-btn.reject {
  color: var(--juris-danger);
  background: rgba(198, 40, 40, 0.06);
}

.action-btn.reject:hover {
  background: rgba(198, 40, 40, 0.14);
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: unset;
  }

  .filter-reset {
    align-self: flex-start;
  }
}
</style>
