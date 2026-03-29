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
        <NuxtLink v-if="isAuthenticated" to="/dossiers" class="nav-link">
          <FolderOpen :size="18" />
          <span>Dossiers</span>
        </NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/rappels" class="nav-link">
          <Clock :size="18" />
          <span>Rappels</span>
        </NuxtLink>
      </nav>

      <div class="header-right">
        <template v-if="isAuthenticated">
          <NuxtLink to="/profil" class="user-chip hover-lift">
            <div class="user-avatar-sm">{{ userInitials }}</div>
            <span class="user-name-sm">{{ user?.fullName?.split(' ')[0] }}</span>
          </NuxtLink>
          <button class="btn-logout hover-lift" @click="logout">
            <LogOut :size="16" />
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/connexion" class="btn-login hover-lift">Se connecter</NuxtLink>
        </template>
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
import { Search, Globe, BookOpen, LogOut, FolderOpen, Clock } from 'lucide-vue-next';
import { computed } from 'vue';

const { user, isAuthenticated, logout } = useAuth();

const userInitials = computed(() => {
  if (!user.value?.fullName) return '?';
  return user.value.fullName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});
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

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 5px;
  border-radius: var(--radius-full);
  border: 1px solid var(--juris-border);
  background: var(--juris-surface);
  text-decoration: none;
  transition: all 0.2s ease;
}

.user-chip:hover {
  border-color: var(--juris-primary-lighter);
  background: var(--juris-primary-50);
}

.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--juris-gradient-primary);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name-sm {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-text);
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--juris-border);
  background: transparent;
  color: var(--juris-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  border-color: var(--juris-danger, #c62828);
  color: var(--juris-danger, #c62828);
  background: rgba(198, 40, 40, 0.06);
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
