<template>
  <div class="craft-editor">
    <!-- Toolbar -->
    <div v-if="editor" class="editor-toolbar">
      <!-- Text formatting -->
      <div class="toolbar-group">
        <button @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }" title="Gras (Ctrl+B)"><strong>B</strong></button>
        <button @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }" title="Italique (Ctrl+I)"><em>I</em></button>
        <button @click="editor.chain().focus().toggleUnderline().run()" :class="{ active: editor.isActive('underline') }" title="Souligné (Ctrl+U)"><u>U</u></button>
        <button @click="editor.chain().focus().toggleStrike().run()" :class="{ active: editor.isActive('strike') }" title="Barré"><s>S</s></button>
      </div>

      <span class="toolbar-divider"></span>

      <!-- Headings -->
      <div class="toolbar-group">
        <button @click="editor.chain().focus().setParagraph().run()" :class="{ active: editor.isActive('paragraph') }" title="Paragraphe">¶</button>
        <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ active: editor.isActive('heading', { level: 1 }) }" title="Titre 1">H1</button>
        <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ active: editor.isActive('heading', { level: 2 }) }" title="Titre 2">H2</button>
        <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ active: editor.isActive('heading', { level: 3 }) }" title="Sous-titre">H3</button>
      </div>

      <span class="toolbar-divider"></span>

      <!-- Alignment -->
      <div class="toolbar-group">
        <button @click="editor.chain().focus().setTextAlign('left').run()" :class="{ active: editor.isActive({ textAlign: 'left' }) }" title="Aligner à gauche">⫷</button>
        <button @click="editor.chain().focus().setTextAlign('center').run()" :class="{ active: editor.isActive({ textAlign: 'center' }) }" title="Centrer">☰</button>
        <button @click="editor.chain().focus().setTextAlign('right').run()" :class="{ active: editor.isActive({ textAlign: 'right' }) }" title="Aligner à droite">⫸</button>
        <button @click="editor.chain().focus().setTextAlign('justify').run()" :class="{ active: editor.isActive({ textAlign: 'justify' }) }" title="Justifier">☷</button>
      </div>

      <span class="toolbar-divider"></span>

      <!-- Lists & Blocks -->
      <div class="toolbar-group">
        <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ active: editor.isActive('bulletList') }" title="Liste à puces">• Liste</button>
        <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ active: editor.isActive('orderedList') }" title="Liste numérotée">1. Liste</button>
        <button @click="editor.chain().focus().toggleTaskList().run()" :class="{ active: editor.isActive('taskList') }" title="Checklist">☑ Tâches</button>
      </div>

      <span class="toolbar-divider"></span>

      <!-- Rich blocks -->
      <div class="toolbar-group">
        <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }" title="Citation">❝ Citation</button>
        <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ active: editor.isActive('codeBlock') }" title="Bloc de code">{ } Code</button>
        <button @click="editor.chain().focus().setHorizontalRule().run()" title="Ligne de séparation">― Ligne</button>
      </div>

      <span class="toolbar-divider"></span>

      <!-- Highlight & colors -->
      <div class="toolbar-group">
        <div class="highlight-dropdown">
          <button class="highlight-trigger" :class="{ active: editor.isActive('highlight') }" title="Surligner">
            🖍 <span class="highlight-swatch" :style="{ background: currentHighlight }"></span>
          </button>
          <div class="highlight-options">
            <button v-for="c in highlightColors" :key="c" class="highlight-color-btn" :style="{ background: c }" @click="editor.chain().focus().toggleHighlight({ color: c }).run()" :title="c"></button>
            <button class="highlight-color-btn highlight-remove" @click="editor.chain().focus().unsetHighlight().run()" title="Retirer">✕</button>
          </div>
        </div>
      </div>

      <span class="toolbar-divider"></span>


      <!-- Link -->
      <div class="toolbar-group">
        <button @click="setLink" :class="{ active: editor.isActive('link') }" title="Lien">🔗 Lien</button>
        <button v-if="editor.isActive('link')" @click="editor.chain().focus().unsetLink().run()" title="Retirer le lien" class="btn-danger-sm">✕ Lien</button>
      </div>

      <span class="toolbar-divider"></span>

      <!-- Undo/Redo -->
      <div class="toolbar-group">
        <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" title="Annuler (Ctrl+Z)">↶</button>
        <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" title="Rétablir (Ctrl+Y)">↷</button>
      </div>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" class="editor-content" />

    <!-- Footer -->
    <div class="editor-footer">
      <div class="editor-status-wrap">
        <span class="editor-status" :class="saveStatusClass">{{ saveStatus }}</span>
      </div>
      <div class="editor-stats" v-if="editor">
        <span>{{ charCount }} car.</span>
        <span>{{ wordCount }} mots</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
