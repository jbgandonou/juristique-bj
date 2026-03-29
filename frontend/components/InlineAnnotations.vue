<template>
  <div class="inline-annotations-container">
    <!-- Toolbar -->
    <div v-if="isAuthenticated" class="annotation-toolbar glass-card">
      <span class="toolbar-label">Annoter :</span>
      <button v-for="c in highlightColors" :key="c.value" class="highlight-btn" :class="{ active: activeColor === c.value }" :style="{ background: c.value }" :title="c.label" @click="activeColor = activeColor === c.value ? null : c.value"></button>
      <span v-if="activeColor" class="toolbar-hint">Sélectionnez du texte pour annoter</span>
    </div>

    <!-- Text with highlights -->
    <div ref="textContainer" class="annotated-text" @mouseup="handleSelection" v-html="renderedHtml"></div>

    <!-- Annotation popover -->
    <div v-if="showPopover" class="annotation-popover glass-card fade-in-up" :style="popoverStyle">
      <div class="popover-selected">"{{ pendingSelection.text.substring(0, 80) }}{{ pendingSelection.text.length > 80 ? '...' : '' }}"</div>
      <textarea v-model="pendingNote" class="popover-textarea" placeholder="Ajouter une note..." rows="2"></textarea>
      <div class="popover-actions">
        <button class="btn-popover-cancel" @click="cancelAnnotation">Annuler</button>
        <button class="btn-popover-save" @click="saveAnnotation" :disabled="!pendingNote.trim()">Annoter</button>
      </div>
    </div>

    <!-- Annotations sidebar -->
    <div v-if="annotations.length" class="annotations-sidebar">
      <h4>Annotations ({{ annotations.length }})</h4>
      <div v-for="a in annotations" :key="a.id" class="sidebar-annotation" :style="{ borderLeftColor: a.highlightColor || '#FFF3BF' }">
        <div v-if="a.selectedText" class="sidebar-quote">"{{ a.selectedText.substring(0, 60) }}..."</div>
        <p class="sidebar-note">{{ a.content }}</p>
        <div class="sidebar-meta">
          <span>{{ formatDate(a.createdAt) }}</span>
          <button @click="deleteAnnotation(a.id)" title="Supprimer"><Trash2 :size="12" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
  textId: string;
  contentText: string;
}>();

const { isAuthenticated, authFetch } = useAuth();
const annotations = ref<any[]>([]);

const highlightColors = [
  { value: '#FFF3BF', label: 'Jaune' },
  { value: '#D3F9D8', label: 'Vert' },
  { value: '#D0EBFF', label: 'Bleu' },
  { value: '#FFD8D8', label: 'Rose' },
  { value: '#E8DAEF', label: 'Violet' },
];

const activeColor = ref<string | null>(null);
const showPopover = ref(false);
const pendingSelection = ref({ text: '', start: 0, end: 0 });
const pendingNote = ref('');
const popoverStyle = ref({});
const textContainer = ref<HTMLElement>();

onMounted(async () => {
  if (!isAuthenticated.value) return;
  try {
    annotations.value = await authFetch(`/annotations/by-text/${props.textId}`);
  } catch {
    annotations.value = [];
  }
});

const renderedHtml = computed(() => {
  let html = escapeHtml(props.contentText || '');
  // Apply existing annotations as highlights (sort by start desc to not mess up offsets)
  const sorted = [...annotations.value]
    .filter(a => a.selectionStart != null && a.selectionEnd != null)
    .sort((a, b) => b.selectionStart - a.selectionStart);

  for (const a of sorted) {
    const before = html.substring(0, a.selectionStart);
    const highlighted = html.substring(a.selectionStart, a.selectionEnd);
    const after = html.substring(a.selectionEnd);
    html = `${before}<mark style="background:${a.highlightColor || '#FFF3BF'};cursor:pointer;border-radius:2px;padding:0 1px;" title="${escapeHtml(a.content)}">${highlighted}</mark>${after}`;
  }

  // Convert newlines to paragraphs
  return html.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
});

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const handleSelection = (event: MouseEvent) => {
  if (!activeColor.value || !isAuthenticated.value) return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

  const text = selection.toString().trim();
  if (text.length < 3) return;

  // Calculate offset in the original content
  const range = selection.getRangeAt(0);
  const container = textContainer.value;
  if (!container) return;

  // Get the text content up to the selection
  const preRange = document.createRange();
  preRange.setStart(container, 0);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;
  const end = start + text.length;

  pendingSelection.value = { text, start, end };
  pendingNote.value = '';

  // Position popover near selection
  const rect = range.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  popoverStyle.value = {
    position: 'absolute',
    top: `${rect.bottom - containerRect.top + 8}px`,
    left: `${Math.max(0, rect.left - containerRect.left)}px`,
    zIndex: 50,
  };

  showPopover.value = true;
};

