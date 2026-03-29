<template>
  <div class="craft-editor">
    <!-- Toolbar -->
    <div v-if="editor" class="editor-toolbar glass-card">
      <button @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }" title="Gras"><strong>B</strong></button>
      <button @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }" title="Italique"><em>I</em></button>
      <button @click="editor.chain().focus().toggleUnderline().run()" :class="{ active: editor.isActive('underline') }" title="Souligné"><u>U</u></button>
      <span class="toolbar-divider"></span>
      <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ active: editor.isActive('heading', { level: 2 }) }" title="Titre">H2</button>
      <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ active: editor.isActive('heading', { level: 3 }) }" title="Sous-titre">H3</button>
      <span class="toolbar-divider"></span>
      <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ active: editor.isActive('bulletList') }" title="Liste">• Liste</button>
      <button @click="editor.chain().focus().toggleTaskList().run()" :class="{ active: editor.isActive('taskList') }" title="Checklist">☑ Tâches</button>
      <span class="toolbar-divider"></span>
      <button @click="editor.chain().focus().toggleHighlight().run()" :class="{ active: editor.isActive('highlight') }" title="Surligner">🖍</button>
      <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }" title="Citation">❝</button>
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" class="editor-content" />

    <!-- Footer -->
    <div class="editor-footer">
      <span class="editor-status">{{ saveStatus }}</span>
      <span class="editor-wordcount" v-if="editor">{{ wordCount }} mots</span>
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
import { ref, computed, onBeforeUnmount } from 'vue';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:html', value: string): void;
  (e: 'update:text', value: string): void;
}>();

const saveStatus = ref('');
let saveTimeout: any = null;

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: props.placeholder || 'Commencez à écrire...' }),
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: false }),
    Underline,
  ],
  onUpdate: ({ editor: ed }) => {
    const json = JSON.stringify(ed.getJSON());
    const html = ed.getHTML();
    const text = ed.getText();
    emit('update:modelValue', json);
    emit('update:html', html);
    emit('update:text', text);

    // Auto-save indicator
    saveStatus.value = 'Modifications non enregistrées';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveStatus.value = 'Sauvegardé';
    }, 1500);
  },
});

const wordCount = computed(() => {
  if (!editor.value) return 0;
  return editor.value.getText().split(/\s+/).filter(w => w.length > 0).length;
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  clearTimeout(saveTimeout);
});
</script>

<style scoped>
.craft-editor { border: 1px solid var(--juris-border); border-radius: var(--radius-lg); overflow: hidden; background: var(--juris-surface); }

.editor-toolbar { display: flex; align-items: center; gap: 2px; padding: 8px 12px; border-bottom: 1px solid var(--juris-border-light); border-radius: 0 !important; box-shadow: none !important; border: none !important; background: var(--juris-surface-hover) !important; flex-wrap: wrap; }

.editor-toolbar button { padding: 6px 10px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: var(--font-xs); font-family: var(--font-family); color: var(--juris-text-secondary); transition: all 0.15s; }
.editor-toolbar button:hover { background: var(--juris-primary-50); color: var(--juris-primary); }
.editor-toolbar button.active { background: var(--juris-primary-100); color: var(--juris-primary); font-weight: 600; }

.toolbar-divider { width: 1px; height: 20px; background: var(--juris-border); margin: 0 4px; }

.editor-content { padding: 24px; min-height: 300px; }
.editor-content :deep(.tiptap) { outline: none; font-family: var(--font-family); font-size: var(--font-base); line-height: 1.7; color: var(--juris-text); }
.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) { content: attr(data-placeholder); float: left; color: var(--juris-text-muted); pointer-events: none; height: 0; }
.editor-content :deep(.tiptap h2) { font-size: var(--font-xl); font-weight: 700; margin: 24px 0 8px; color: var(--juris-text); }
.editor-content :deep(.tiptap h3) { font-size: var(--font-lg); font-weight: 600; margin: 20px 0 6px; color: var(--juris-text); }
.editor-content :deep(.tiptap ul) { padding-left: 24px; }
.editor-content :deep(.tiptap blockquote) { border-left: 3px solid var(--juris-primary-lighter); padding-left: 16px; margin: 16px 0; color: var(--juris-text-secondary); font-style: italic; }
.editor-content :deep(.tiptap mark) { background: #FFF3BF; border-radius: 2px; padding: 0 2px; }
.editor-content :deep(.tiptap ul[data-type="taskList"]) { list-style: none; padding-left: 0; }
.editor-content :deep(.tiptap ul[data-type="taskList"] li) { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
.editor-content :deep(.tiptap ul[data-type="taskList"] li label) { cursor: pointer; }
.editor-content :deep(.tiptap a) { color: var(--juris-primary-light); text-decoration: underline; }

.editor-footer { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; border-top: 1px solid var(--juris-border-light); background: var(--juris-surface-hover); }
.editor-status { font-size: var(--font-xs); color: var(--juris-text-muted); }
.editor-wordcount { font-size: var(--font-xs); color: var(--juris-text-muted); }
</style>
