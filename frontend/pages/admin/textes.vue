<template>
  <div class="textes-page">
    <!-- Page Header -->
    <div class="page-header fade-in-up">
      <div class="page-header-left">
        <h2 class="page-title">Gestion des textes</h2>
        <span class="count-badge">{{ totalTexts }} textes</span>
      </div>
      <div class="page-header-actions">
        <Button
          label="Ajouter un texte"
          icon="pi pi-plus"
          size="small"
          class="btn-add"
          @click="showCreateDialog = true"
        />
        <Button
          label="Purger tous les textes"
          icon="pi pi-trash"
          size="small"
          severity="danger"
          outlined
          @click="confirmPurge"
        />
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar glass-card fade-in-up stagger-1">
      <div class="filter-group">
        <label class="filter-label">Statut</label>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tous</option>
          <option value="published">Publie</option>
          <option value="pending_review">En attente</option>
          <option value="verified">Verifie</option>
          <option value="draft">Brouillon</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Type</label>
        <select v-model="filterType" class="filter-select">
          <option value="">Tous les types</option>
          <option value="constitution">Constitution</option>
          <option value="loi_organique">Loi organique</option>
          <option value="loi">Loi</option>
          <option value="ordonnance">Ordonnance</option>
          <option value="decret">Decret</option>
          <option value="arrete">Arrete</option>
          <option value="traite">Traite</option>
          <option value="acte_uniforme">Acte uniforme</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Recherche</label>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un titre..."
          class="filter-input"
        />
      </div>
      <button class="filter-reset" @click="resetFilters">
        <X :size="14" />
        Reinitialiser
      </button>
    </div>

    <!-- Data Table -->
    <div class="table-card glass-card fade-in-up stagger-2">
      <div v-if="loading" class="loading-state">
        <p>Chargement des textes...</p>
      </div>
      <DataTable
        v-else
        :value="filteredTexts"
        :row-hover="true"
        paginator
        :rows="15"
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        class="juris-table"
      >
        <Column field="title" header="Titre" style="min-width: 300px;">
          <template #body="{ data }">
            <div class="title-cell">
              <span class="text-title">{{ data.title }}</span>
              <span class="text-ref">{{ data.reference || '—' }}</span>
            </div>
          </template>
        </Column>

        <Column field="textType" header="Type" style="min-width: 120px;">
          <template #body="{ data }">
            <Tag :value="typeLabel(data.textType)" severity="info" rounded />
          </template>
        </Column>

        <Column field="country" header="Pays" style="min-width: 120px;">
          <template #body="{ data }">
            <span class="country-chip">{{ data.country?.name || '—' }}</span>
          </template>
        </Column>

        <Column field="status" header="Statut" style="min-width: 130px;">
          <template #body="{ data }">
            <Tag
              :value="statusLabel(data.status)"
              :severity="statusSeverity(data.status)"
              rounded
            />
          </template>
        </Column>

        <Column field="sourceName" header="Source" style="min-width: 120px;">
          <template #body="{ data }">
            <span class="source-chip">{{ data.sourceName || 'Manuel' }}</span>
          </template>
        </Column>

        <Column header="Actions" style="min-width: 180px;">
          <template #body="{ data }">
            <div class="row-actions">
              <button
                v-if="data.status !== 'published'"
                class="action-btn approve"
                title="Publier"
                @click="publishText(data)"
              >
                <Check :size="15" />
              </button>
              <button
                v-if="data.status === 'published'"
                class="action-btn unpublish"
                title="Depublier"
                @click="unpublishText(data)"
              >
                <EyeOff :size="15" />
              </button>
              <button
                class="action-btn edit"
                title="Modifier"
                @click="openEditDialog(data)"
              >
                <Pencil :size="15" />
              </button>
              <button
                class="action-btn reject"
                title="Supprimer"
                @click="confirmDelete(data)"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      :header="editingText ? 'Modifier le texte' : 'Ajouter un texte manuellement'"
      :modal="true"
      :style="{ width: '700px' }"
      class="create-dialog"
    >
      <div class="form-grid">
        <div class="form-group full">
          <label>Titre *</label>
          <InputText v-model="form.title" placeholder="Titre du texte juridique" class="w-full" />
        </div>

        <div class="form-group">
          <label>Reference</label>
          <InputText v-model="form.reference" placeholder="Ex: Loi n2024-15" class="w-full" />
        </div>

        <div class="form-group">
          <label>Type de texte *</label>
          <select v-model="form.textType" class="filter-select w-full">
            <option value="constitution">Constitution</option>
            <option value="loi_organique">Loi organique</option>
            <option value="loi">Loi</option>
            <option value="ordonnance">Ordonnance</option>
            <option value="decret">Decret</option>
            <option value="arrete">Arrete</option>
            <option value="traite">Traite</option>
            <option value="acte_uniforme">Acte uniforme</option>
          </select>
        </div>

        <div class="form-group">
          <label>Pays *</label>
          <select v-model="form.countryId" class="filter-select w-full">
            <option value="">Selectionner un pays</option>
            <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Date de promulgation</label>
          <InputText v-model="form.promulgationDate" type="date" class="w-full" />
        </div>

        <div class="form-group full">
          <label>Resume</label>
          <Textarea v-model="form.summary" :rows="3" placeholder="Resume du texte" class="w-full" />
        </div>

        <div class="form-group full">
          <label>Contenu du texte</label>
          <Textarea v-model="form.contentText" :rows="8" placeholder="Contenu integral du texte juridique" class="w-full" />
        </div>

        <div class="form-group">
          <label>URL source</label>
          <InputText v-model="form.sourceUrl" placeholder="https://..." class="w-full" />
        </div>

        <div class="form-group">
          <label>Statut</label>
          <select v-model="form.status" class="filter-select w-full">
            <option value="draft">Brouillon</option>
            <option value="pending_review">En attente de review</option>
            <option value="verified">Verifie</option>
            <option value="published">Publie</option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Annuler" severity="secondary" text @click="closeDialog" />
        <Button
          :label="editingText ? 'Mettre a jour' : 'Creer le texte'"
          icon="pi pi-check"
          :loading="saving"
          @click="saveText"
        />
      </template>
    </Dialog>

    <!-- Purge Confirmation Dialog -->
    <Dialog
      v-model:visible="showPurgeDialog"
      header="Confirmer la purge"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="purge-warning">
        <AlertTriangle :size="48" style="color: var(--juris-danger);" />
        <p>
          <strong>Attention !</strong> Cette action va supprimer
          <strong>tous les {{ totalTexts }} textes</strong> de la base de donnees
          et de l'index de recherche. Cette action est irreversible.
        </p>
        <p>Tapez <strong>PURGER</strong> pour confirmer :</p>
        <InputText v-model="purgeConfirmation" placeholder="Tapez PURGER" class="w-full" />
      </div>

      <template #footer>
        <Button label="Annuler" severity="secondary" text @click="showPurgeDialog = false" />
        <Button
          label="Purger tous les textes"
          severity="danger"
          icon="pi pi-trash"
          :disabled="purgeConfirmation !== 'PURGER'"
          :loading="purging"
          @click="executePurge"
        />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmer la suppression"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <p>Voulez-vous vraiment supprimer le texte :</p>
      <p><strong>{{ textToDelete?.title }}</strong></p>

      <template #footer>
        <Button label="Annuler" severity="secondary" text @click="showDeleteDialog = false" />
        <Button
          label="Supprimer"
          severity="danger"
          icon="pi pi-trash"
          @click="executeDelete"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { X, Check, EyeOff, Pencil, Trash2, AlertTriangle } from 'lucide-vue-next';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const {
  getLegalTexts,
  getCountries,
  updateLegalText,
  deleteLegalText,
  purgeAllLegalTexts,
  createLegalText,
} = useApi();

