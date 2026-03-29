<template>
  <div class="sticky-notes-section">
    <div class="sticky-notes-header">
      <h4><StickyNote :size="18" /> Pense-bêtes</h4>
      <button class="btn-add-note" @click="showAdd = true" title="Ajouter un pense-bête">
        <Plus :size="16" />
      </button>
    </div>

    <!-- Add form -->
    <div v-if="showAdd" class="sticky-note-form fade-in-up" :style="{ background: newNote.color }">
      <textarea v-model="newNote.content" placeholder="Écrire une note..." rows="3" class="note-textarea"></textarea>
      <div class="note-form-footer">
        <div class="color-dots">
          <button v-for="c in noteColors" :key="c.value" type="button" class="color-dot" :class="{ active: newNote.color === c.value }" :style="{ background: c.value }" :title="c.label" @click="newNote.color = c.value"></button>
        </div>
        <div class="note-form-actions">
          <button class="btn-note-cancel" @click="showAdd = false">Annuler</button>
          <button class="btn-note-save" @click="addNote">Coller</button>
        </div>
      </div>
    </div>

    <!-- Notes list -->
    <div class="sticky-notes-grid">
      <div v-for="note in notes" :key="note.id" class="sticky-note" :style="{ background: note.color || '#FFF9C4' }">
        <div class="note-pin" v-if="note.isPinned">📌</div>
        <div v-if="editingId === note.id" class="note-edit">
          <textarea v-model="editContent" rows="3" class="note-textarea"></textarea>
          <div class="note-form-actions">
            <button class="btn-note-cancel" @click="editingId = null">Annuler</button>
            <button class="btn-note-save" @click="saveEdit(note.id)">Sauver</button>
          </div>
        </div>
        <div v-else>
          <p class="note-content">{{ note.content }}</p>
          <div class="note-footer">
            <span class="note-date">{{ formatDate(note.createdAt) }}</span>
            <div class="note-actions">
              <button @click="startEdit(note)" title="Modifier"><Edit3 :size="13" /></button>
              <button @click="togglePin(note)" :title="note.isPinned ? 'Désépingler' : 'Épingler'"><Pin :size="13" /></button>
              <button @click="removeNote(note.id)" title="Supprimer"><Trash2 :size="13" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!notes.length && !showAdd" class="no-notes">Aucun pense-bête. Cliquez + pour en ajouter.</p>
  </div>
</template>

<script setup lang="ts">
import { StickyNote, Plus, Edit3, Pin, Trash2 } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';

const props = defineProps<{
  textId?: string;
  folderId?: string;
}>();

const { authFetch } = useAuth();
const notes = ref<any[]>([]);
const showAdd = ref(false);
const editingId = ref<string | null>(null);
const editContent = ref('');

const noteColors = [
  { value: '#FFF9C4', label: 'Jaune' },
  { value: '#F8BBD0', label: 'Rose' },
  { value: '#C8E6C9', label: 'Vert' },
  { value: '#BBDEFB', label: 'Bleu' },
  { value: '#FFE0B2', label: 'Orange' },
  { value: '#E1BEE7', label: 'Violet' },
];

const newNote = ref({ content: '', color: '#FFF9C4' });

onMounted(async () => {
  try {
    let url = '/sticky-notes';
    if (props.textId) url = `/sticky-notes/by-text/${props.textId}`;
    else if (props.folderId) url = `/sticky-notes/by-folder/${props.folderId}`;
    notes.value = await authFetch(url);
  } catch {
    notes.value = [];
  }
});

const addNote = async () => {
  if (!newNote.value.content.trim()) return;
  try {
    const body: any = { content: newNote.value.content, color: newNote.value.color };
    if (props.textId) body.textId = props.textId;
    if (props.folderId) body.folderId = props.folderId;
    const created = await authFetch('/sticky-notes', { method: 'POST', body });
    notes.value.unshift(created);
    newNote.value = { content: '', color: '#FFF9C4' };
    showAdd.value = false;
  } catch (e) {
    console.error(e);
  }
};

