<template>
  <div class="forgot-page fade-in-up">
    <h1>Mot de passe oublié</h1>
    <p class="subtitle">Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>

    <div v-if="sent" class="success-msg glass-card">
      <CheckCircle :size="32" class="success-icon" />
      <p>Un e-mail de réinitialisation a été envoyé à <strong>{{ email }}</strong>. Vérifiez votre boîte de réception.</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="auth-form">
      <div v-if="error" class="error-alert">{{ error }}</div>

      <div class="form-group">
        <label>Adresse e-mail</label>
        <div class="input-wrapper">
          <Mail :size="18" class="input-icon" />
          <input v-model="email" type="email" placeholder="votre@email.com" class="form-input" required />
        </div>
      </div>

      <button type="submit" class="btn-submit" :disabled="loading">
        <Loader2 v-if="loading" :size="18" class="spin" />
        <span>{{ loading ? 'Envoi...' : 'Envoyer le lien' }}</span>
      </button>
    </form>

    <p class="back-link">
      <NuxtLink to="/connexion">← Retour à la connexion</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { Mail, Loader2, CheckCircle } from 'lucide-vue-next';
import { ref } from 'vue';

definePageMeta({ layout: 'auth' });

const config = useRuntimeConfig();
const email = ref('');
const loading = ref(false);
const sent = ref(false);
const error = ref('');

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  try {
    await $fetch(`${config.public.apiBaseUrl}/auth/forgot-password`, {
      method: 'POST',
      body: { email: email.value },
    });
    sent.value = true;
  } catch (e: any) {
    error.value = e?.data?.message || 'Une erreur est survenue. Vérifiez votre adresse e-mail.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-page h1 { font-size: var(--font-2xl); font-weight: 700; color: var(--juris-text); margin-bottom: 4px; }
.subtitle { color: var(--juris-text-secondary); font-size: var(--font-sm); margin-bottom: 32px; }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: var(--font-sm); font-weight: 500; color: var(--juris-text); }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 14px; color: var(--juris-text-muted); pointer-events: none; }
.form-input { width: 100%; padding: 12px 16px 12px 44px; border: 1px solid var(--juris-border); border-radius: 10px; font-size: var(--font-sm); font-family: var(--font-family); color: var(--juris-text); background: var(--juris-surface); transition: all 0.2s ease; outline: none; }
.form-input:focus { border-color: var(--juris-primary-lighter); box-shadow: 0 0 0 3px var(--juris-primary-100); }
.btn-submit { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-size: var(--font-base); font-weight: 600; font-family: var(--font-family); cursor: pointer; }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-glow-primary); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-alert { padding: 12px 16px; background: rgba(198, 40, 40, 0.08); color: var(--juris-danger); border-radius: var(--radius-md); font-size: var(--font-sm); }
.success-msg { padding: 32px; text-align: center; }
.success-icon { color: var(--juris-success); margin-bottom: 12px; }
.success-msg p { font-size: var(--font-sm); color: var(--juris-text-secondary); line-height: 1.6; }
.back-link { margin-top: 24px; text-align: center; font-size: var(--font-sm); }
.back-link a { color: var(--juris-primary-light); }
</style>
