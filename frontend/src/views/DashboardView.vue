<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { fetchTerrains, fetchCustomers, fetchContracts } from '@/services/api';
import type { Terrain, Customer, Contract } from '@/types';

interface Activity {
  id: string;
  type: 'terrain' | 'customer' | 'contract';
  action: string;
  name: string;
  date: string;
  icon: string;
}

const stats = ref({ terrains: 0, customers: 0, contracts: 0, activeContracts: 0 });
const activities = ref<Activity[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [terrains, customers, contracts] = await Promise.all([
      fetchTerrains(),
      fetchCustomers(),
      fetchContracts(),
    ]);

    stats.value = {
      terrains: terrains.length,
      customers: customers.length,
      contracts: contracts.length,
      activeContracts: contracts.filter((c: Contract) => c.status === 'active').length,
    };

    // Build recent activity
    const allActivities: Activity[] = [
      ...terrains.map((t: Terrain) => ({
        id: t.id,
        type: 'terrain' as const,
        action: 'Terrain ajouté',
        name: t.name,
        date: t.createdAt,
        icon: '🗺️',
      })),
      ...customers.map((c: Customer) => ({
        id: c.id,
        type: 'customer' as const,
        action: 'Client ajouté',
        name: c.name,
        date: c.createdAt,
        icon: '👤',
      })),
      ...contracts.map((c: Contract) => ({
        id: c.id,
        type: 'contract' as const,
        action: 'Contrat créé',
        name: c.contractNumber || 'Sans numéro',
        date: c.createdAt,
        icon: '📜',
      })),
    ];

    allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    activities.value = allActivities.slice(0, 8);
  } catch (err) {
    console.error('Erreur chargement tableau de bord:', err);
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p class="text-muted-foreground mt-1">Aperçu de votre système de gestion foncière</p>
      </div>
      <div class="flex items-center gap-2">
         <RouterLink to="/terrains/nouveau" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          + Ajout Rapide
        </RouterLink>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <!-- Terrains Card -->
      <RouterLink to="/terrains" class="rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 block">
        <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium text-muted-foreground">Terrains</h3>
          <span class="text-muted-foreground">🗺️</span>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold">{{ stats.terrains }}</div>
          <p class="text-xs text-muted-foreground mt-1">Terrains enregistrés</p>
        </div>
      </RouterLink>

      <!-- Clients Card -->
      <RouterLink to="/clients" class="rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 block">
        <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium text-muted-foreground">Clients</h3>
          <span class="text-muted-foreground">👥</span>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold">{{ stats.customers }}</div>
          <p class="text-xs text-muted-foreground mt-1">Clients actifs</p>
        </div>
      </RouterLink>

      <!-- Active Contracts Card -->
      <RouterLink to="/contrats" class="rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 block">
        <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium text-muted-foreground">Contrats Actifs</h3>
          <span class="text-muted-foreground">📜</span>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold">{{ stats.activeContracts }}</div>
          <p class="text-xs text-muted-foreground mt-1">En cours d'exécution</p>
        </div>
      </RouterLink>

      <!-- Total Contracts Card -->
      <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium text-muted-foreground">Total Contrats</h3>
          <span class="text-muted-foreground">📐</span>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold">{{ stats.contracts }}</div>
          <p class="text-xs text-muted-foreground mt-1">Historique complet</p>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <!-- Activity Feed (Col span 4) -->
      <div class="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
        <div class="p-6 flex flex-col space-y-1.5">
          <h3 class="font-semibold leading-none tracking-tight">Activité Récente</h3>
          <p class="text-sm text-muted-foreground">Derniers événements sur la plateforme</p>
        </div>
        <div class="p-6 pt-0">
           <div v-if="loading" class="flex items-center justify-center py-8">
             <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           </div>
           <div v-else-if="activities.length === 0" class="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
             <span class="text-4xl mb-2 opacity-50">📋</span>
             <p>Aucune activité récente</p>
           </div>
           <div v-else class="space-y-4">
             <div v-for="activity in activities" :key="activity.id" class="flex items-center">
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground mr-4 text-sm">
                  {{ activity.icon }}
                </span>
                <div class="space-y-1">
                  <p class="text-sm font-medium leading-none">{{ activity.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ activity.action }}</p>
                </div>
                <div class="ml-auto font-medium text-xs text-muted-foreground">{{ formatDate(activity.date) }}</div>
             </div>
           </div>
        </div>
      </div>

      <!-- Quick Actions / Summary (Col span 3) -->
      <div class="col-span-3 space-y-4">
         <!-- Quick Actions -->
         <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div class="p-6 flex flex-col space-y-1.5">
              <h3 class="font-semibold leading-none tracking-tight">Actions Rapides</h3>
            </div>
            <div class="p-6 pt-0 grid grid-cols-2 gap-2">
                <RouterLink to="/terrains/nouveau" class="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors text-center">
                  <span class="text-2xl">🗺️</span>
                  <span class="text-xs font-medium">Nouveau Terrain</span>
                </RouterLink>
                <RouterLink to="/clients/nouveau" class="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors text-center">
                  <span class="text-2xl">👤</span>
                  <span class="text-xs font-medium">Nouveau Client</span>
                </RouterLink>
                 <RouterLink to="/contrats/nouveau" class="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors text-center col-span-2">
                  <span class="text-2xl">📜</span>
                  <span class="text-xs font-medium">Créer un Contrat</span>
                </RouterLink>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>
