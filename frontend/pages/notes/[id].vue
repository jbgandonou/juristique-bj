<template>
  <div class="note-editor-page">
    <div class="note-header fade-in-up">
      <NuxtLink v-if="note.folderId" :to="`/dossiers/${note.folderId}`" class="back-link">
        ← Retour au dossier
      </NuxtLink>
      <NuxtLink v-else to="/dossiers" class="back-link">
        ← Mes dossiers
      </NuxtLink>

      <div class="note-title-row">
        <input v-model="note.title" type="text" class="note-title-input" placeholder="Titre de la note..." @blur="autoSave" />
      </div>
    </div>

    <div class="note-editor-wrap fade-in-up stagger-2">
      <CraftEditor
        :model-value="note.content"
        placeholder="Commencez à rédiger votre analyse, mémoire ou notes..."
        @update:model-value="onContentChange"
        @update:html="onHtmlChange"
        @update:text="onTextChange"
      />
    </div>

    <div class="note-actions fade-in-up stagger-3">
      <button class="btn-export hover-lift" @click="exportNote">
        Exporter en Word (bientôt)
      </button>
      <button class="btn-delete-note" @click="handleDelete">
        Supprimer cette note
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const { authFetch } = useAuth();

const noteId = route.params.id as string;
const note = ref<any>({ title: '', content: '', contentHtml: '', contentText: '', folderId: null });
let saveTimeout: any = null;

onMounted(async () => {
  try {
    note.value = await authFetch(`/editor-notes/${noteId}`);
  } catch {
    note.value = { title: 'Nouvelle note', content: '', folderId: null };
  }
});

const onContentChange = (val: string) => {
  note.value.content = val;
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
  saveTimeout = setTimeout(autoSave, 2000);
};

const autoSave = async () => {
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
  } catch {
    // silent fail
  }
};

const exportNote = () => {
  alert('Export Word sera disponible prochainement.');
};

const handleDelete = async () => {
  if (!confirm('Supprimer cette note ?')) return;
  try {
    await authFetch(`/editor-notes/${noteId}`, { method: 'DELETE' });
    router.push(note.value.folderId ? `/dossiers/${note.value.folderId}` : '/dossiers');
  } catch {
    // ignore
  }
};
</script>

<style scoped>
.note-editor-page { max-width: 800px; margin: 0 auto; padding: 0 16px; }

.note-header { margin-bottom: 20px; }
.back-link { font-size: var(--font-sm); color: var(--juris-primary-light); }

.note-title-input { width: 100%; border: none; font-size: var(--font-2xl); font-weight: 700; font-family: var(--font-family); color: var(--juris-text); outline: none; padding: 12px 0; background: transparent; margin-top: 12px; }
.note-title-input::placeholder { color: var(--juris-text-muted); }

.note-editor-wrap { margin-bottom: 24px; }

.note-actions { display: flex; align-items: center; justify-content: space-between; }
.btn-export { padding: 10px 20px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }
.btn-delete-note { padding: 10px 20px; background: none; border: 1px solid var(--juris-danger); color: var(--juris-danger); border-radius: 10px; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }
.btn-delete-note:hover { background: rgba(198, 40, 40, 0.05); }
</style>
