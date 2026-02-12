<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();
const sidebarOpen = ref(false);

const navItems = [
  { path: '/', label: 'Tableau de bord', icon: '🏠', exact: true },
  { path: '/terrains', label: 'Terrains', icon: '🗺️' },
  { path: '/clients', label: 'Clients', icon: '👥' },
  { path: '/parcelles', label: 'Parcelles', icon: '📐' },
  { path: '/contrats', label: 'Contrats', icon: '📜' },
  { path: '/documents', label: 'Documents', icon: '📂' },
];

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

function isActive(path: string, exact?: boolean): boolean {
  if (exact) return route.path === path;
  return route.path.startsWith(path);
}
</script>

<template>
  <div class="app-layout">
    <!-- Mobile Toggle -->
    <button class="sidebar-toggle" @click="toggleSidebar" aria-label="Ouvrir le menu">
      {{ sidebarOpen ? '✕' : '☰' }}
    </button>

    <!-- Overlay for mobile -->
    <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="closeSidebar" />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <RouterLink to="/" class="sidebar-logo" @click="closeSidebar">
          <span class="logo-icon">🏔️</span>
          <span class="logo-text">Monaradi</span>
        </RouterLink>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="sidebar-nav-item"
          :class="{ 'router-link-active': isActive(item.path, item.exact) }"
          @click="closeSidebar"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-version">
          <span>⚡</span>
          <span>Monaradi v2.0</span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
