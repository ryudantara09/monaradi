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
  <div class="app-layout bg-background text-foreground">
    <!-- Mobile Toggle -->
    <button class="md:hidden fixed top-4 left-4 z-50 p-2 border border-border rounded-md bg-background" @click="toggleSidebar" aria-label="Ouvrir le menu">
      {{ sidebarOpen ? '✕' : '☰' }}
    </button>

    <!-- Sidebar -->
    <aside class="sidebar w-[240px] bg-muted/10 border-r border-border fixed h-full z-40 transition-transform duration-300 ease-in-out" :class="{ '-translate-x-full': !sidebarOpen, 'translate-x-0': sidebarOpen, 'md:translate-x-0': true }">
      <div class="p-6 border-b border-border/40">
        <RouterLink to="/" class="flex items-center gap-2" @click="closeSidebar">
          <div class="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">M</div>
          <span class="text-lg font-bold tracking-tight">Monaradi</span>
        </RouterLink>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors relative"
          :class="[
            isActive(item.path, item.exact) 
              ? 'text-primary bg-accent' 
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          ]"
          @click="closeSidebar"
        >
          <!-- Active Indicator Bar -->
          <div v-if="isActive(item.path, item.exact)" class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></div>
          
          <span class="text-lg opacity-80 group-hover:opacity-100 transition-opacity">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-border/40">
        <div class="text-xs text-muted-foreground font-medium flex items-center gap-2">
          <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
          Monaradi v3.0
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content flex-1 md:ml-[240px] min-h-screen bg-background">
      <div class="container mx-auto p-6 md:p-8 max-w-7xl">
        <RouterView />
      </div>
    </main>
  </div>
</template>