const loading = ref(true);
const saving = ref(false);
const purging = ref(false);
const texts = ref<any[]>([]);
const countries = ref<any[]>([]);
const totalTexts = ref(0);

// Filters
const filterStatus = ref('');
const filterType = ref('');
const searchQuery = ref('');

// Dialogs
const showCreateDialog = ref(false);
const showPurgeDialog = ref(false);
const showDeleteDialog = ref(false);
const editingText = ref<any>(null);
const textToDelete = ref<any>(null);
const purgeConfirmation = ref('');

// Form
const defaultForm = {
  title: '',
  reference: '',
  textType: 'loi',
  countryId: '',
  promulgationDate: '',
  summary: '',
  contentText: '',
  sourceUrl: '',
  status: 'draft',
};
const form = ref({ ...defaultForm });

const filteredTexts = computed(() =>
  texts.value.filter((t) => {
    if (filterStatus.value && t.status !== filterStatus.value) return false;
    if (filterType.value && t.textType !== filterType.value) return false;
    if (searchQuery.value && !t.title.toLowerCase().includes(searchQuery.value.toLowerCase())) return false;
    return true;
  }),
);

const resetFilters = () => {
  filterStatus.value = '';
  filterType.value = '';
  searchQuery.value = '';
};

const loadTexts = async () => {
  loading.value = true;
  try {
    const res = await getLegalTexts({ limit: '500' });
    texts.value = res.data;
    totalTexts.value = res.total;
  } catch (e) {
    console.error('Failed to load texts', e);
  } finally {
    loading.value = false;
  }
};

const loadCountries = async () => {
  try {
    const res = await getCountries();
    countries.value = res.data;
  } catch (e) {
    console.error('Failed to load countries', e);
  }
};

onMounted(async () => {
  await Promise.all([loadTexts(), loadCountries()]);
});

const typeLabel = (t: string) =>
  ({
    constitution: 'Constitution',
    loi_organique: 'Loi organique',
    loi: 'Loi',
    ordonnance: 'Ordonnance',
    decret: 'Decret',
    arrete: 'Arrete',
    traite: 'Traite',
    acte_uniforme: 'Acte uniforme',
  }[t] ?? t);

