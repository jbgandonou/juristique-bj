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
          <div class="folder-header-actions">
            <button class="btn-new-note hover-lift" @click="createNewNote">
              <FileEdit :size="18" />
              Nouvelle note
            </button>
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

          <!-- Notes Section -->
          <section class="section-card glass-card">
            <div class="section-header">
              <div class="section-title">
                <FileEdit :size="18" class="section-icon" />
                <h2>Notes</h2>
                <span class="count-badge">{{ editorNotes.length }}</span>
              </div>
              <button class="btn-add hover-lift" @click="createNewNote">
                <Plus :size="16" />
                Nouvelle note
              </button>
            </div>

            <div v-if="editorNotes.length" class="notes-list">
              <NuxtLink v-for="n in editorNotes" :key="n.id" :to="`/notes/${n.id}`" class="note-list-item card-hover">
                <div class="note-list-icon">📝</div>
                <div class="note-list-info">
                  <span class="note-list-title">{{ n.title || 'Note sans titre' }}</span>
                  <span class="note-list-preview">{{ n.contentText ? n.contentText.substring(0, 80) + '...' : 'Vide' }}</span>
                  <span class="note-list-date">{{ n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '' }}</span>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="empty-section">
              <FileEdit :size="32" class="empty-icon" />
              <p>Aucune note. Cliquez "Nouvelle note" pour commencer à rédiger.</p>
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
                  <span v-if="annotation.sticker" class="sticker">{{ annotation.sticker }}</span>
                  <span class="annotation-ref">
                    <MessageSquare :size="12" />
                    {{ annotation.articleRef || 'Note générale' }}
                  </span>
                  <span v-if="annotation.label" class="label-badge" :class="annotation.label">{{ labelOptions.find(l => l.value === annotation.label)?.text || annotation.label }}</span>
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
              <!-- Sticker picker -->
              <div class="form-group">
                <label class="form-label-sm">Sticker</label>
                <div class="sticker-picker">
                  <button
                    v-for="s in stickers"
                    :key="s"
                    type="button"
                    class="sticker-btn"
                    :class="{ active: newAnnotation.sticker === s }"
                    @click="newAnnotation.sticker = newAnnotation.sticker === s ? '' : s"
                  >{{ s }}</button>
                </div>
              </div>
              <!-- Label picker -->
              <div class="form-group">
                <label class="form-label-sm">Label</label>
                <div class="label-picker">
                  <button
                    v-for="lbl in labelOptions"
                    :key="lbl.value"
                    type="button"
                    class="label-picker-btn"
                    :class="[{ active: newAnnotation.label === lbl.value }, `lp-annot-${lbl.value}`]"
                    @click="newAnnotation.label = newAnnotation.label === lbl.value ? '' : lbl.value"
                  >{{ lbl.text }}</button>
                </div>
              </div>
              <!-- Reminder link -->
              <div class="reminder-link-row">
                <button type="button" class="btn-reminder-link hover-lift" @click="showReminderForm = !showReminderForm">
                  <Bell :size="14" />
                  {{ showReminderForm ? 'Masquer le rappel' : 'Ajouter un rappel' }}
                </button>
              </div>
              <!-- Inline reminder form -->
              <div v-if="showReminderForm" class="inline-reminder-form">
                <div class="form-group">
                  <input v-model="newAnnotationReminder.title" type="text" class="form-input" placeholder="Titre du rappel" />
                </div>
                <div class="form-group">
                  <input v-model="newAnnotationReminder.remindAt" type="datetime-local" class="form-input" />
                </div>
                <button
                  type="button"
                  class="btn-add-sm hover-lift"
                  :disabled="!newAnnotationReminder.title.trim() || !newAnnotationReminder.remindAt"
                  @click="addAnnotationReminder"
                >
                  <Bell :size="13" /> Créer le rappel
                </button>
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

          <!-- Pense-bêtes -->
          <div class="section-card glass-card">
            <StickyNotes :folder-id="folderId" />
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

      <!-- Add Text Modal — Search & Pick -->
      <div v-if="showAddTextModal" class="modal-overlay" @click.self="showAddTextModal = false">
        <div class="modal-card glass-card fade-in-up" style="max-width: 600px;">
          <h3>Ajouter un texte au dossier</h3>

          <!-- Search input -->
          <div class="form-group">
            <label>Rechercher un texte</label>
            <div class="search-input-wrap">
              <Search :size="18" class="search-input-icon" />
              <input
                v-model="textSearchQuery"
                type="text"
                class="form-input"
                style="padding-left: 40px;"
                placeholder="Tapez le titre d'une loi, décret, constitution..."
                @input="onTextSearch"
              />
            </div>
          </div>

          <!-- Loading -->
          <div v-if="textSearchLoading" style="text-align: center; padding: 16px;">
            <div class="skeleton" style="height: 48px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 48px; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 48px;"></div>
          </div>

          <!-- Search results -->
          <div v-else-if="textSearchResults.length" class="text-search-results">
            <div
              v-for="text in textSearchResults"
              :key="text.id"
              class="text-search-item"
              :class="{ 'already-added': isTextInFolder(text.id) }"
              @click="!isTextInFolder(text.id) && pickText(text)"
            >
              <div class="text-search-info">
                <span class="text-search-title">{{ text.title }}</span>
                <span class="text-search-meta">
                  {{ text.country?.name || '' }} · {{ text.textType || '' }} · {{ text.reference || '' }}
                </span>
              </div>
              <span v-if="isTextInFolder(text.id)" class="text-search-added">Déjà ajouté</span>
              <Plus v-else :size="18" class="text-search-add-icon" />
            </div>
          </div>

          <!-- No results -->
          <div v-else-if="textSearchQuery.length >= 2" class="text-search-empty">
            Aucun texte trouvé pour « {{ textSearchQuery }} »
          </div>

          <!-- Hint -->
          <div v-else class="text-search-hint">
            Tapez au moins 2 caractères pour rechercher
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="showAddTextModal = false; textSearchQuery = ''; textSearchResults = [];">Fermer</button>
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
import { FolderOpen, FileText, Users, Plus, X, Trash2, Share2, Edit3, MessageSquare, StickyNote, Bell, Search, FileEdit } from 'lucide-vue-next';
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
const editorNotes = ref<any[]>([]);

