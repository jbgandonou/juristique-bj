<template>
  <div class="auth-layout">
    <div class="auth-left">
      <div class="auth-left-content">
        <NuxtLink to="/" class="auth-logo">Jus Africa</NuxtLink>
        <h2>Droit Africain Francophone</h2>
        <p>Accédez à tous les textes juridiques de 26 pays, classés par thème et vérifiés par des juristes professionnels.</p>
        <div class="auth-features">
          <div class="auth-feature">
            <Search :size="20" />
            <span>Recherche intelligente</span>
          </div>
          <div class="auth-feature">
            <Bell :size="20" />
            <span>Alertes veille juridique</span>
          </div>
          <div class="auth-feature">
            <MessageSquare :size="20" />
            <span>Commentaires & analyses</span>
          </div>
        </div>
      </div>
      <!-- Floating decorative icons -->
      <div class="floating-icons">
        <ScrollText :size="32" class="float-icon float-1" />
        <Scale :size="28" class="float-icon float-2" />
        <Shield :size="30" class="float-icon float-3" />
        <BookOpen :size="26" class="float-icon float-4" />
      </div>
    </div>
    <div class="auth-right">
      <div class="auth-form-container">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Bell, MessageSquare, ScrollText, Scale, Shield, BookOpen } from 'lucide-vue-next';
</script>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
}

.auth-left {
  flex: 1;
  background: var(--juris-gradient-sidebar);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow: hidden;
}

.auth-left::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -20%;
  width: 60%;
  height: 80%;
  background: radial-gradient(circle, rgba(255,255,255,0.06), transparent);
  pointer-events: none;
}

.auth-left-content {
  position: relative;
  z-index: 1;
  max-width: 400px;
}

.auth-logo {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: white;
  display: block;
  margin-bottom: 24px;
}

.auth-left h2 {
  font-size: var(--font-xl);
  font-weight: 600;
  margin-bottom: 12px;
  opacity: 0.95;
}

.auth-left p {
  font-size: var(--font-sm);
  line-height: 1.7;
  opacity: 0.75;
  margin-bottom: 32px;
}

.auth-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--font-sm);
  opacity: 0.85;
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  opacity: 0.06;
}

.float-1 { top: 10%; right: 15%; animation: floatUp 8s ease-in-out infinite; }
.float-2 { bottom: 20%; right: 25%; animation: floatUp 10s ease-in-out infinite 1s; }
.float-3 { top: 40%; left: 10%; animation: floatUp 9s ease-in-out infinite 2s; }
.float-4 { bottom: 10%; left: 20%; animation: floatUp 7s ease-in-out infinite 0.5s; }

@keyframes floatUp {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

.auth-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  background: var(--juris-surface);
}

.auth-form-container {
  width: 100%;
  max-width: 420px;
}

@media (max-width: 768px) {
  .auth-layout {
    flex-direction: column;
  }

  .auth-left {
    padding: 32px 24px;
    min-height: auto;
  }

  .auth-left h2,
  .auth-left p,
  .auth-features,
  .floating-icons {
    display: none;
  }

  .auth-right {
    padding: 32px 24px;
  }
}
</style>
