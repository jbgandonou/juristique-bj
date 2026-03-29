<template>
  <div class="dossier-detail-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-state glass-card">
      <div class="skeleton" style="height: 32px; width: 40%; margin-bottom: 12px;"></div>
      <div class="skeleton" style="height: 16px; width: 60%;"></div>
    </div>

    <template v-else>
      <!-- Breadcrumb -->
      <nav class="breadcrumb fade-in-up">
        <NuxtLink to="/dossiers" class="breadcrumb-link">Mes dossiers</NuxtLink>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">{{ folder.name }}</span>
      </nav>

      <!-- Folder Header -->
      <header class="folder-header glass-card fade-in-up">
        <div class="folder-color-bar" :style="{ background: folder.color || 'var(--juris-primary)' }"></div>
        <div class="folder-header-body">
          <div class="folder-title-row">
            <FolderOpen :size="24" :style="{ color: folder.color || 'var(--juris-primary)' }" />
            <div v-if="!editingName" class="folder-name-display" @click="startEditName">
              <h1>{{ folder.name }}</h1>
              <Edit3 :size="16" class="edit-icon" />
            </div>
            <form v-else class="folder-name-form" @submit.prevent="saveName">
              <input v-model="editName" class="name-input" type="text" required autofocus @keydown.escape="editingName = false" />
              <button type="submit" class="btn-save-name">Enregistrer</button>
              <button type="button" class="btn-cancel-sm" @click="editingName = false">Annuler</button>
            </form>
          </div>
          <p v-if="folder.description" class="folder-description">{{ folder.description }}</p>
          <div class="folder-stats">
            <span class="stat-chip"><FileText :size="14" /> {{ folder.texts?.length || 0 }} textes</span>
            <span v-if="folder.shares?.length" class="stat-chip"><Users :size="14" /> {{ folder.shares.length }} partage(s)</span>
            <span v-if="folder.annotations?.length" class="stat-chip"><StickyNote :size="14" /> {{ folder.annotations.length }} annotation(s)</span>
          </div>
        </div>
      </header>

      <!-- Main content grid -->
      <div class="detail-grid fade-in-up stagger-2">

        <!-- Left: Texts + Annotations -->
        <div class="detail-main">

          <!-- Texts Section -->
          <section class="section-card glass-card">
            <div class="section-header">
              <div class="section-title">
                <FileText :size="18" class="section-icon" />
                <h2>Textes juridiques</h2>
                <span class="count-badge">{{ folder.texts?.length || 0 }}</span>
              </div>
              <button class="btn-add hover-lift" @click="showAddTextModal = true">
                <Plus :size="16" />
                Ajouter un texte
              </button>
            </div>

            <div v-if="folder.texts?.length" class="texts-list">
              <div v-for="text in folder.texts" :key="text.id" class="legal-text-card">
                <div class="card-header">
                  <div>
                    <NuxtLink :to="`/textes/${text.id}`" class="card-title">{{ text.title }}</NuxtLink>
                    <div class="card-meta">
                      <span class="meta-item">{{ text.reference }}</span>
                      <span v-if="text.country" class="meta-item">{{ text.country?.name }}</span>
                      <span v-if="text.textType" class="meta-item">{{ text.textType }}</span>
                    </div>
                  </div>
                  <button class="btn-remove hover-lift" :title="'Retirer du dossier'" @click="removeText(text.id)">
                    <X :size="16" />
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="empty-section">
              <FileText :size="32" class="empty-icon" />
              <p>Aucun texte dans ce dossier.</p>
            </div>
          </section>

          <!-- Annotations Section -->
          <section class="section-card glass-card">
            <div class="section-header">
              <div class="section-title">
                <StickyNote :size="18" class="section-icon" />
                <h2>Annotations</h2>
                <span class="count-badge">{{ annotations.length }}</span>
              </div>
            </div>

            <div v-if="annotations.length" class="annotations-list">
              <div v-for="annotation in annotations" :key="annotation.id" class="annotation-card">
                <div class="annotation-meta">
                  <span class="annotation-ref">
                    <MessageSquare :size="12" />
                    {{ annotation.articleRef || 'Note générale' }}
                  </span>
                  <span v-if="annotation.textTitle" class="annotation-text-ref">{{ annotation.textTitle }}</span>
                  <button class="btn-icon-danger hover-lift" @click="deleteAnnotationItem(annotation.id)">
                    <Trash2 :size="14" />
                  </button>
                </div>
                <div v-if="editingAnnotation === annotation.id" class="annotation-edit">
                  <textarea v-model="editAnnotationContent" class="form-input" rows="3"></textarea>
                  <div class="annotation-edit-actions">
                    <button class="btn-cancel-sm" @click="editingAnnotation = null">Annuler</button>
                    <button class="btn-submit-sm" @click="saveAnnotation(annotation.id)">Enregistrer</button>
                  </div>
                </div>
                <p v-else class="annotation-content" @click="startEditAnnotation(annotation)">{{ annotation.content }}</p>
                <div class="annotation-color-dot" :style="{ background: annotation.color || 'var(--juris-primary)' }"></div>
              </div>
            </div>

            <!-- Add new annotation -->
            <div class="add-annotation-form">
              <h4>Nouvelle annotation</h4>
              <div class="form-group">
                <input v-model="newAnnotation.articleRef" type="text" class="form-input" placeholder="Référence article (ex: Art. 5)" />
              </div>
              <div class="form-group">
                <textarea v-model="newAnnotation.content" class="form-input" rows="3" placeholder="Votre annotation..."></textarea>
              </div>
              <button class="btn-add hover-lift" :disabled="!newAnnotation.content.trim()" @click="addAnnotation">
                <Plus :size="16" /> Ajouter l'annotation
              </button>
            </div>
          </section>

        </div>

        <!-- Right: Sharing + Danger zone -->
        <aside class="detail-sidebar">

          <!-- Sharing Section -->
          <div class="section-card glass-card">
            <div class="section-header">
              <div class="section-title">
                <Share2 :size="18" class="section-icon" />
                <h2>Partage</h2>
              </div>
            </div>

            <div v-if="folder.shares?.length" class="shares-list">
              <div v-for="share in folder.shares" :key="share.id" class="share-item">
                <div class="share-user">
                  <div class="share-avatar">{{ share.email?.[0]?.toUpperCase() }}</div>
                  <div class="share-info">
                    <span class="share-email">{{ share.email }}</span>
                    <span class="share-permission status-badge" :class="share.permission === 'write' ? 'in-force' : 'pending'">
                      {{ share.permission === 'write' ? 'Éditeur' : 'Lecteur' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="empty-text">Aucun partage actif.</p>

            <!-- Add share -->
            <div class="add-share-form">
              <h4>Partager avec</h4>
              <div class="form-group">
                <input v-model="newShare.email" type="email" class="form-input" placeholder="adresse@email.com" />
              </div>
              <div class="form-group">
                <select v-model="newShare.permission" class="form-input form-select">
                  <option value="read">Lecteur (lecture seule)</option>
                  <option value="write">Éditeur (lecture + écriture)</option>
                </select>
              </div>
              <button class="btn-add hover-lift" :disabled="!newShare.email.trim()" @click="addShare">
                <Share2 :size="16" /> Partager
              </button>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="section-card danger-card glass-card">
            <div class="section-header">
              <div class="section-title">
                <Trash2 :size="18" class="section-icon danger-icon" />
                <h2 class="danger-title">Zone de danger</h2>
              </div>
            </div>
            <p class="danger-description">La suppression du dossier est irréversible. Les textes ne seront pas supprimés.</p>
            <button class="btn-danger hover-lift" @click="confirmDelete">
              <Trash2 :size="16" />
              Supprimer ce dossier
            </button>
          </div>

        </aside>
      </div>

      <!-- Add Text Modal -->
      <div v-if="showAddTextModal" class="modal-overlay" @click.self="showAddTextModal = false">
        <div class="modal-card glass-card fade-in-up">
          <h3>Ajouter un texte au dossier</h3>
          <div class="form-group">
            <label>Identifiant du texte</label>
            <input v-model="addTextId" type="text" class="form-input" placeholder="ID ou référence du texte" />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showAddTextModal = false">Annuler</button>
            <button class="btn-submit" :disabled="!addTextId.trim()" @click="handleAddText">Ajouter</button>
          </div>
        </div>
      </div>

      <!-- Delete confirmation modal -->
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-card glass-card fade-in-up">
          <h3>Supprimer le dossier ?</h3>
          <p class="modal-warning">Cette action est irréversible. Le dossier « {{ folder.name }} » sera définitivement supprimé.</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showDeleteConfirm = false">Annuler</button>
            <button class="btn-danger" @click="handleDelete">Supprimer</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { FolderOpen, FileText, Users, Plus, X, Trash2, Share2, Edit3, MessageSquare, StickyNote } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const { authFetch } = useAuth();

const folderId = route.params.id as string;
const loading = ref(true);
const folder = ref<any>({ name: '', texts: [], shares: [], annotations: [] });
const annotations = ref<any[]>([]);

const editingName = ref(false);
const editName = ref('');

const showAddTextModal = ref(false);
const addTextId = ref('');

const showDeleteConfirm = ref(false);

const editingAnnotation = ref<string | null>(null);
const editAnnotationContent = ref('');

const newAnnotation = ref({ content: '', articleRef: '' });
const newShare = ref({ email: '', permission: 'read' });

onMounted(async () => {
  try {
    folder.value = await authFetch(`/folders/${folderId}`);
  } catch {
    folder.value = { id: folderId, name: 'Dossier', texts: [], shares: [], color: '#1A237E' };
  }
  try {
    annotations.value = await authFetch(`/annotations?folderId=${folderId}`);
  } catch {
    annotations.value = [];
  }
  loading.value = false;
});

const startEditName = () => {
  editName.value = folder.value.name;
  editingName.value = true;
};

const saveName = async () => {
  try {
    const updated = await authFetch(`/folders/${folderId}`, { method: 'PATCH', body: { name: editName.value } });
    folder.value.name = updated.name ?? editName.value;
  } catch {
    folder.value.name = editName.value;
  }
  editingName.value = false;
};

const removeText = async (textId: string) => {
  try {
    await authFetch(`/folders/${folderId}/texts/${textId}`, { method: 'DELETE' });
  } catch {
    // ignore
  }
  folder.value.texts = folder.value.texts.filter((t: any) => t.id !== textId);
};

const handleAddText = async () => {
  try {
    const result = await authFetch(`/folders/${folderId}/texts`, { method: 'POST', body: { textId: addTextId.value } });
    folder.value.texts = folder.value.texts || [];
    folder.value.texts.push(result.text ?? { id: addTextId.value, title: addTextId.value, reference: addTextId.value });
  } catch {
    // ignore
  }
  showAddTextModal.value = false;
  addTextId.value = '';
};

const startEditAnnotation = (annotation: any) => {
  editingAnnotation.value = annotation.id;
  editAnnotationContent.value = annotation.content;
};

const saveAnnotation = async (id: string) => {
  try {
    await authFetch(`/annotations/${id}`, { method: 'PATCH', body: { content: editAnnotationContent.value } });
    const a = annotations.value.find((x) => x.id === id);
    if (a) a.content = editAnnotationContent.value;
  } catch {
    const a = annotations.value.find((x) => x.id === id);
    if (a) a.content = editAnnotationContent.value;
  }
  editingAnnotation.value = null;
};

const deleteAnnotationItem = async (id: string) => {
  try {
    await authFetch(`/annotations/${id}`, { method: 'DELETE' });
  } catch {
    // ignore
  }
  annotations.value = annotations.value.filter((a) => a.id !== id);
};

const addAnnotation = async () => {
  if (!newAnnotation.value.content.trim()) return;
  try {
    const created = await authFetch('/annotations', {
      method: 'POST',
      body: { folderId, content: newAnnotation.value.content, articleRef: newAnnotation.value.articleRef },
    });
    annotations.value.push(created);
  } catch {
    annotations.value.push({ id: Date.now().toString(), ...newAnnotation.value });
  }
  newAnnotation.value = { content: '', articleRef: '' };
};

const addShare = async () => {
  if (!newShare.value.email.trim()) return;
  try {
    const created = await authFetch(`/folders/${folderId}/shares`, {
      method: 'POST',
      body: { email: newShare.value.email, permission: newShare.value.permission },
    });
    folder.value.shares = folder.value.shares || [];
    folder.value.shares.push(created);
  } catch {
    folder.value.shares = folder.value.shares || [];
    folder.value.shares.push({ id: Date.now().toString(), ...newShare.value });
  }
  newShare.value = { email: '', permission: 'read' };
};

const confirmDelete = () => {
  showDeleteConfirm.value = true;
};

const handleDelete = async () => {
  try {
    await authFetch(`/folders/${folderId}`, { method: 'DELETE' });
  } catch {
    // ignore
  }
  router.push('/dossiers');
};
</script>

<style scoped>
.dossier-detail-page { display: flex; flex-direction: column; gap: 24px; }

.loading-state { padding: 32px; }

.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: var(--font-sm); }
.breadcrumb-link { color: var(--juris-primary-light); }
.breadcrumb-link:hover { color: var(--juris-primary); }
.breadcrumb-sep { color: var(--juris-text-muted); }
.breadcrumb-current { color: var(--juris-text-secondary); }

.folder-header { overflow: hidden; }
.folder-color-bar { height: 5px; }
.folder-header-body { padding: 24px; }

.folder-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.folder-name-display { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.folder-name-display h1 { font-size: var(--font-2xl); font-weight: 700; color: var(--juris-text); }
.edit-icon { color: var(--juris-text-muted); opacity: 0; transition: opacity 0.2s; }
.folder-name-display:hover .edit-icon { opacity: 1; }

.folder-name-form { display: flex; align-items: center; gap: 8px; flex: 1; }
.name-input { flex: 1; padding: 8px 12px; border: 1px solid var(--juris-border); border-radius: 8px; font-size: var(--font-xl); font-weight: 700; font-family: var(--font-family); outline: none; }
.name-input:focus { border-color: var(--juris-primary-lighter); }
.btn-save-name { padding: 8px 16px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 8px; font-size: var(--font-sm); font-weight: 600; cursor: pointer; font-family: var(--font-family); }
.btn-cancel-sm { padding: 8px 12px; background: none; border: 1px solid var(--juris-border); border-radius: 8px; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }

.folder-description { font-size: var(--font-sm); color: var(--juris-text-secondary); margin-bottom: 12px; }
.folder-stats { display: flex; gap: 12px; flex-wrap: wrap; }
.stat-chip { display: flex; align-items: center; gap: 4px; font-size: var(--font-xs); color: var(--juris-text-muted); background: var(--juris-primary-50); padding: 4px 10px; border-radius: var(--radius-full); }

.detail-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }

.detail-main { display: flex; flex-direction: column; gap: 20px; }
.detail-sidebar { display: flex; flex-direction: column; gap: 20px; }

.section-card { overflow: hidden; }
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 20px 16px; border-bottom: 1px solid var(--juris-border-light); }
.section-title { display: flex; align-items: center; gap: 8px; }
.section-title h2 { font-size: var(--font-base); font-weight: 600; color: var(--juris-text); }
.section-icon { color: var(--juris-primary); }
.count-badge { background: var(--juris-primary-50); color: var(--juris-primary); font-size: var(--font-xs); font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); }

