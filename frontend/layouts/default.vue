<template>
  <div class="app-layout">
    <!-- Top Navigation -->
    <header class="app-header glass-card">
      <div class="header-left">
        <NuxtLink to="/" class="logo">
          <span class="gradient-text logo-text">Juristique.bj</span>
        </NuxtLink>
      </div>

      <nav class="header-nav">
        <NuxtLink to="/recherche" class="nav-link">
          <Search :size="18" />
          <span>Recherche</span>
        </NuxtLink>
        <NuxtLink to="/pays" class="nav-link">
          <Globe :size="18" />
          <span>Pays</span>
        </NuxtLink>
        <NuxtLink to="/themes" class="nav-link">
          <BookOpen :size="18" />
          <span>Thèmes</span>
        </NuxtLink>
      </nav>

      <div class="header-right">
        <button class="btn-login hover-lift">
          Se connecter
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; 2026 Juristique.bj — Droit africain francophone</p>
        <p class="footer-stats">26 pays · 42 thèmes · Textes juridiques vérifiés</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Search, Globe, BookOpen } from 'lucide-vue-next';
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: var(--header-height);
  border-bottom: 1px solid var(--juris-border-light);
  background: rgba(255, 255, 255, 0.9) !important;
}

.logo-text {
  font-size: var(--font-xl);
  font-weight: 700;
}

.header-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--juris-text-secondary);
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: var(--juris-primary-50);
  color: var(--juris-primary);
}

.btn-login {
  padding: 8px 20px;
  border-radius: 10px;
  border: 1px solid var(--juris-primary);
  background: transparent;
  color: var(--juris-primary);
  font-size: var(--font-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-login:hover {
  background: var(--juris-primary);
  color: white;
}

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  border-top: 1px solid var(--juris-border);
  padding: 24px;
  text-align: center;
}

.footer-content p {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
}

.footer-stats {
  margin-top: 4px;
  font-size: var(--font-xs) !important;
  color: var(--juris-text-muted) !important;
}

@media (max-width: 768px) {
  .header-nav span {
    display: none;
  }

  .app-main {
    padding: 16px;
  }
}
</style>
