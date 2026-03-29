<template>
  <div class="reset-page fade-in-up">
    <h1>Nouveau mot de passe</h1>
    <p class="subtitle">Choisissez un nouveau mot de passe pour votre compte.</p>

    <div v-if="success" class="success-msg glass-card">
      <CheckCircle :size="32" class="success-icon" />
      <p>Votre mot de passe a été réinitialisé avec succès.</p>
      <NuxtLink to="/connexion" class="btn-primary">Se connecter</NuxtLink>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="auth-form">
      <div v-if="error" class="error-alert">{{ error }}</div>

      <div class="form-group">
        <label>Nouveau mot de passe</label>
        <div class="input-wrapper">
          <Lock :size="18" class="input-icon" />
          <input v-model="password" type="password" placeholder="Minimum 8 caractères" class="form-input" required minlength="8" />
        </div>
      </div>

      <div class="form-group">
        <label>Confirmer le mot de passe</label>
        <div class="input-wrapper">
          <Lock :size="18" class="input-icon" />
          <input v-model="confirmPassword" type="password" placeholder="Répétez le mot de passe" class="form-input" required />
        </div>
      </div>

      <button type="submit" class="btn-submit" :disabled="loading">
        <Loader2 v-if="loading" :size="18" class="spin" />
        <span>{{ loading ? 'Réinitialisation...' : 'Réinitialiser' }}</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Lock, Loader2, CheckCircle } from 'lucide-vue-next';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

definePageMeta({ layout: 'auth' });

const route = useRoute();
const config = useRuntimeConfig();
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const success = ref(false);
const error = ref('');

const handleSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await $fetch(`${config.public.apiBaseUrl}/auth/reset-password`, {
      method: 'POST',
      body: { token: route.query.token, password: password.value },
    });
    success.value = true;
  } catch (e: any) {
    error.value = e?.data?.message || 'Le lien de réinitialisation est invalide ou a expiré.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-page h1 { font-size: var(--font-2xl); font-weight: 700; color: var(--juris-text); margin-bottom: 4px; }
.subtitle { color: var(--juris-text-secondary); font-size: var(--font-sm); margin-bottom: 32px; }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: var(--font-sm); font-weight: 500; color: var(--juris-text); }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 14px; color: var(--juris-text-muted); pointer-events: none; }
.form-input { width: 100%; padding: 12px 16px 12px 44px; border: 1px solid var(--juris-border); border-radius: 10px; font-size: var(--font-sm); font-family: var(--font-family); color: var(--juris-text); background: var(--juris-surface); outline: none; }
.form-input:focus { border-color: var(--juris-primary-lighter); box-shadow: 0 0 0 3px var(--juris-primary-100); }
.btn-submit { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; background: var(--juris-gradient-primary); color: white; border: none; border-radius: 10px; font-size: var(--font-base); font-weight: 600; font-family: var(--font-family); cursor: pointer; }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-glow-primary); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-alert { padding: 12px 16px; background: rgba(198, 40, 40, 0.08); color: var(--juris-danger); border-radius: var(--radius-md); font-size: var(--font-sm); }
.success-msg { padding: 32px; text-align: center; }
.success-icon { color: var(--juris-success); margin-bottom: 12px; }
.success-msg p { font-size: var(--font-sm); color: var(--juris-text-secondary); margin-bottom: 20px; }
.btn-primary { display: inline-block; padding: 12px 28px; background: var(--juris-gradient-primary); color: white; border-radius: 10px; font-weight: 600; font-size: var(--font-sm); }
</style>
