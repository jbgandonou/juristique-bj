<template>
  <PremiumGate title="Espace de travail" description="Organisez vos textes juridiques dans des dossiers personnels.">
    <div class="dossiers-page">
      <div class="page-header">
        <div>
          <h1 class="gradient-text">Mes dossiers</h1>
          <p class="subtitle">Organisez vos textes juridiques par affaire ou par sujet</p>
        </div>
        <button class="btn-create hover-lift" @click="showCreateModal = true">
          <Plus :size="18" />
          Nouveau dossier
        </button>
      </div>

      <!-- Create Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-card glass-card fade-in-up">
          <h3>Nouveau dossier</h3>
          <form @submit.prevent="handleCreate">
            <div class="form-group">
              <label>Nom du dossier</label>
              <input v-model="newFolder.name" type="text" class="form-input" placeholder="Ex: Affaire Client X" required />
            </div>
            <div class="form-group">
              <label>Description (optionnel)</label>
              <textarea v-model="newFolder.description" class="form-input" rows="3" placeholder="Notes sur ce dossier..."></textarea>
            </div>
            <div class="form-group">
              <label>Couleur</label>
              <div class="color-picker">
                <button v-for="c in colors" :key="c" type="button" class="color-dot" :class="{ active: newFolder.color === c }" :style="{ background: c }" @click="newFolder.color = c"></button>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showCreateModal = false">Annuler</button>
              <button type="submit" class="btn-submit">Créer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Folders Grid -->
      <div v-if="folders.length" class="folders-grid">
        <NuxtLink v-for="folder in folders" :key="folder.id" :to="`/dossiers/${folder.id}`" class="folder-card card-hover">
          <div class="folder-color-bar" :style="{ background: folder.color || 'var(--juris-primary)' }"></div>
          <div class="folder-content">
            <div class="folder-header">
              <FolderOpen :size="20" :style="{ color: folder.color || 'var(--juris-primary)' }" />
              <h3>{{ folder.name }}</h3>
            </div>
            <p v-if="folder.description" class="folder-desc">{{ folder.description }}</p>
            <div class="folder-meta">
              <span class="meta-item"><FileText :size="14" /> {{ folder.texts?.length || 0 }} textes</span>
              <span v-if="folder.isShared" class="meta-item"><Users :size="14" /> Partagé</span>
              <span v-if="folder._sharedPermission" class="status-badge pending">{{ folder._sharedPermission }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state glass-card">
        <FolderPlus :size="48" class="empty-icon" />
        <h3>Aucun dossier</h3>
        <p>Créez votre premier dossier pour organiser vos textes juridiques.</p>
        <button class="btn-create hover-lift" @click="showCreateModal = true">
          <Plus :size="18" /> Créer un dossier
        </button>
      </div>
    </div>

    <template #preview>
      <div class="folders-grid">
        <div v-for="i in 4" :key="i" class="folder-card">
          <div class="folder-color-bar" style="background: var(--juris-primary)"></div>
          <div class="folder-content">
            <div class="skeleton" style="height: 20px; width: 60%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 14px; width: 40%;"></div>
          </div>
        </div>
      </div>
    </template>
  </PremiumGate>
</template>

<script setup lang="ts">
import { FolderOpen, FolderPlus, FileText, Users, Plus } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';

definePageMeta({ middleware: 'auth' });

const { authFetch } = useAuth();
const folders = ref<any[]>([]);
const showCreateModal = ref(false);
const newFolder = ref({ name: '', description: '', color: '#1A237E' });
const colors = ['#1A237E', '#C6942A', '#00897B', '#C62828', '#2E7D32', '#1565C0', '#F9A825', '#7B1FA2'];

onMounted(async () => {
  try {
    folders.value = await authFetch('/folders');
  } catch {
    // Mock data
    folders.value = [];
  }
});

const handleCreate = async () => {
  try {
    const created = await authFetch('/folders', { method: 'POST', body: newFolder.value });
    folders.value.unshift(created);
    showCreateModal.value = false;
    newFolder.value = { name: '', description: '', color: '#1A237E' };
  } catch (e) {
    console.error('Failed to create folder', e);
  }
};
</script>

<style scoped>
.dossiers-page { display: flex; flex-direction: column; gap: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-header h1 { font-size: var(--font-2xl); font-weight: 700; }
.subtitle { color: var(--juris-text-secondary); font-size: var(--font-sm); margin-top: 4px; }

.btn-create { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }

.folders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

.folder-card { background: var(--juris-surface); border: 1px solid var(--juris-border-light); border-radius: var(--radius-lg); overflow: hidden; text-decoration: none; color: inherit; }
.folder-color-bar { height: 4px; }
.folder-content { padding: 20px; }
.folder-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.folder-header h3 { font-size: var(--font-base); font-weight: 600; color: var(--juris-text); }
.folder-desc { font-size: var(--font-xs); color: var(--juris-text-secondary); margin-bottom: 12px; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.folder-meta { display: flex; gap: 16px; align-items: center; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: var(--font-xs); color: var(--juris-text-muted); }

.empty-state { text-align: center; padding: 48px 32px; }
.empty-icon { color: var(--juris-text-muted); margin-bottom: 16px; }
.empty-state h3 { font-size: var(--font-lg); font-weight: 600; margin-bottom: 8px; }
.empty-state p { font-size: var(--font-sm); color: var(--juris-text-secondary); margin-bottom: 20px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-card { padding: 32px; max-width: 480px; width: 100%; }
.modal-card h3 { font-size: var(--font-lg); font-weight: 700; margin-bottom: 24px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-group label { font-size: var(--font-sm); font-weight: 500; }
.form-input { width: 100%; padding: 12px 16px; border: 1px solid var(--juris-border); border-radius: 10px; font-size: var(--font-sm); font-family: var(--font-family); outline: none; }
.form-input:focus { border-color: var(--juris-primary-lighter); box-shadow: 0 0 0 3px var(--juris-primary-100); }
textarea.form-input { resize: vertical; }
.color-picker { display: flex; gap: 8px; }
.color-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.color-dot.active { border-color: var(--juris-text); box-shadow: 0 0 0 2px white inset; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.btn-cancel { padding: 10px 20px; background: none; border: 1px solid var(--juris-border); border-radius: 10px; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }
.btn-submit { padding: 10px 20px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }

@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 16px; }
  .folders-grid { grid-template-columns: 1fr; }
}
</style>
