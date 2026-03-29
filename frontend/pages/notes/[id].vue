<template>
  <div class="note-editor-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton" style="height: 40px; width: 50%; margin-bottom: 24px;"></div>
      <div class="skeleton" style="height: 400px; width: 100%;"></div>
    </div>

    <template v-else>
      <div class="note-header fade-in-up">
        <div class="note-nav">
          <NuxtLink v-if="note.folderId" :to="`/dossiers/${note.folderId}`" class="back-link">
            <ArrowLeft :size="16" />
            Retour au dossier
          </NuxtLink>
          <NuxtLink v-else to="/dossiers" class="back-link">
            <ArrowLeft :size="16" />
            Mes dossiers
          </NuxtLink>

          <div class="note-header-actions">
            <button class="btn-save hover-lift" @click="manualSave" :disabled="saving">
              <Save :size="16" />
              {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
            </button>
          </div>
        </div>

        <input
          v-model="note.title"
          type="text"
          class="note-title-input"
          placeholder="Titre de la note..."
          @blur="debounceSave"
        />
      </div>

      <div class="note-editor-wrap fade-in-up stagger-2">
        <CraftEditor
          ref="editorRef"
          :model-value="note.content"
          placeholder="Commencez à rédiger votre analyse, mémoire ou notes..."
          @update:model-value="onContentChange"
          @update:html="onHtmlChange"
          @update:text="onTextChange"
        />
      </div>

      <div class="note-actions fade-in-up stagger-3">
        <div class="note-actions-left">
          <span class="last-saved" v-if="lastSavedAt">
            Dernière sauvegarde : {{ lastSavedAt }}
          </span>
        </div>
        <button class="btn-delete-note" @click="handleDelete">
          <Trash2 :size="16" />
          Supprimer
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Save, Trash2 } from 'lucide-vue-next';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const { authFetch } = useAuth();

const noteId = route.params.id as string;
const note = ref<any>({ title: '', content: '', contentHtml: '', contentText: '', folderId: null });
const loading = ref(true);
const saving = ref(false);
const lastSavedAt = ref('');
const editorRef = ref<any>(null);
let saveTimeout: any = null;
let contentChanged = false;

onMounted(async () => {
  try {
    const data = await authFetch(`/editor-notes/${noteId}`);
    note.value = data;
  } catch {
    note.value = { title: 'Nouvelle note', content: '', folderId: null };
  }
  loading.value = false;
});

const onContentChange = (val: string) => {
  note.value.content = val;
  contentChanged = true;
  debounceSave();
};

const onHtmlChange = (val: string) => {
  note.value.contentHtml = val;
};

const onTextChange = (val: string) => {
  note.value.contentText = val;
};

const debounceSave = () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(autoSave, 3000);
};

const autoSave = async () => {
  if (!contentChanged && !note.value.title) return;
  await doSave();
};

const manualSave = async () => {
  await doSave();
};

const doSave = async () => {
  saving.value = true;
  try {
    await authFetch(`/editor-notes/${noteId}`, {
      method: 'PATCH',
      body: {
        title: note.value.title,
        content: note.value.content,
        contentHtml: note.value.contentHtml,
        contentText: note.value.contentText,
      },
    });
    contentChanged = false;
    lastSavedAt.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    editorRef.value?.markSaved?.();
  } catch {
    editorRef.value?.markError?.();
  } finally {
    saving.value = false;
  }
};

// Save before leaving
onBeforeUnmount(() => {
  clearTimeout(saveTimeout);
  if (contentChanged) {
    doSave();
  }
});

const handleDelete = async () => {
  if (!confirm('Supprimer cette note définitivement ?')) return;
  try {
    await authFetch(`/editor-notes/${noteId}`, { method: 'DELETE' });
    router.push(note.value.folderId ? `/dossiers/${note.value.folderId}` : '/dossiers');
  } catch {
    // ignore
  }
};
</script>

<style scoped>
.note-editor-page { max-width: 860px; margin: 0 auto; padding: 0 16px; }

.loading-state { padding: 40px 0; }

.note-header { margin-bottom: 20px; }

.note-nav { display: flex; align-items: center; justify-content: space-between; }

.back-link { display: flex; align-items: center; gap: 6px; font-size: var(--font-sm); color: var(--juris-primary-light); }

.note-header-actions { display: flex; gap: 8px; }

.btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 18px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.note-title-input { width: 100%; border: none; font-size: var(--font-2xl); font-weight: 700; font-family: var(--font-family); color: var(--juris-text); outline: none; padding: 16px 0 8px; background: transparent; }
.note-title-input::placeholder { color: var(--juris-text-muted); }

.note-editor-wrap { margin-bottom: 20px; }

.note-actions { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }

.note-actions-left { display: flex; align-items: center; gap: 12px; }

.last-saved { font-size: var(--font-xs); color: var(--juris-text-muted); }

.btn-delete-note { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: none; border: 1px solid var(--juris-border); color: var(--juris-text-muted); border-radius: 10px; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); transition: all 0.15s; }
.btn-delete-note:hover { border-color: var(--juris-danger); color: var(--juris-danger); background: rgba(198, 40, 40, 0.03); }
</style>
