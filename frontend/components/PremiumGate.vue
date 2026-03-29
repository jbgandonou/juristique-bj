<template>
  <div v-if="isPremium">
    <slot />
  </div>
  <div v-else class="premium-gate">
    <div class="premium-gate-overlay">
      <div class="premium-gate-content glass-card">
        <Crown :size="32" class="premium-icon" />
        <h3>{{ title || 'Fonctionnalité Premium' }}</h3>
        <p>{{ description || 'Passez à Premium pour accéder à cette fonctionnalité.' }}</p>
        <NuxtLink to="/tarifs" class="btn-upgrade hover-lift">
          <Crown :size="16" />
          Passer à Premium
        </NuxtLink>
      </div>
    </div>
    <div class="premium-gate-preview" aria-hidden="true">
      <slot name="preview" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Crown } from 'lucide-vue-next';

defineProps<{
  title?: string;
  description?: string;
}>();

const { isPremium } = useAuth();
</script>

<style scoped>
.premium-gate {
  position: relative;
}

.premium-gate-preview {
  filter: blur(4px);
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
  max-height: 300px;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
}

.premium-gate-overlay {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 32px 16px;
}

.premium-gate-content {
  text-align: center;
  padding: 32px 40px;
  max-width: 400px;
}

.premium-icon {
  color: var(--juris-secondary);
  margin-bottom: 12px;
}

.premium-gate-content h3 {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 8px;
}

.premium-gate-content p {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  margin-bottom: 20px;
  line-height: 1.6;
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--juris-gradient-gold);
  color: white;
  border-radius: 10px;
  font-weight: 600;
  font-size: var(--font-sm);
  transition: all 0.2s ease;
}

.btn-upgrade:hover {
  color: white;
  box-shadow: var(--shadow-glow-gold);
  transform: translateY(-1px);
}
</style>