const startEdit = (note: any) => {
  editingId.value = note.id;
  editContent.value = note.content;
};

const saveEdit = async (id: string) => {
  try {
    const updated = await authFetch(`/sticky-notes/${id}`, { method: 'PATCH', body: { content: editContent.value } });
    const idx = notes.value.findIndex(n => n.id === id);
    if (idx >= 0) notes.value[idx] = { ...notes.value[idx], ...updated };
    editingId.value = null;
  } catch (e) {
    console.error(e);
  }
};

const togglePin = async (note: any) => {
  try {
    const updated = await authFetch(`/sticky-notes/${note.id}`, { method: 'PATCH', body: { isPinned: !note.isPinned } });
    const idx = notes.value.findIndex(n => n.id === note.id);
    if (idx >= 0) notes.value[idx] = { ...notes.value[idx], ...updated };
  } catch (e) {
    console.error(e);
  }
};

const removeNote = async (id: string) => {
  try {
    await authFetch(`/sticky-notes/${id}`, { method: 'DELETE' });
    notes.value = notes.value.filter(n => n.id !== id);
  } catch (e) {
    console.error(e);
  }
};

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
</script>

<style scoped>
.sticky-notes-section { margin-top: 16px; }

.sticky-notes-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.sticky-notes-header h4 { display: flex; align-items: center; gap: 8px; font-size: var(--font-sm); font-weight: 600; color: var(--juris-text); }

.btn-add-note { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--juris-border); border-radius: var(--radius-md); background: var(--juris-surface); cursor: pointer; color: var(--juris-text-secondary); transition: all 0.15s; }
.btn-add-note:hover { border-color: var(--juris-primary-lighter); color: var(--juris-primary); }

.sticky-notes-grid { display: flex; flex-direction: column; gap: 8px; }

.sticky-note { padding: 14px 16px; border-radius: var(--radius-md); box-shadow: 1px 2px 6px rgba(0,0,0,0.08); position: relative; transition: all 0.2s; }
.sticky-note:hover { box-shadow: 2px 4px 12px rgba(0,0,0,0.12); transform: rotate(-0.3deg); }

.note-pin { position: absolute; top: -6px; right: 8px; font-size: 14px; }

.note-content { font-size: var(--font-sm); color: #333; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }

.note-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.note-date { font-size: 0.65rem; color: rgba(0,0,0,0.35); }
.note-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.sticky-note:hover .note-actions { opacity: 1; }
.note-actions button { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: rgba(0,0,0,0.06); border-radius: 4px; cursor: pointer; color: rgba(0,0,0,0.5); }
.note-actions button:hover { background: rgba(0,0,0,0.12); color: rgba(0,0,0,0.8); }

.sticky-note-form { padding: 16px; border-radius: var(--radius-md); box-shadow: 2px 4px 12px rgba(0,0,0,0.1); margin-bottom: 12px; }

.note-textarea { width: 100%; border: none; background: transparent; font-family: var(--font-family); font-size: var(--font-sm); color: #333; resize: none; outline: none; line-height: 1.6; }

.note-form-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }

.color-dots { display: flex; gap: 6px; }
.color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
.color-dot:hover { transform: scale(1.15); }
.color-dot.active { border-color: rgba(0,0,0,0.3); box-shadow: 0 0 0 2px white inset; }

.note-form-actions { display: flex; gap: 8px; }
.btn-note-cancel { padding: 4px 12px; border: none; background: rgba(0,0,0,0.06); border-radius: 6px; font-size: var(--font-xs); cursor: pointer; font-family: var(--font-family); }
.btn-note-save { padding: 4px 12px; border: none; background: rgba(0,0,0,0.15); border-radius: 6px; font-size: var(--font-xs); font-weight: 600; cursor: pointer; font-family: var(--font-family); }

.no-notes { font-size: var(--font-xs); color: var(--juris-text-muted); text-align: center; padding: 16px 0; }
</style>
