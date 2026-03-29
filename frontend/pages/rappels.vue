<template>
  <PremiumGate title="Rappels" description="Planifiez vos rappels juridiques et ne manquez aucune échéance.">
    <div class="rappels-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="gradient-text">Mes rappels</h1>
          <p class="subtitle">Gérez vos rappels et échéances juridiques</p>
        </div>
        <button class="btn-create hover-lift" @click="showCreateModal = true">
          <Plus :size="18" />
          Nouveau rappel
        </button>
      </div>

      <!-- Create Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-card glass-card fade-in-up">
          <div class="modal-header">
            <h3>Nouveau rappel</h3>
            <button class="btn-close" @click="showCreateModal = false"><X :size="20" /></button>
          </div>
          <form @submit.prevent="handleCreate">
            <div class="form-group">
              <label>Titre *</label>
              <input v-model="newReminder.title" type="text" class="form-input" placeholder="Ex: Dépôt conclusions affaire X" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="newReminder.description" class="form-input" rows="2" placeholder="Détails optionnels..."></textarea>
            </div>
            <div class="form-group">
              <label>Date et heure *</label>
              <input v-model="newReminder.remindAt" type="datetime-local" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Lier à un texte (ID optionnel)</label>
              <input v-model="newReminder.textId" type="text" class="form-input" placeholder="ID du texte juridique" />
            </div>
            <div class="form-group">
              <label>Sticker</label>
              <div class="sticker-picker">
                <button
                  v-for="s in stickers"
                  :key="s"
                  type="button"
                  class="sticker-btn"
                  :class="{ active: newReminder.sticker === s }"
                  @click="newReminder.sticker = newReminder.sticker === s ? '' : s"
                >{{ s }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Label</label>
              <div class="label-picker">
                <button
                  v-for="lbl in labelOptions"
                  :key="lbl.value"
                  type="button"
                  class="label-picker-btn"
                  :class="[{ active: newReminder.label === lbl.value }, `lp-${lbl.value}`]"
                  @click="newReminder.label = newReminder.label === lbl.value ? '' : lbl.value"
                >{{ lbl.text }}</button>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showCreateModal = false">Annuler</button>
              <button type="submit" class="btn-submit">Créer le rappel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Sections -->
      <div class="reminders-sections">

        <!-- En retard -->
        <section v-if="overdueReminders.length" class="reminder-section">
          <div class="section-heading overdue-heading">
            <AlertTriangle :size="16" />
            <span>En retard</span>
            <span class="count-chip">{{ overdueReminders.length }}</span>
          </div>
          <div class="reminders-list">
            <ReminderCard
              v-for="r in overdueReminders"
              :key="r.id"
              :reminder="r"
              status="overdue"
              :label-options="labelOptions"
              @complete="completeItem"
              @delete="deleteItem"
            />
          </div>
        </section>

        <!-- Aujourd'hui -->
        <section v-if="todayReminders.length" class="reminder-section">
          <div class="section-heading today-heading">
            <Clock :size="16" />
            <span>Aujourd'hui</span>
            <span class="count-chip">{{ todayReminders.length }}</span>
          </div>
          <div class="reminders-list">
            <ReminderCard
              v-for="r in todayReminders"
              :key="r.id"
              :reminder="r"
              status="upcoming"
              :label-options="labelOptions"
              @complete="completeItem"
              @delete="deleteItem"
            />
          </div>
        </section>

        <!-- À venir -->
        <section v-if="upcomingReminders.length" class="reminder-section">
          <div class="section-heading upcoming-heading">
            <CalendarDays :size="16" />
            <span>À venir</span>
            <span class="count-chip">{{ upcomingReminders.length }}</span>
          </div>
          <div class="reminders-list">
            <ReminderCard
              v-for="r in upcomingReminders"
              :key="r.id"
              :reminder="r"
              status=""
              :label-options="labelOptions"
              @complete="completeItem"
              @delete="deleteItem"
            />
          </div>
        </section>

        <!-- Empty state -->
        <div v-if="!overdueReminders.length && !todayReminders.length && !upcomingReminders.length && !completedReminders.length" class="empty-state glass-card">
          <Bell :size="48" class="empty-icon" />
          <h3>Aucun rappel actif</h3>
          <p>Créez votre premier rappel pour ne manquer aucune échéance.</p>
          <button class="btn-create hover-lift" @click="showCreateModal = true">
            <Plus :size="18" /> Nouveau rappel
          </button>
        </div>

        <!-- Terminés -->
        <section v-if="completedReminders.length" class="reminder-section">
          <div class="section-heading completed-heading" @click="showCompleted = !showCompleted" style="cursor:pointer;">
            <CheckCircle2 :size="16" />
            <span>Terminés</span>
            <span class="count-chip">{{ completedReminders.length }}</span>
            <ChevronDown :size="14" :style="{ transform: showCompleted ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }" />
          </div>
          <div v-if="showCompleted" class="reminders-list">
            <ReminderCard
              v-for="r in completedReminders"
              :key="r.id"
              :reminder="r"
              status="completed"
              :label-options="labelOptions"
              @complete="completeItem"
              @delete="deleteItem"
            />
          </div>
        </section>

      </div>
    </div>

    <template #preview>
      <div class="reminders-list" style="gap:12px; display:flex; flex-direction:column;">
        <div v-for="i in 3" :key="i" class="reminder-card">
          <div class="skeleton" style="width: 32px; height: 32px; border-radius: 8px;"></div>
          <div style="flex:1;">
            <div class="skeleton" style="height: 16px; width: 55%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 12px; width: 35%;"></div>
          </div>
        </div>
      </div>
    </template>
  </PremiumGate>
</template>

<script setup lang="ts">
import { Plus, X, Bell, Clock, CalendarDays, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';

definePageMeta({ middleware: 'auth' });

const { authFetch } = useAuth();

const reminders = ref<any[]>([]);
const showCreateModal = ref(false);
const showCompleted = ref(false);

const stickers = ['⚠️', '✅', '📌', '🔥', '💡', '❓', '⏰', '📝', '🎯', '⭐', '🔍', '📋'];

const labelOptions = [
  { value: 'urgent', text: 'Urgent' },
  { value: 'a_relire', text: 'À relire' },
  { value: 'important', text: 'Important' },
  { value: 'en_cours', text: 'En cours' },
  { value: 'termine', text: 'Terminé' },
  { value: 'question', text: 'Question' },
];

const newReminder = ref({
  title: '',
  description: '',
  remindAt: '',
  textId: '',
  sticker: '',
  label: '',
});

onMounted(async () => {
  try {
    reminders.value = await authFetch<any[]>('/reminders');
  } catch {
    // Mock data fallback
    reminders.value = [
      {
        id: '1',
        title: 'Dépôt des conclusions',
        description: 'Affaire client Kossou',
        remindAt: new Date(Date.now() - 86400000).toISOString(),
        sticker: '📌',
        label: 'urgent',
        isCompleted: false,
      },
      {
        id: '2',
        title: 'Audience tribunal',
        remindAt: new Date().toISOString(),
        sticker: '⏰',
        label: 'en_cours',
        isCompleted: false,
      },
      {
        id: '3',
        title: 'Relire contrat de bail',
        remindAt: new Date(Date.now() + 172800000).toISOString(),
        sticker: '📝',
        label: 'a_relire',
        isCompleted: false,
      },
    ];
  }
});

const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

const activeReminders = computed(() => reminders.value.filter((r) => !r.isCompleted));

const overdueReminders = computed(() =>
  activeReminders.value.filter((r) => new Date(r.remindAt) < todayStart)
);

const todayReminders = computed(() =>
  activeReminders.value.filter((r) => {
    const d = new Date(r.remindAt);
    return d >= todayStart && d < todayEnd;
  })
);

const upcomingReminders = computed(() =>
  activeReminders.value.filter((r) => new Date(r.remindAt) >= todayEnd)
);

const completedReminders = computed(() => reminders.value.filter((r) => r.isCompleted));

const handleCreate = async () => {
  const payload: any = {
    title: newReminder.value.title,
    remindAt: newReminder.value.remindAt,
  };
  if (newReminder.value.description) payload.description = newReminder.value.description;
  if (newReminder.value.textId) payload.textId = newReminder.value.textId;
  if (newReminder.value.sticker) payload.sticker = newReminder.value.sticker;
  if (newReminder.value.label) payload.label = newReminder.value.label;

  try {
    const created = await authFetch<any>('/reminders', { method: 'POST', body: payload });
    reminders.value.unshift(created);
  } catch {
    reminders.value.unshift({ id: Date.now().toString(), ...payload, isCompleted: false });
  }
  showCreateModal.value = false;
  newReminder.value = { title: '', description: '', remindAt: '', textId: '', sticker: '', label: '' };
};

const completeItem = async (id: string) => {
  try {
    await authFetch(`/reminders/${id}/complete`, { method: 'PATCH' });
  } catch {
    // optimistic update
  }
  const r = reminders.value.find((x) => x.id === id);
  if (r) r.isCompleted = true;
};

const deleteItem = async (id: string) => {
  try {
    await authFetch(`/reminders/${id}`, { method: 'DELETE' });
  } catch {
    // optimistic update
  }
  reminders.value = reminders.value.filter((r) => r.id !== id);
};
</script>

<!-- Inline sub-component for reminder cards -->
<script lang="ts">
import { defineComponent, h } from 'vue';
import { Check, Trash2, FileText } from 'lucide-vue-next';

export const ReminderCard = defineComponent({
  name: 'ReminderCard',
  props: {
    reminder: { type: Object, required: true },
    status: { type: String, default: '' },
    labelOptions: { type: Array as () => { value: string; text: string }[], default: () => [] },
  },
  emits: ['complete', 'delete'],
  setup(props, { emit }) {
    const formatDate = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const labelText = (val: string) => {
      const found = (props.labelOptions as { value: string; text: string }[]).find((l) => l.value === val);
      return found ? found.text : val;
    };
    return () =>
      h('div', { class: ['reminder-card', props.status, { completed: props.reminder.isCompleted }] }, [
        // Sticker
        props.reminder.sticker
          ? h('span', { class: 'sticker', style: { fontSize: '1.4rem', flexShrink: 0 } }, props.reminder.sticker)
          : null,
        // Body
        h('div', { style: 'flex:1; min-width:0;' }, [
          h('div', { class: 'reminder-title' }, props.reminder.title),
          props.reminder.description
            ? h('div', { style: 'font-size:0.75rem; color: var(--juris-text-secondary); margin-top:2px;' }, props.reminder.description)
            : null,
          h('div', { style: 'display:flex; align-items:center; gap:8px; margin-top:6px; flex-wrap:wrap;' }, [
            h('span', { class: 'reminder-time' }, formatDate(props.reminder.remindAt)),
            props.reminder.label
              ? h('span', { class: ['label-badge', props.reminder.label] }, labelText(props.reminder.label))
              : null,
            props.reminder.textId
              ? h('span', { style: 'display:inline-flex; align-items:center; gap:3px; font-size:0.7rem; color:var(--juris-text-muted);' }, [
                  h(FileText, { size: 11 }),
                  'Texte lié',
                ])
              : null,
          ]),
        ]),
        // Actions
        h('div', { style: 'display:flex; gap:4px; flex-shrink:0;' }, [
          !props.reminder.isCompleted
            ? h('button', {
                class: 'action-btn complete-btn',
                title: 'Marquer comme terminé',
                onClick: () => emit('complete', props.reminder.id),
              }, h(Check, { size: 14 }))
            : null,
          h('button', {
            class: 'action-btn delete-btn',
            title: 'Supprimer',
            onClick: () => emit('delete', props.reminder.id),
          }, h(Trash2, { size: 14 })),
        ]),
      ]);
  },
});
</script>

<style scoped>
.rappels-page { display: flex; flex-direction: column; gap: 28px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-header h1 { font-size: var(--font-2xl); font-weight: 700; }
.subtitle { color: var(--juris-text-secondary); font-size: var(--font-sm); margin-top: 4px; }

.btn-create { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-card { padding: 32px; max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.modal-header h3 { font-size: var(--font-lg); font-weight: 700; }
.btn-close { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: var(--juris-text-muted); cursor: pointer; border-radius: 6px; }
.btn-close:hover { background: var(--juris-border-light); color: var(--juris-text); }

.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-group label { font-size: var(--font-sm); font-weight: 500; color: var(--juris-text); }
.form-input { width: 100%; padding: 10px 14px; border: 1px solid var(--juris-border); border-radius: 8px; font-size: var(--font-sm); font-family: var(--font-family); outline: none; background: var(--juris-surface); color: var(--juris-text); }
.form-input:focus { border-color: var(--juris-primary-lighter); box-shadow: 0 0 0 3px var(--juris-primary-100); }
textarea.form-input { resize: vertical; }

.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.btn-cancel { padding: 10px 20px; background: none; border: 1px solid var(--juris-border); border-radius: 10px; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }
.btn-submit { padding: 10px 20px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-weight: 600; font-size: var(--font-sm); cursor: pointer; font-family: var(--font-family); }

/* Label picker colors in modal */
.lp-urgent { color: var(--juris-danger); }
.lp-a_relire { color: #E65100; }
.lp-important { color: var(--juris-secondary-dark); }
.lp-en_cours { color: var(--juris-info); }
.lp-termine { color: var(--juris-success); }
.lp-question { color: #7B1FA2; }
.label-picker-btn.active.lp-urgent { background: rgba(198, 40, 40, 0.08); border-color: var(--juris-danger); }
.label-picker-btn.active.lp-a_relire { background: rgba(249, 168, 37, 0.08); border-color: #E65100; }
.label-picker-btn.active.lp-important { background: rgba(198, 148, 42, 0.08); border-color: var(--juris-secondary-dark); }
.label-picker-btn.active.lp-en_cours { background: rgba(21, 101, 192, 0.08); border-color: var(--juris-info); }
.label-picker-btn.active.lp-termine { background: rgba(46, 125, 50, 0.08); border-color: var(--juris-success); }
.label-picker-btn.active.lp-question { background: rgba(123, 31, 162, 0.08); border-color: #7B1FA2; }

/* Sections */
.reminders-sections { display: flex; flex-direction: column; gap: 24px; }
.reminder-section { display: flex; flex-direction: column; gap: 10px; }

.section-heading { display: flex; align-items: center; gap: 8px; font-size: var(--font-sm); font-weight: 700; padding-bottom: 8px; border-bottom: 1px solid var(--juris-border-light); }
.overdue-heading { color: var(--juris-danger); }
.today-heading { color: var(--juris-warning); }
.upcoming-heading { color: var(--juris-primary); }
.completed-heading { color: var(--juris-text-secondary); }

.count-chip { background: currentColor; color: white; font-size: 0.65rem; padding: 1px 6px; border-radius: var(--radius-full); opacity: 0.85; }

.reminders-list { display: flex; flex-direction: column; gap: 8px; }

/* Reminder card action buttons (used in defineComponent render fn) */
:deep(.action-btn) { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; cursor: pointer; border-radius: 6px; }
:deep(.complete-btn) { color: var(--juris-success); }
:deep(.complete-btn:hover) { background: rgba(46, 125, 50, 0.1); }
:deep(.delete-btn) { color: var(--juris-text-muted); }
:deep(.delete-btn:hover) { background: rgba(198, 40, 40, 0.08); color: var(--juris-danger); }

/* Empty state */
.empty-state { text-align: center; padding: 48px 32px; }
.empty-icon { color: var(--juris-text-muted); margin-bottom: 16px; }
.empty-state h3 { font-size: var(--font-lg); font-weight: 600; margin-bottom: 8px; }
.empty-state p { font-size: var(--font-sm); color: var(--juris-text-secondary); margin-bottom: 20px; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 16px; }
}
</style>
