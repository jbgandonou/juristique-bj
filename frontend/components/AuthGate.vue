<template>
  <div v-if="isAuthenticated">
    <slot />
  </div>
  <div v-else class="auth-gate glass-card">
    <LogIn :size="28" class="auth-gate-icon" />
    <h3>{{ title || 'Connexion requise' }}</h3>
    <p>{{ description || 'Connectez-vous pour accéder à cette fonctionnalité.' }}</p>
    <NuxtLink :to="`/connexion?redirect=${currentPath}`" class="btn-login-gate hover-lift">
      Se connecter
    </NuxtLink>
    <p class="auth-gate-register">
      Pas de compte ? <NuxtLink to="/inscription">Créer un compte</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { LogIn } from 'lucide-vue-next';
import { useRoute } from 'vue-router';

defineProps<{
  title?: string;
  description?: string;
}>();

const { isAuthenticated } = useAuth();
const route = useRoute();
const currentPath = encodeURIComponent(route.fullPath);
</script>

<style scoped>
.auth-gate {
  text-align: center;
  padding: 40px 32px;
  max-width: 400px;
  margin: 20px auto;
}

.auth-gate-icon {
  color: var(--juris-primary-light);
  margin-bottom: 12px;
}

.auth-gate h3 {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 8px;
}

.auth-gate p {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  margin-bottom: 20px;
}

.btn-login-gate {
  display: inline-flex;
  padding: 12px 28px;
  background: var(--juris-gradient-primary);
  color: white;
  border-radius: 10px;
  font-weight: 600;
  font-size: var(--font-sm);
}

.btn-login-gate:hover {
  color: white;
}

.auth-gate-register {
  margin-top: 16px;
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

.auth-gate-register a {
  font-weight: 600;
  color: var(--juris-primary);
}
</style>
