<template>
  <div class="login-page fade-in-up">
    <h1>Connexion</h1>
    <p class="subtitle">Accédez à votre compte Juristique.bj</p>

    <form @submit.prevent="handleLogin" class="auth-form">
      <div class="form-group">
        <label for="email">Adresse e-mail</label>
        <div class="input-wrapper">
          <Mail :size="18" class="input-icon" />
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="votre@email.com"
            class="form-input"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="password">Mot de passe</label>
        <div class="input-wrapper">
          <Lock :size="18" class="input-icon" />
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Votre mot de passe"
            class="form-input"
            required
          />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            <component :is="showPassword ? EyeOff : Eye" :size="18" />
          </button>
        </div>
      </div>

      <div class="form-row">
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.remember" />
          <span>Se souvenir de moi</span>
        </label>
        <NuxtLink to="/mot-de-passe-oublie" class="forgot-link">Mot de passe oublié ?</NuxtLink>
      </div>

      <!-- Error message -->
      <div v-if="errorMessage" class="error-alert">
        {{ errorMessage }}
      </div>

      <button type="submit" class="btn-submit" :disabled="loading">
        <Loader2 v-if="loading" :size="18" class="spin" />
        <span>{{ loading ? 'Connexion...' : 'Se connecter' }}</span>
      </button>

      <div class="divider">
        <span>ou</span>
      </div>

      <button type="button" class="btn-google hover-lift">
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        <span>Continuer avec Google</span>
      </button>
    </form>

    <p class="switch-auth">
      Pas encore de compte ?
      <NuxtLink to="/inscription">Créer un compte</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({ layout: 'auth' });

const router = useRouter();
const { login } = useAuth();

const form = ref({ email: '', password: '', remember: false });
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    await login(form.value.email, form.value.password);
    router.push('/profil');
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Identifiants incorrects. Veuillez réessayer.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.error-alert {
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(198, 40, 40, 0.08);
  border: 1px solid rgba(198, 40, 40, 0.25);
  color: var(--juris-danger, #c62828);
  font-size: var(--font-sm);
  font-weight: 500;
}

.login-page h1 {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 4px;
}

.subtitle {
  color: var(--juris-text-secondary);
  font-size: var(--font-sm);
  margin-bottom: 32px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--juris-text);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--juris-text-muted);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid var(--juris-border);
  border-radius: 10px;
  font-size: var(--font-sm);
  font-family: var(--font-family);
  color: var(--juris-text);
  background: var(--juris-surface);
  transition: all 0.2s ease;
  outline: none;
}

.form-input:focus {
  border-color: var(--juris-primary-lighter);
  box-shadow: 0 0 0 3px var(--juris-primary-100);
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--juris-text-muted);
  padding: 4px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  cursor: pointer;
}

.checkbox-label input {
  accent-color: var(--juris-primary);
}

.forgot-link {
  font-size: var(--font-sm);
  color: var(--juris-primary-light);
}

.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: var(--juris-gradient-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: var(--font-base);
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-glow-primary);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--juris-text-muted);
  font-size: var(--font-sm);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--juris-border);
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background: var(--juris-surface);
  border: 1px solid var(--juris-border);
  border-radius: 10px;
  font-size: var(--font-sm);
  font-weight: 500;
  font-family: var(--font-family);
  color: var(--juris-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-google:hover {
  background: var(--juris-surface-hover);
}

.switch-auth {
  text-align: center;
  margin-top: 24px;
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
}

.switch-auth a {
  font-weight: 600;
  color: var(--juris-primary);
}
</style>
