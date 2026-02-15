<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import MetricsCard from '@/components/MetricsCard.vue';
import { Button } from '@/components/ui/button';
import { LandPlot, Users, FileText, Plus, User as UserIcon, CheckCircle2 } from '@/lib/icons';
import type { Component } from 'vue';
import { fetchTerrains, fetchCustomers, fetchContracts } from '@/services/api';
import type { Terrain, Customer, Contract } from '@/types';

interface Activity {
  id: string;
  type: 'terrain' | 'customer' | 'contract';
  action: string;
  name: string;
  date: string;
  icon: Component;
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
        icon: LandPlot,
      })),
      ...customers.map((c: Customer) => ({
        id: c.id,
        type: 'customer' as const,
        action: 'Client ajouté',
        name: c.name,
        date: c.createdAt,
        icon: UserIcon,
      })),
      ...contracts.map((c: Contract) => ({
        id: c.id,
        type: 'contract' as const,
        action: 'Contrat créé',
        name: c.contractNumber || 'Sans numéro',
        date: c.createdAt,
        icon: FileText,
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
        <Button as-child>
          <RouterLink to="/terrains/nouveau">
            <Plus class="mr-2 h-4 w-4" />
            Ajout Rapide
          </RouterLink>
        </Button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <!-- Terrains Card -->
      <RouterLink to="/terrains" class="block group no-underline">
        <MetricsCard 
          title="Terrains"
          :value="stats.terrains"
          :icon="LandPlot"
          status="info"
          :progress="75"
          :trend="12"
          class="h-full"
        />
      </RouterLink>

      <!-- Clients Card -->
      <RouterLink to="/clients" class="block group no-underline">
        <MetricsCard 
          title="Clients"
          :value="stats.customers"
          :icon="Users"
          status="warning"
          :progress="60"
          :trend="5"
          class="h-full"
        />
      </RouterLink>

      <!-- Active Contracts Card -->
      <RouterLink to="/contrats" class="block group no-underline">
        <MetricsCard 
          title="Contrats Actifs"
          :value="stats.activeContracts"
          :icon="CheckCircle2"
          status="success"
          :progress="88"
          :trend="24"
          class="h-full"
        />
      </RouterLink>

      <!-- Total Contracts Card -->
      <RouterLink to="/contrats" class="block group no-underline">
        <MetricsCard 
          title="Total Contrats"
          :value="stats.contracts"
          :icon="FileText"
          status="info"
          :progress="45"
          :trend="-2"
          class="h-full"
        />
      </RouterLink>
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
             <FileText class="h-12 w-12 mb-4 opacity-50" :stroke-width="1.5" />
             <p>Aucune activité récente</p>
           </div>
           <div v-else class="space-y-4">
             <div v-for="activity in activities" :key="activity.id" class="flex items-center">
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground mr-4">
                  <component :is="activity.icon" class="h-4 w-4" :stroke-width="1.5" />
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
                  <LandPlot class="h-6 w-6 text-muted-foreground" :stroke-width="1.5" />
                  <span class="text-xs font-medium">Nouveau Terrain</span>
                </RouterLink>
                <RouterLink to="/clients/nouveau" class="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors text-center">
                  <UserIcon class="h-6 w-6 text-muted-foreground" :stroke-width="1.5" />
                  <span class="text-xs font-medium">Nouveau Client</span>
                </RouterLink>
                 <RouterLink to="/contrats/nouveau" class="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors text-center col-span-2">
                  <FileText class="h-6 w-6 text-muted-foreground" :stroke-width="1.5" />
                  <span class="text-xs font-medium">Créer un Contrat</span>
                </RouterLink>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>