const saveAnnotation = async () => {
  try {
    const body = {
      textId: props.textId,
      content: pendingNote.value,
      selectedText: pendingSelection.value.text,
      selectionStart: pendingSelection.value.start,
      selectionEnd: pendingSelection.value.end,
      highlightColor: activeColor.value || '#FFF3BF',
    };
    const created = await authFetch('/annotations', { method: 'POST', body });
    annotations.value.unshift(created);
  } catch (e) {
    console.error('Failed to save annotation', e);
  }
  cancelAnnotation();
};

const cancelAnnotation = () => {
  showPopover.value = false;
  pendingNote.value = '';
  window.getSelection()?.removeAllRanges();
};

const deleteAnnotation = async (id: string) => {
  try {
    await authFetch(`/annotations/${id}`, { method: 'DELETE' });
    annotations.value = annotations.value.filter(a => a.id !== id);
  } catch (e) {
    console.error(e);
  }
};

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
</script>

<style scoped>
.inline-annotations-container { position: relative; }

.annotation-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; margin-bottom: 16px; }
.toolbar-label { font-size: var(--font-xs); font-weight: 600; color: var(--juris-text-secondary); }
.highlight-btn { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
.highlight-btn:hover { transform: scale(1.15); }
.highlight-btn.active { border-color: var(--juris-text); box-shadow: 0 0 0 2px white inset; transform: scale(1.15); }
.toolbar-hint { font-size: var(--font-xs); color: var(--juris-primary-light); font-style: italic; }

.annotated-text { font-size: var(--font-sm); line-height: 1.8; color: var(--juris-text); }
.annotated-text :deep(p) { margin-bottom: 8px; }
.annotated-text :deep(mark:hover) { filter: brightness(0.95); }

.annotation-popover { position: absolute; padding: 16px; max-width: 320px; width: 100%; }
.popover-selected { font-size: var(--font-xs); color: var(--juris-text-secondary); font-style: italic; margin-bottom: 8px; padding: 8px; background: var(--juris-primary-50); border-radius: var(--radius-sm); border-left: 3px solid var(--juris-primary-lighter); }
.popover-textarea { width: 100%; border: 1px solid var(--juris-border); border-radius: 8px; padding: 10px; font-family: var(--font-family); font-size: var(--font-sm); resize: none; outline: none; }
.popover-textarea:focus { border-color: var(--juris-primary-lighter); box-shadow: 0 0 0 2px var(--juris-primary-100); }
.popover-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.btn-popover-cancel { padding: 6px 14px; border: none; background: var(--juris-border-light); border-radius: 6px; font-size: var(--font-xs); cursor: pointer; font-family: var(--font-family); }
.btn-popover-save { padding: 6px 14px; border: none; background: var(--juris-gradient-primary); color: white; border-radius: 6px; font-size: var(--font-xs); font-weight: 600; cursor: pointer; font-family: var(--font-family); }
.btn-popover-save:disabled { opacity: 0.5; }

.annotations-sidebar { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--juris-border); }
.annotations-sidebar h4 { font-size: var(--font-sm); font-weight: 600; color: var(--juris-text); margin-bottom: 12px; }
.sidebar-annotation { padding: 12px; border-left: 3px solid; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; background: var(--juris-surface-hover); margin-bottom: 8px; }
.sidebar-quote { font-size: var(--font-xs); color: var(--juris-text-muted); font-style: italic; margin-bottom: 4px; }
.sidebar-note { font-size: var(--font-sm); color: var(--juris-text); line-height: 1.5; }
.sidebar-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: 0.65rem; color: var(--juris-text-muted); }
.sidebar-meta button { border: none; background: none; cursor: pointer; color: var(--juris-text-muted); padding: 2px; }
.sidebar-meta button:hover { color: var(--juris-danger); }
</style>