.btn-add { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 8px; font-size: var(--font-sm); font-weight: 600; cursor: pointer; font-family: var(--font-family); }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

.texts-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.legal-text-card { padding: 16px; }
.legal-text-card .card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.card-title { font-size: var(--font-sm); font-weight: 600; color: var(--juris-text); line-height: 1.4; }
.card-title:hover { color: var(--juris-primary); }
.card-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.meta-item { font-size: var(--font-xs); color: var(--juris-text-secondary); }
.btn-remove { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; color: var(--juris-text-muted); cursor: pointer; border-radius: 6px; flex-shrink: 0; }
.btn-remove:hover { background: rgba(198, 40, 40, 0.08); color: var(--juris-danger); }

.empty-section { padding: 32px; text-align: center; }
.empty-icon { color: var(--juris-text-muted); margin-bottom: 8px; }
.empty-section p { font-size: var(--font-sm); color: var(--juris-text-secondary); }

.annotations-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.annotation-card { background: var(--juris-primary-50); border-radius: var(--radius-md); padding: 14px; position: relative; }
.annotation-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.annotation-ref { display: flex; align-items: center; gap: 4px; font-size: var(--font-xs); font-weight: 600; color: var(--juris-primary); }
.annotation-text-ref { font-size: var(--font-xs); color: var(--juris-text-secondary); }
.btn-icon-danger { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; background: transparent; color: var(--juris-text-muted); cursor: pointer; border-radius: 4px; margin-left: auto; }
.btn-icon-danger:hover { background: rgba(198, 40, 40, 0.1); color: var(--juris-danger); }
.annotation-content { font-size: var(--font-sm); color: var(--juris-text); line-height: 1.5; cursor: text; }
.annotation-color-dot { position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%; }
.annotation-edit { margin-top: 8px; }
.annotation-edit-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.btn-submit-sm { padding: 6px 14px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 6px; font-size: var(--font-xs); font-weight: 600; cursor: pointer; font-family: var(--font-family); }