// Table extensions removed — incompatible with Vite ESM build
import { ref, computed, watch, onBeforeUnmount } from 'vue';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:html', value: string): void;
  (e: 'update:text', value: string): void;
  (e: 'save'): void;
}>();

const saveStatus = ref('Prêt');
const saveStatusClass = ref('');
const currentHighlight = ref('#FFF3BF');

const highlightColors = ['#FFF3BF', '#D3F9D8', '#D0EBFF', '#FFD8D8', '#E8DAEF', '#FFE0B2'];

// Parse initial content — could be JSON (TipTap format) or HTML or plain text
const parseInitialContent = (value?: string): any => {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (parsed && parsed.type === 'doc') return parsed; // TipTap JSON
    return value; // Regular string
  } catch {
    return value; // HTML or plain text
  }
};

const editor = useEditor({
  content: parseInitialContent(props.modelValue),
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({ placeholder: props.placeholder || 'Commencez à écrire...' }),
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
  ],
  onUpdate: ({ editor: ed }) => {
    const json = JSON.stringify(ed.getJSON());
    const html = ed.getHTML();
    const text = ed.getText();
    emit('update:modelValue', json);
    emit('update:html', html);
    emit('update:text', text);

    saveStatus.value = '● Modifications non enregistrées';
    saveStatusClass.value = 'unsaved';
  },
});

// Watch for external content changes (e.g., when note loads from API)
watch(() => props.modelValue, (newVal) => {
  if (!editor.value || !newVal) return;
  const currentJson = JSON.stringify(editor.value.getJSON());
  if (newVal !== currentJson) {
    const content = parseInitialContent(newVal);
    editor.value.commands.setContent(content, false);
  }
});

const setLink = () => {
  const url = window.prompt('URL du lien :');
  if (url) {
    editor.value?.chain().focus().setLink({ href: url }).run();
  }
};

// Expose a method for parent to call after successful save
const markSaved = () => {
  saveStatus.value = '✓ Sauvegardé';
  saveStatusClass.value = 'saved';
};

const markError = () => {
  saveStatus.value = '✕ Erreur de sauvegarde';
  saveStatusClass.value = 'error';
};

defineExpose({ markSaved, markError });

const wordCount = computed(() => {
  if (!editor.value) return 0;
  return editor.value.getText().split(/\s+/).filter(w => w.length > 0).length;
});

const charCount = computed(() => {
  if (!editor.value) return 0;
  return editor.value.getText().length;
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.craft-editor { border: 1px solid var(--juris-border); border-radius: var(--radius-lg); overflow: hidden; background: var(--juris-surface); }

.editor-toolbar { display: flex; align-items: center; gap: 2px; padding: 6px 10px; border-bottom: 1px solid var(--juris-border-light); background: var(--juris-surface-hover); flex-wrap: wrap; }

.toolbar-group { display: flex; align-items: center; gap: 1px; }

.editor-toolbar button { padding: 5px 8px; border: none; background: transparent; border-radius: 5px; cursor: pointer; font-size: 0.72rem; font-family: var(--font-family); color: var(--juris-text-secondary); transition: all 0.12s; white-space: nowrap; }
.editor-toolbar button:hover:not(:disabled) { background: var(--juris-primary-50); color: var(--juris-primary); }
.editor-toolbar button.active { background: var(--juris-primary-100); color: var(--juris-primary); font-weight: 600; }
.editor-toolbar button:disabled { opacity: 0.3; cursor: not-allowed; }
.editor-toolbar .btn-danger-sm { color: var(--juris-danger); }
.editor-toolbar .btn-danger-sm:hover { background: rgba(198, 40, 40, 0.08); }

.toolbar-divider { width: 1px; height: 20px; background: var(--juris-border-light); margin: 0 3px; }

/* Highlight dropdown */
.highlight-dropdown { position: relative; }
.highlight-trigger { display: flex; align-items: center; gap: 4px; }
.highlight-swatch { width: 12px; height: 12px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.1); }
.highlight-options { display: none; position: absolute; top: 100%; left: 0; z-index: 20; background: var(--juris-surface); border: 1px solid var(--juris-border); border-radius: 8px; padding: 6px; box-shadow: var(--shadow-lg); gap: 4px; flex-wrap: wrap; width: 140px; }
.highlight-dropdown:hover .highlight-options { display: flex; }
.highlight-color-btn { width: 24px; height: 24px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.08); cursor: pointer; }
.highlight-color-btn:hover { transform: scale(1.15); }
.highlight-remove { background: var(--juris-surface-hover); display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--juris-text-muted); }