const statusLabel = (s: string) =>
  ({
    pending_review: 'En attente',
    verified: 'Verifie',
    draft: 'Brouillon',
    published: 'Publie',
  }[s] ?? s);

const statusSeverity = (s: string) =>
  ({
    pending_review: 'warn',
    verified: 'info',
    draft: 'secondary',
    published: 'success',
  }[s] ?? 'secondary');

const publishText = async (data: any) => {
  try {
    await updateLegalText(data.id, { status: 'published', isVerified: true });
    data.status = 'published';
    data.isVerified = true;
  } catch (e) {
    console.error('Failed to publish', e);
  }
};

const unpublishText = async (data: any) => {
  try {
    await updateLegalText(data.id, { status: 'draft' });
    data.status = 'draft';
  } catch (e) {
    console.error('Failed to unpublish', e);
  }
};

const openEditDialog = (data: any) => {
  editingText.value = data;
  form.value = {
    title: data.title || '',
    reference: data.reference || '',
    textType: data.textType || 'loi',
    countryId: data.country?.id || data.countryId || '',
    promulgationDate: data.promulgationDate ? data.promulgationDate.substring(0, 10) : '',
    summary: data.summary || '',
    contentText: data.contentText || '',
    sourceUrl: data.sourceUrl || '',
    status: data.status || 'draft',
  };
  showCreateDialog.value = true;
};

const closeDialog = () => {
  showCreateDialog.value = false;
  editingText.value = null;
  form.value = { ...defaultForm };
};

const saveText = async () => {
  saving.value = true;
  try {
    const payload: any = { ...form.value };
    // Remove empty strings
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });

    if (editingText.value) {
      await updateLegalText(editingText.value.id, payload);
    } else {
      if (!payload.title || !payload.textType || !payload.countryId) {
        alert('Titre, type de texte et pays sont obligatoires.');
        saving.value = false;
        return;
      }
      payload.sourceName = 'Admin (manuel)';
      await createLegalText(payload);
    }
    closeDialog();
    await loadTexts();
  } catch (e) {
    console.error('Failed to save text', e);
    alert('Erreur lors de la sauvegarde.');
  } finally {
    saving.value = false;
  }
};

const confirmPurge = () => {
  purgeConfirmation.value = '';
  showPurgeDialog.value = true;
};

const executePurge = async () => {
  purging.value = true;
  try {
    const res = await purgeAllLegalTexts();
    alert(`${res.deleted} textes ont ete supprimes.`);
    showPurgeDialog.value = false;
    await loadTexts();
  } catch (e) {
    console.error('Purge failed', e);
    alert('Erreur lors de la purge.');
  } finally {
    purging.value = false;
  }
};

const confirmDelete = (data: any) => {
  textToDelete.value = data;
  showDeleteDialog.value = true;
};

const executeDelete = async () => {
  if (!textToDelete.value) return;
  try {
    await deleteLegalText(textToDelete.value.id);
    showDeleteDialog.value = false;
    await loadTexts();
  } catch (e) {
    console.error('Delete failed', e);
    alert('Erreur lors de la suppression.');
  }
};
</script>

<style scoped>
.textes-page {
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

.page-header-actions {
  display: flex;
  gap: 8px;
}

.btn-add {
  background: var(--juris-primary) !important;
  border-color: var(--juris-primary) !important;
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

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--juris-text);
  background: var(--juris-surface);
  outline: none;
  transition: all 0.2s;
}

.filter-select:focus,
.filter-input:focus {
  border-color: var(--juris-primary-lighter);
  box-shadow: 0 0 0 3px var(--juris-primary-100);
}

.filter-select {
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
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

.loading-state {
  padding: 40px;
  text-align: center;
  color: var(--juris-text-muted);
}

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

.text-ref {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

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

.action-btn.approve {
  color: var(--juris-success);
  background: rgba(46, 125, 50, 0.08);
}

.action-btn.approve:hover {
  background: rgba(46, 125, 50, 0.18);
}

.action-btn.unpublish {
  color: var(--juris-warning);
  background: rgba(249, 168, 37, 0.08);
}

.action-btn.unpublish:hover {
  background: rgba(249, 168, 37, 0.18);
}

.action-btn.edit {
  color: var(--juris-primary-light);
  background: var(--juris-primary-50);
}

.action-btn.edit:hover {
  background: var(--juris-primary-100);
  color: var(--juris-primary);
}

.action-btn.reject {
  color: var(--juris-danger);
  background: rgba(198, 40, 40, 0.06);
}

.action-btn.reject:hover {
  background: rgba(198, 40, 40, 0.14);
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--juris-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.w-full {
  width: 100%;
}

/* Purge Warning */
.purge-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  padding: 20px 0;
}

.purge-warning p {
  color: var(--juris-text-secondary);
  line-height: 1.6;
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

  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-header-actions {
    flex-direction: column;
  }
}
</style>
