<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ 'mobile-open': mobileMenuOpen }">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <NuxtLink to="/" class="sidebar-logo">
          <span class="logo-icon">
            <Scale :size="20" />
          </span>
          <span class="logo-text">Jus Africa</span>
        </NuxtLink>
        <button class="sidebar-close-btn" @click="mobileMenuOpen = false">
          <X :size="20" />
        </button>
      </div>

      <!-- Nav Items -->
      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-nav-item"
          @click="mobileMenuOpen = false"
        >
          <span class="nav-icon">
            <component :is="item.icon" :size="18" />
          </span>
          <span class="nav-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <NuxtLink to="/" class="sidebar-footer-link">
          <Globe :size="16" />
          <span>Voir le site</span>
        </NuxtLink>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div
      v-if="mobileMenuOpen"
      class="mobile-overlay"
      @click="mobileMenuOpen = false"
    />

    <!-- Main area -->
    <div class="admin-main-area">
      <!-- Top Bar -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" @click="mobileMenuOpen = !mobileMenuOpen">
            <Menu :size="20" />
          </button>
          <h1 class="topbar-title">Administration</h1>
        </div>
        <div class="topbar-right">
          <button class="topbar-icon-btn">
            <Bell :size="18" />
          </button>
          <div class="user-avatar">
            <span>AD</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="admin-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  LayoutDashboard, ClipboardList, FileText, Database,
  Globe, Users, Shield, Scale, Menu, X, Bell,
} from 'lucide-vue-next';

const sidebarCollapsed = ref(false);
const mobileMenuOpen = ref(false);

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/queue', label: 'Queue éditoriale', icon: ClipboardList },
  { to: '/admin/textes', label: 'Textes', icon: FileText },
  { to: '/admin/pipeline', label: 'Pipeline', icon: Database },
  { to: '/admin/sources', label: 'Sources', icon: Globe },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/moderation', label: 'Modération', icon: Shield },
];
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--juris-bg);
}

/* ---- Sidebar ---- */
.admin-sidebar {
  width: var(--sidebar-width);
  min-height: 100vh;
  background: var(--juris-gradient-sidebar);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Subtle radial overlay */
.admin-sidebar::before {
  content: '';
  position: absolute;
  top: -20%;
  right: -30%;
  width: 70%;
  height: 60%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.06), transparent);
  pointer-events: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 1;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  text-decoration: none;
}

.logo-icon {
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  font-size: var(--font-base);
  font-weight: 700;
  color: white;
  white-space: nowrap;
}

.sidebar-close-btn {
  display: none;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: color 0.2s;
}

.sidebar-close-btn:hover {
  color: white;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  z-index: 1;
  overflow-y: auto;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-sm);
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.sidebar-nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-nav-item.router-link-exact-active,
.sidebar-nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 600;
}

.nav-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 1;
}

.sidebar-footer-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-sm);
  text-decoration: none;
  transition: all 0.2s ease;
}

.sidebar-footer-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

/* ---- Main Area ---- */
.admin-main-area {
  margin-left: var(--sidebar-width);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ---- Top Bar ---- */
.admin-topbar {
  height: var(--header-height);
  background: var(--juris-surface);
  border-bottom: 1px solid var(--juris-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hamburger-btn {
  background: none;
  border: none;
  color: var(--juris-text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-md);
  display: none;
  transition: all 0.2s;
}

.hamburger-btn:hover {
  background: var(--juris-primary-50);
  color: var(--juris-primary);
}

.topbar-title {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--juris-text);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-icon-btn {
  width: 36px;
  height: 36px;
  background: none;
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-md);
  color: var(--juris-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.topbar-icon-btn:hover {
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  border-color: var(--juris-primary-lighter);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: var(--juris-gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-xs);
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

/* ---- Content ---- */
.admin-content {
  flex: 1;
  padding: 28px 28px;
  min-width: 0;
}

/* ---- Mobile overlay ---- */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 150;
  backdrop-filter: blur(2px);
}

/* ---- Responsive ---- */
@media (max-width: 900px) {
  .admin-sidebar {
    transform: translateX(-100%);
  }

  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar-close-btn {
    display: flex;
  }

  .admin-main-area {
    margin-left: 0;
  }

  .hamburger-btn {
    display: flex;
  }

  .mobile-overlay {
    display: block;
  }

  .admin-content {
    padding: 20px 16px;
  }
}
</style>