const editingName = ref(false);
const editName = ref('');

const showAddTextModal = ref(false);
const addTextId = ref('');
const textSearchQuery = ref('');
const textSearchResults = ref<any[]>([]);
const textSearchLoading = ref(false);
let searchTimeout: any = null;

const showDeleteConfirm = ref(false);

const editingAnnotation = ref<string | null>(null);
const editAnnotationContent = ref('');

const newAnnotation = ref({ content: '', articleRef: '', sticker: '', label: '' });
const newShare = ref({ email: '', permission: 'read' });

const showReminderForm = ref(false);
const newAnnotationReminder = ref({ title: '', remindAt: '' });

const stickers = ['⚠️', '✅', '📌', '🔥', '💡', '❓', '⏰', '📝', '🎯', '⭐', '🔍', '📋'];

const labelOptions = [
  { value: 'urgent', text: 'Urgent' },
  { value: 'a_relire', text: 'À relire' },
  { value: 'important', text: 'Important' },
  { value: 'en_cours', text: 'En cours' },
  { value: 'termine', text: 'Terminé' },
  { value: 'question', text: 'Question' },
];

onMounted(async () => {
  try {
    folder.value = await authFetch(`/folders/${folderId}`);
  } catch {
    folder.value = { id: folderId, name: 'Dossier', texts: [], shares: [], color: '#1A237E' };
  }
  try {
    annotations.value = await authFetch(`/annotations/by-folder/${folderId}`);
  } catch {
    annotations.value = [];
  }
  try {
    editorNotes.value = await authFetch(`/editor-notes/by-folder/${folderId}`);
  } catch {
    editorNotes.value = [];
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

// Cache all published texts for search
const allAvailableTexts = ref<any[]>([]);
const textsLoaded = ref(false);

const loadAllTexts = async () => {
  if (textsLoaded.value) return;
  textSearchLoading.value = true;
  try {
    const config = useRuntimeConfig();
    const res = await $fetch<any>(`${config.public.apiBaseUrl}/legal-texts`, {
      params: { limit: '200', status: 'published' },
    });
    allAvailableTexts.value = res?.data || [];
    textsLoaded.value = true;
  } catch {
    allAvailableTexts.value = [];
  } finally {
    textSearchLoading.value = false;
  }
};

const onTextSearch = () => {
  clearTimeout(searchTimeout);
  if (textSearchQuery.value.length < 2) {
    textSearchResults.value = [];
    return;
  }
  // Load texts on first search
  if (!textsLoaded.value) {
    loadAllTexts().then(() => filterTexts());
    return;
  }
  filterTexts();
};

const filterTexts = () => {
  const q = textSearchQuery.value.toLowerCase();
  textSearchResults.value = allAvailableTexts.value.filter((t: any) =>
    (t.title && t.title.toLowerCase().includes(q)) ||
    (t.reference && t.reference.toLowerCase().includes(q)) ||
    (t.country?.name && t.country.name.toLowerCase().includes(q))
  ).slice(0, 10);
};

const isTextInFolder = (textId: string) => {
  return folder.value.texts?.some((t: any) => t.id === textId);
};

const pickText = async (text: any) => {
  try {
    await authFetch(`/folders/${folderId}/texts`, { method: 'POST', body: { textId: text.id } });
    if (!folder.value.texts) folder.value.texts = [];
    folder.value.texts.push(text);
  } catch {
    // already added or error
  }
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
      body: {
        folderId,
        content: newAnnotation.value.content,
        articleRef: newAnnotation.value.articleRef,
        sticker: newAnnotation.value.sticker || undefined,
        label: newAnnotation.value.label || undefined,
      },
    });
    annotations.value.push(created);
  } catch {
    annotations.value.push({ id: Date.now().toString(), ...newAnnotation.value });
  }
  newAnnotation.value = { content: '', articleRef: '', sticker: '', label: '' };
  showReminderForm.value = false;
  newAnnotationReminder.value = { title: '', remindAt: '' };
};