/* Editor content */
.editor-content { padding: 28px 32px; min-height: 400px; max-height: 70vh; overflow-y: auto; }
.editor-content :deep(.tiptap) { outline: none; font-family: var(--font-family); font-size: var(--font-base); line-height: 1.8; color: var(--juris-text); }
.editor-content :deep(.tiptap > * + *) { margin-top: 0.5em; }
.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) { content: attr(data-placeholder); float: left; color: var(--juris-text-muted); pointer-events: none; height: 0; }
.editor-content :deep(.tiptap h1) { font-size: var(--font-2xl); font-weight: 700; margin: 28px 0 10px; color: var(--juris-text); }
.editor-content :deep(.tiptap h2) { font-size: var(--font-xl); font-weight: 700; margin: 24px 0 8px; color: var(--juris-text); }
.editor-content :deep(.tiptap h3) { font-size: var(--font-lg); font-weight: 600; margin: 20px 0 6px; color: var(--juris-text); }
.editor-content :deep(.tiptap ul), .editor-content :deep(.tiptap ol) { padding-left: 24px; }
.editor-content :deep(.tiptap blockquote) { border-left: 3px solid var(--juris-primary-lighter); padding-left: 16px; margin: 16px 0; color: var(--juris-text-secondary); font-style: italic; }
.editor-content :deep(.tiptap mark) { border-radius: 2px; padding: 0 2px; }
.editor-content :deep(.tiptap pre) { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: var(--radius-md); font-family: 'JetBrains Mono', monospace; font-size: var(--font-sm); overflow-x: auto; }
.editor-content :deep(.tiptap hr) { border: none; border-top: 2px solid var(--juris-border); margin: 24px 0; }
.editor-content :deep(.tiptap ul[data-type="taskList"]) { list-style: none; padding-left: 0; }
.editor-content :deep(.tiptap ul[data-type="taskList"] li) { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
.editor-content :deep(.tiptap ul[data-type="taskList"] li label) { cursor: pointer; }
.editor-content :deep(.tiptap ul[data-type="taskList"] li[data-checked="true"] > div > p) { text-decoration: line-through; color: var(--juris-text-muted); }
.editor-content :deep(.tiptap a) { color: var(--juris-primary-light); text-decoration: underline; }
.editor-content :deep(.tiptap sub) { font-size: 0.75em; }
.editor-content :deep(.tiptap sup) { font-size: 0.75em; }

/* Tables */
.editor-content :deep(.tiptap table) { border-collapse: collapse; width: 100%; margin: 16px 0; }
.editor-content :deep(.tiptap th), .editor-content :deep(.tiptap td) { border: 1px solid var(--juris-border); padding: 8px 12px; text-align: left; min-width: 80px; }
.editor-content :deep(.tiptap th) { background: var(--juris-surface-hover); font-weight: 600; font-size: var(--font-sm); }
.editor-content :deep(.tiptap td) { font-size: var(--font-sm); }
.editor-content :deep(.tiptap .selectedCell) { background: var(--juris-primary-50); }

/* Footer */
.editor-footer { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; border-top: 1px solid var(--juris-border-light); background: var(--juris-surface-hover); }
.editor-status { font-size: var(--font-xs); color: var(--juris-text-muted); transition: color 0.2s; }
.editor-status.unsaved { color: var(--juris-warning); }
.editor-status.saved { color: var(--juris-success); }
.editor-status.error { color: var(--juris-danger); }
.editor-stats { display: flex; gap: 16px; font-size: var(--font-xs); color: var(--juris-text-muted); }
</style>
