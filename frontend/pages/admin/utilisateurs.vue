<template>
  <div class="users-page">
    <!-- Page Header -->
    <div class="page-header fade-in-up">
      <div class="page-header-left">
        <h2 class="page-title">Utilisateurs</h2>
        <span class="count-badge">{{ stats.total }} utilisateurs</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row fade-in-up stagger-1">
      <div class="stat-mini glass-card">
        <span class="stat-mini-value">{{ stats.total }}</span>
        <span class="stat-mini-label">Total</span>
      </div>
      <div class="stat-mini glass-card">
        <span class="stat-mini-value stat-admin">{{ stats.admins }}</span>
        <span class="stat-mini-label">Admins</span>
      </div>
      <div class="stat-mini glass-card">
        <span class="stat-mini-value stat-editor">{{ stats.editors }}</span>
        <span class="stat-mini-label">Editeurs</span>
      </div>
      <div class="stat-mini glass-card">
        <span class="stat-mini-value stat-premium">{{ stats.premium }}</span>
        <span class="stat-mini-label">Premium</span>
      </div>
      <div class="stat-mini glass-card">
        <span class="stat-mini-value">{{ stats.free }}</span>
        <span class="stat-mini-label">Gratuit</span>
      </div>
      <div class="stat-mini glass-card">
        <span class="stat-mini-value stat-verified">{{ stats.verified }}</span>
        <span class="stat-mini-label">Verifies</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar glass-card fade-in-up stagger-1">
      <div class="filter-group">
        <label class="filter-label">Role</label>
        <select v-model="filterRole" class="filter-select">
          <option value="">Tous</option>
          <option value="admin">Admin</option>
          <option value="editor">Editeur</option>
          <option value="premium">Premium</option>
          <option value="free">Gratuit</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Recherche</label>
        <input v-model="searchQuery" type="text" placeholder="Nom ou email..." class="filter-input" />
      </div>
      <button class="filter-reset" @click="resetFilters">
        <X :size="14" />
        Reinitialiser
      </button>
    </div>

    <!-- Users Table -->
    <div class="table-card glass-card fade-in-up stagger-2">
      <div v-if="loading" class="loading-state">
        <p>Chargement des utilisateurs...</p>
      </div>
      <DataTable
        v-else
        :value="filteredUsers"
        :row-hover="true"
        paginator
        :rows="15"
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        class="juris-table"
      >
        <Column field="fullName" header="Nom" style="min-width: 200px;">
          <template #body="{ data }">
            <div class="user-cell">
              <div class="user-avatar-small">{{ data.fullName?.substring(0, 2).toUpperCase() }}</div>
              <div>
                <span class="user-name">{{ data.fullName }}</span>
                <span class="user-email">{{ data.email }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column field="role" header="Role" style="min-width: 120px;">
          <template #body="{ data }">
            <Tag :value="roleLabel(data.role)" :severity="roleSeverity(data.role)" rounded />
          </template>
        </Column>

        <Column field="profession" header="Profession" style="min-width: 140px;">
          <template #body="{ data }">
            <span>{{ data.profession || '—' }}</span>
          </template>
        </Column>

        <Column field="isVerified" header="Verifie" style="min-width: 100px;">
          <template #body="{ data }">
            <Tag :value="data.isVerified ? 'Oui' : 'Non'" :severity="data.isVerified ? 'success' : 'secondary'" rounded />
          </template>
        </Column>

        <Column field="createdAt" header="Inscription" style="min-width: 130px;">
          <template #body="{ data }">
            {{ data.createdAt ? new Date(data.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }}
          </template>
        </Column>

        <Column header="Actions" style="min-width: 180px;">
          <template #body="{ data }">
            <div class="row-actions">
              <select
                :value="data.role"
                class="role-select"
                @change="changeRole(data, ($event.target as HTMLSelectElement).value)"
              >
                <option value="free">Gratuit</option>
                <option value="premium">Premium</option>
                <option value="editor">Editeur</option>
                <option value="admin">Admin</option>
              </select>
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

    <!-- Delete Confirmation -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmer la suppression"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <p>Supprimer l'utilisateur <strong>{{ userToDelete?.fullName }}</strong> ({{ userToDelete?.email }}) ?</p>
      <template #footer>
        <Button label="Annuler" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="Supprimer" severity="danger" icon="pi pi-trash" @click="executeDelete" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { X, Trash2 } from 'lucide-vue-next';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const { getUsers, getUserStats, updateUserRole, deleteUser } = useApi();

const loading = ref(true);
const users = ref<any[]>([]);
const stats = ref({ total: 0, admins: 0, editors: 0, premium: 0, free: 0, verified: 0 });
const filterRole = ref('');
const searchQuery = ref('');
const showDeleteDialog = ref(false);
const userToDelete = ref<any>(null);

const filteredUsers = computed(() =>
  users.value.filter((u) => {
    if (filterRole.value && u.role !== filterRole.value) return false;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      if (!u.fullName?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  }),
);

const resetFilters = () => {
  filterRole.value = '';
  searchQuery.value = '';
};

const loadData = async () => {
  loading.value = true;
  try {
    const [usersRes, statsRes] = await Promise.all([getUsers(), getUserStats()]);
    users.value = usersRes.data || [];
    stats.value = statsRes;
  } catch (e) {
    console.error('Failed to load users', e);
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const roleLabel = (r: string) =>
  ({ admin: 'Admin', editor: 'Editeur', premium: 'Premium', free: 'Gratuit' }[r] ?? r);

const roleSeverity = (r: string) =>
  ({ admin: 'danger', editor: 'warn', premium: 'info', free: 'secondary' }[r] ?? 'secondary');

const changeRole = async (data: any, newRole: string) => {
  try {
    await updateUserRole(data.id, newRole);
    data.role = newRole;
  } catch (e) {
    console.error('Failed to update role', e);
  }
};

const confirmDelete = (data: any) => {
  userToDelete.value = data;
  showDeleteDialog.value = true;
};

const executeDelete = async () => {
  if (!userToDelete.value) return;
  try {
    await deleteUser(userToDelete.value.id);
    showDeleteDialog.value = false;
    await loadData();
  } catch (e) {
    console.error('Failed to delete user', e);
  }
};
</script>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

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

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.stat-mini {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-mini-value {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
}

.stat-mini-value.stat-admin { color: var(--juris-danger); }
.stat-mini-value.stat-editor { color: var(--juris-warning); }
.stat-mini-value.stat-premium { color: var(--juris-primary); }
.stat-mini-value.stat-verified { color: var(--juris-success); }

.stat-mini-label {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  font-weight: 600;
  text-transform: uppercase;
}

/* Filters */
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

/* User cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  background: var(--juris-gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.user-name {
  display: block;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-text);
}

.user-email {
  display: block;
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

/* Role select */
.role-select {
  padding: 4px 8px;
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-md);
  font-size: var(--font-xs);
  background: var(--juris-surface);
  cursor: pointer;
}

/* Actions */
.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

.action-btn.reject {
  color: var(--juris-danger);
  background: rgba(198, 40, 40, 0.06);
}

.action-btn.reject:hover {
  background: rgba(198, 40, 40, 0.14);
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