.add-annotation-form { padding: 16px; border-top: 1px solid var(--juris-border-light); }
.add-annotation-form h4 { font-size: var(--font-sm); font-weight: 600; margin-bottom: 12px; color: var(--juris-text); }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.form-input { width: 100%; padding: 10px 14px; border: 1px solid var(--juris-border); border-radius: 8px; font-size: var(--font-sm); font-family: var(--font-family); outline: none; background: var(--juris-surface); }
.form-input:focus { border-color: var(--juris-primary-lighter); box-shadow: 0 0 0 3px var(--juris-primary-100); }
textarea.form-input { resize: vertical; }
.form-select { cursor: pointer; }

.shares-list { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.share-item { display: flex; align-items: center; justify-content: space-between; }
.share-user { display: flex; align-items: center; gap: 10px; }
.share-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--juris-gradient-primary); color: white; font-size: var(--font-xs); font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.share-info { display: flex; flex-direction: column; gap: 4px; }
.share-email { font-size: var(--font-sm); color: var(--juris-text); }
.share-permission { font-size: var(--font-xs); }
.empty-text { padding: 16px; font-size: var(--font-sm); color: var(--juris-text-secondary); }

.add-share-form { padding: 16px; border-top: 1px solid var(--juris-border-light); }
.add-share-form h4 { font-size: var(--font-sm); font-weight: 600; margin-bottom: 12px; color: var(--juris-text); }