const addAnnotationReminder = async () => {
  if (!newAnnotationReminder.value.title.trim() || !newAnnotationReminder.value.remindAt) return;
  try {
    await authFetch('/reminders', {
      method: 'POST',
      body: {
        title: newAnnotationReminder.value.title,
        remindAt: newAnnotationReminder.value.remindAt,
        folderId,
      },
    });
  } catch {
    // silently ignore — reminder is best-effort
  }
  showReminderForm.value = false;
  newAnnotationReminder.value = { title: '', remindAt: '' };
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

const createNewNote = async () => {
  try {
    const note = await authFetch<any>('/editor-notes', {
      method: 'POST',
      body: { title: 'Note sans titre', folderId },
    });
    router.push(`/notes/${note.id}`);
  } catch (e) {
    console.error(e);
  }
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

.folder-header-actions { margin-top: 16px; }
.btn-new-note { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-size: var(--font-sm); font-weight: 600; cursor: pointer; font-family: var(--font-family); }

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

.form-label-sm { font-size: var(--font-xs); font-weight: 600; color: var(--juris-text-secondary); display: block; margin-bottom: 4px; }

/* Label picker colors scoped to annotation form */
.lp-annot-urgent { color: var(--juris-danger); }
.lp-annot-a_relire { color: #E65100; }
.lp-annot-important { color: var(--juris-secondary-dark); }
.lp-annot-en_cours { color: var(--juris-info); }
.lp-annot-termine { color: var(--juris-success); }
.lp-annot-question { color: #7B1FA2; }
.label-picker-btn.active.lp-annot-urgent { background: rgba(198, 40, 40, 0.08); border-color: var(--juris-danger); }
.label-picker-btn.active.lp-annot-a_relire { background: rgba(249, 168, 37, 0.08); border-color: #E65100; }
.label-picker-btn.active.lp-annot-important { background: rgba(198, 148, 42, 0.08); border-color: var(--juris-secondary-dark); }
.label-picker-btn.active.lp-annot-en_cours { background: rgba(21, 101, 192, 0.08); border-color: var(--juris-info); }
.label-picker-btn.active.lp-annot-termine { background: rgba(46, 125, 50, 0.08); border-color: var(--juris-success); }
.label-picker-btn.active.lp-annot-question { background: rgba(123, 31, 162, 0.08); border-color: #7B1FA2; }

.reminder-link-row { margin-bottom: 10px; }
.btn-reminder-link { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: none; border: 1px dashed var(--juris-border); border-radius: 8px; font-size: var(--font-xs); font-weight: 600; color: var(--juris-primary-light); cursor: pointer; font-family: var(--font-family); transition: all 0.15s ease; }
.btn-reminder-link:hover { border-color: var(--juris-primary-lighter); background: var(--juris-primary-50); }

.inline-reminder-form { background: var(--juris-primary-50); border-radius: var(--radius-md); padding: 12px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; }
.btn-add-sm { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 7px; font-size: var(--font-xs); font-weight: 600; cursor: pointer; font-family: var(--font-family); }
.btn-add-sm:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 1024px) {
  .detail-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .folder-header-body { padding: 16px; }
  .folder-name-display h1 { font-size: var(--font-xl); }
}

/* Text search in add modal */
.search-input-wrap { position: relative; }
.search-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--juris-text-muted); pointer-events: none; }

.text-search-results { max-height: 320px; overflow-y: auto; border: 1px solid var(--juris-border-light); border-radius: var(--radius-md); margin-top: 8px; }

.text-search-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--juris-border-light); cursor: pointer; transition: background 0.15s; }
.text-search-item:last-child { border-bottom: none; }
.text-search-item:hover:not(.already-added) { background: var(--juris-primary-50); }
.text-search-item.already-added { opacity: 0.5; cursor: default; }

.text-search-info { flex: 1; min-width: 0; }
.text-search-title { display: block; font-size: var(--font-sm); font-weight: 600; color: var(--juris-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.text-search-meta { display: block; font-size: var(--font-xs); color: var(--juris-text-muted); margin-top: 2px; }

.text-search-added { font-size: var(--font-xs); color: var(--juris-text-muted); white-space: nowrap; margin-left: 12px; }
.text-search-add-icon { color: var(--juris-primary); flex-shrink: 0; margin-left: 12px; }

.text-search-empty, .text-search-hint { text-align: center; padding: 24px 16px; font-size: var(--font-sm); color: var(--juris-text-muted); }

/* Notes list */
.notes-list { display: flex; flex-direction: column; gap: 8px; }
.note-list-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: var(--juris-surface); border: 1px solid var(--juris-border-light); border-radius: var(--radius-md); text-decoration: none; color: inherit; transition: all 0.2s; }
.note-list-item:hover { border-color: var(--juris-primary-lighter); box-shadow: var(--shadow-sm); }
.note-list-icon { font-size: 1.3rem; flex-shrink: 0; margin-top: 2px; }
.note-list-info { flex: 1; min-width: 0; }
.note-list-title { display: block; font-size: var(--font-sm); font-weight: 600; color: var(--juris-text); margin-bottom: 2px; }
.note-list-preview { display: block; font-size: var(--font-xs); color: var(--juris-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.note-list-date { font-size: 0.65rem; color: var(--juris-text-muted); }
</style>
