<template>
  <div class="verify-page">
    <div class="verify-card glass-card fade-in-up">
      <Loader2 v-if="loading" :size="48" class="spin verify-icon" />
      <CheckCircle v-else-if="success" :size="48" class="verify-icon success" />
      <XCircle v-else :size="48" class="verify-icon error" />

      <h1>{{ loading ? 'Vérification en cours...' : success ? 'E-mail vérifié !' : 'Erreur de vérification' }}</h1>
      <p v-if="success">Votre adresse e-mail a été vérifiée avec succès. Vous pouvez maintenant profiter pleinement de Juristique.bj.</p>
      <p v-else-if="!loading">{{ errorMsg }}</p>

      <NuxtLink v-if="!loading" :to="success ? '/profil' : '/connexion'" class="btn-primary">
        {{ success ? 'Accéder à mon profil' : 'Se connecter' }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2, CheckCircle, XCircle } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const config = useRuntimeConfig();
const loading = ref(true);
const success = ref(false);
const errorMsg = ref('Le lien de vérification est invalide ou a expiré.');

onMounted(async () => {
  const token = route.query.token as string;
  if (!token) {
    loading.value = false;
    return;
  }

  try {
    await $fetch(`${config.public.apiBaseUrl}/auth/verify-email`, {
      method: 'POST',
      body: { token },
    });
    success.value = true;
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Le lien de vérification est invalide ou a expiré.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.verify-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.verify-card {
  text-align: center;
  padding: 48px 40px;
  max-width: 440px;
}

.verify-icon {
  color: var(--juris-text-muted);
  margin-bottom: 20px;
}

.verify-icon.success { color: var(--juris-success); }
.verify-icon.error { color: var(--juris-danger); }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.verify-card h1 {
  font-size: var(--font-xl);
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--juris-text);
}

.verify-card p {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  margin-bottom: 24px;
  line-height: 1.6;
}

.btn-primary {
  display: inline-block;
  padding: 12px 28px;
  background: var(--juris-gradient-primary);
  color: white;
  border-radius: 10px;
  font-weight: 600;
  font-size: var(--font-sm);
}
</style>