.danger-card { border: 1px solid rgba(198, 40, 40, 0.2); }
.danger-icon { color: var(--juris-danger) !important; }
.danger-title { color: var(--juris-danger) !important; }
.danger-description { padding: 0 20px 16px; font-size: var(--font-sm); color: var(--juris-text-secondary); line-height: 1.5; }
.btn-danger { display: flex; align-items: center; gap: 8px; margin: 0 20px 20px; padding: 10px 20px; background: rgba(198, 40, 40, 0.08); color: var(--juris-danger); border: 1px solid rgba(198, 40, 40, 0.3); border-radius: 8px; font-size: var(--font-sm); font-weight: 600; cursor: pointer; font-family: var(--font-family); }
.btn-danger:hover { background: rgba(198, 40, 40, 0.15); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-card { padding: 32px; max-width: 480px; width: 100%; }
.modal-card h3 { font-size: var(--font-lg); font-weight: 700; margin-bottom: 20px; }
.modal-warning { font-size: var(--font-sm); color: var(--juris-text-secondary); margin-bottom: 24px; line-height: 1.5; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel { padding: 10px 20px; background: none; border: 1px solid var(--juris-border); border-radius: 10px; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }
.btn-submit { padding: 10px 20px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 1024px) {
  .detail-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .folder-header-body { padding: 16px; }
  .folder-name-display h1 { font-size: var(--font-xl); }
}
</style>
