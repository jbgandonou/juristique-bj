<template>
  <div class="not-found-page">
    <div class="not-found-content fade-in-up">
      <!-- Decorative Icon -->
      <div class="scale-icon">
        <Scale :size="80" />
      </div>

      <!-- 404 Number -->
      <div class="error-code gradient-text">404</div>

      <!-- Title & Message -->
      <h1 class="error-title">Page introuvable</h1>
      <p class="error-message">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>

      <!-- Back Button -->
      <NuxtLink to="/" class="back-btn">
        <ArrowLeft :size="18" />
        Retour à l'accueil
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Scale, ArrowLeft } from 'lucide-vue-next';

useHead({
  title: '404 — Page introuvable | Jus Africa',
});
</script>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 48px 24px;
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 480px;
}

.scale-icon {
  color: var(--juris-border);
  margin-bottom: 8px;
}

.error-code {
  font-size: 7rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -4px;
}

.error-title {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
  margin-top: 4px;
}

.error-message {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
  line-height: 1.6;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px 24px;
  background: var(--juris-gradient-primary);
  color: white;
  font-size: var(--font-sm);
  font-weight: 700;
  border-radius: var(--radius-lg);
  text-decoration: none;
  box-shadow: var(--shadow-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  color: white;
}

@media (max-width: 480px) {
  .error-code {
    font-size: 5rem;
  }

  .error-title {
    font-size: var(--font-xl);
  }
}
</style>
