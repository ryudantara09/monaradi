<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { 
  LayoutDashboard, 
  LandPlot, 
  Users, 
  Square, 
  FileText, 
  FolderOpen, 
  X, 
  Menu, 
  Search, 
  Plus, 
  Settings, 
  LogOut 
} from '@/lib/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeMode, type ThemeMode } from '@/composables/useThemeMode';
import type { Component } from 'vue';

const route = useRoute();
const sidebarOpen = ref(false);
const { mode: themeMode, setMode } = useThemeMode();

interface NavItem {
  path: string;
  label: string;
  icon: Component;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { path: '/terrains', label: 'Terrains', icon: LandPlot },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/parcelles', label: 'Parcelles', icon: Square },
  { path: '/contrats', label: 'Contrats', icon: FileText },
  { path: '/documents', label: 'Documents', icon: FolderOpen },
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

function onThemeModeChange(value: unknown) {
  if (value === 'light' || value === 'dark' || value === 'system') {
    setMode(value as ThemeMode);
  }
}
</script>

<template>
  <div class="app-layout min-h-screen bg-background text-foreground flex font-sans">
    <!-- Mobile Toggle -->
    <button 
      class="md:hidden fixed top-4 left-4 z-50 p-2 border border-border rounded-md bg-background shadow-md" 
      @click="toggleSidebar" 
      aria-label="Toggle menu"
    >
      <X v-if="sidebarOpen" class="h-5 w-5" :stroke-width="1.5" />
      <Menu v-else class="h-5 w-5" :stroke-width="1.5" />
    </button>
    
    <!-- Overlay for mobile -->
    <div 
      v-if="sidebarOpen" 
      class="fixed inset-0 bg-black/50 z-30 md:hidden"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside 
      class="fixed left-0 top-0 bottom-0 z-40 w-[280px] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- User Profile Trigger / Logo Area -->
      <div class="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar shrink-0">
        <RouterLink to="/" class="flex items-center gap-3 w-full" @click="closeSidebar">
          <div class="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">M</div>
          <span class="text-lg font-bold tracking-tight text-sidebar-foreground">Monaradi</span>
        </RouterLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu Principal</div>
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 relative"
          :class="[
            isActive(item.path, item.exact) 
              ? 'bg-sidebar-accent text-primary' 
              : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
          ]"
          @click="closeSidebar"
        >
          <component 
            :is="item.icon" 
            class="h-5 w-5 transition-colors" 
            :class="isActive(item.path, item.exact) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'"
            :stroke-width="1.5" 
          />
          <span>{{ item.label }}</span>
          
          <!-- Active Indicator -->
          <div v-if="isActive(item.path, item.exact)" class="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(76,167,88,0.5)]"></div>
        </RouterLink>
      </nav>

      <!-- User Account Section (Fixed Bottom) -->
      <div class="p-4 border-t border-sidebar-border bg-sidebar">
        <button class="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left group">
          <Avatar class="h-9 w-9 border border-sidebar-border">
            <AvatarImage src="https://github.com/shadcn.png" alt="@maatarmed" />
            <AvatarFallback class="bg-primary/10 text-primary">MM</AvatarFallback>
          </Avatar>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">Maatar Med</p>
            <p class="text-xs text-muted-foreground truncate">admin@monaradi.com</p>
          </div>
          <LogOut class="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
        </button>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="flex-1 flex flex-col min-h-screen md:ml-[280px] transition-all duration-300">
      <!-- Top Header -->
      <header class="h-16 sticky top-0 z-20 bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/60 border-b border-sidebar-border flex items-center justify-between px-4 md:px-6 gap-3 md:gap-4">
        <!-- Search -->
        <div class="flex-1 max-w-xl mx-auto hidden md:block">
          <div class="relative group">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              class="w-full h-10 pl-10 pr-4 rounded-full bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm transition-all placeholder:text-muted-foreground/70"
            />
          </div>
        </div>

        <!-- Right Definitions -->
        <div class="flex items-center gap-3 ml-auto">
          <button class="md:hidden p-2 text-muted-foreground hover:text-foreground">
            <Search class="h-5 w-5" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button class="p-2 text-muted-foreground hover:text-foreground relative" aria-label="Choisir le mode d'affichage">
                <Settings class="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44">
              <DropdownMenuLabel>Apparence</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup :model-value="themeMode" @update:model-value="onThemeModeChange">
                <DropdownMenuRadioItem value="light">Clair</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Sombre</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">Système</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button class="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 rounded-full text-sm font-medium transition-all shadow-[0_0_15px_rgba(76,167,88,0.25)] flex items-center gap-2">
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline">Créer</span>
          </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 p-4 sm:p-5 md:p-8 bg-background overflow-x-hidden">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Any component-specific styles if needed, mostly handled by Tailwind */
</style>
