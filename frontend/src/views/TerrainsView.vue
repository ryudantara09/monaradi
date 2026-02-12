<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { fetchTerrains } from '@/services/api';
import type { Terrain } from '@/types';

const terrains = ref<Terrain[]>([]);
const searchQuery = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const loading = ref(true);

onMounted(async () => {
  try {
    terrains.value = await fetchTerrains();
  } catch (err) {
    console.error('Erreur chargement terrains:', err);
  } finally {
    loading.value = false;
  }
});

const filteredTerrains = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return terrains.value;
  return terrains.value.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.address?.toLowerCase().includes(q)
  );
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function formatArea(terrain: Terrain): string {
  if (!terrain.areaSize) return '—';
  const units: Record<string, string> = {
    sqm: 'm²', sqft: 'ft²', hectare: 'ha', acre: 'ac'
  };
  return `${terrain.areaSize.toLocaleString('fr-FR')} ${units[terrain.areaUnit] || terrain.areaUnit}`;
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Terrains</h1>
        <p class="text-muted-foreground mt-1">Gérez vos parcelles et propriétés foncières</p>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink to="/terrains/nouveau" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          + Ajouter Terrain
        </RouterLink>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-4">
      <div class="relative flex-1 max-w-sm">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
        <input
          type="text"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          placeholder="Rechercher terrains..."
          v-model="searchQuery"
        />
      </div>
      <div class="flex items-center gap-2 bg-muted p-1 rounded-md">
         <button
            class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            :class="viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'"
            @click="viewMode = 'grid'"
          >⊞</button>
          <button
            class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            :class="viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'"
            @click="viewMode = 'list'"
          >☰</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
      <p>Chargement des terrains...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTerrains.length === 0" class="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
      <span class="text-4xl mb-4 opacity-50">🗺️</span>
      <h2 class="text-xl font-semibold mb-2">Aucun terrain</h2>
      <p class="text-muted-foreground mb-6 max-w-sm">Commencez par ajouter votre première parcelle ou propriété.</p>
      <RouterLink to="/terrains/nouveau" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2">
        + Ajouter Premier Terrain
      </RouterLink>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink
        v-for="terrain in filteredTerrains"
        :key="terrain.id"
        :to="`/terrains/${terrain.id}`"
        class="group rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 flex flex-col gap-4 p-6 no-underline"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
             <div class="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xl">🗺️</div>
             <div>
                <div class="font-semibold leading-none tracking-tight text-foreground">{{ terrain.name }}</div>
                <div class="text-sm text-muted-foreground mt-1">{{ terrain.address || 'Pas d\'adresse' }}</div>
             </div>
          </div>
          <span 
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            :class="(terrain._count?.contracts || 0) > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'"
          >
            {{ (terrain._count?.contracts || 0) > 0 ? 'Vendu' : 'Non vendu' }}
          </span>
        </div>
        
        <div class="flex gap-4 text-sm text-muted-foreground">
          <span v-if="(terrain as any).owner" class="flex items-center gap-1">
            👤 {{ (terrain as any).owner.name }}
          </span>
          <span v-if="terrain.areaSize" class="flex items-center gap-1">
            📐 {{ formatArea(terrain) }}
          </span>
        </div>
        
        <div class="grid grid-cols-4 gap-2 pt-4 border-t mt-auto">
          <div class="flex flex-col items-center">
            <span class="font-bold text-lg">{{ terrain.parcels?.length || 0 }}</span>
            <span class="text-[10px] uppercase text-muted-foreground tracking-wider">Parcelles</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="font-bold text-lg">{{ terrain.parcels?.filter((p: any) => p.status === 'SOLD').length || 0 }}</span>
            <span class="text-[10px] uppercase text-muted-foreground tracking-wider">Vendues</span>
          </div>
          <div class="flex flex-col items-center">
             <span class="font-bold text-lg">{{ terrain._count?.contracts || 0 }}</span>
             <span class="text-[10px] uppercase text-muted-foreground tracking-wider">Contrats</span>
          </div>
          <div class="flex flex-col items-center">
             <span class="font-bold text-lg">{{ terrain._count?.documents || 0 }}</span>
             <span class="text-[10px] uppercase text-muted-foreground tracking-wider">Docs</span>
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- List View -->
    <div v-else class="rounded-md border bg-card">
      <div class="relative w-full overflow-auto">
        <table class="w-full caption-bottom text-sm">
          <thead class="[&_tr]:border-b">
            <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Nom</th>
              <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Propriétaire</th>
              <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Surface</th>
              <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
              <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Créé le</th>
            </tr>
          </thead>
          <tbody class="[&_tr:last-child]:border-0">
            <tr v-for="terrain in filteredTerrains" :key="terrain.id" class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <td class="p-4 align-middle font-medium">
                <RouterLink :to="`/terrains/${terrain.id}`" class="text-primary hover:underline">
                  {{ terrain.name }}
                </RouterLink>
              </td>
              <td class="p-4 align-middle">{{ (terrain as any).owner?.name || '—' }}</td>
              <td class="p-4 align-middle">{{ formatArea(terrain) }}</td>
              <td class="p-4 align-middle">
                <span 
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  :class="(terrain._count?.contracts || 0) > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'"
                >
                  {{ (terrain._count?.contracts || 0) > 0 ? 'Vendu' : 'Non vendu' }}
                </span>
              </td>
              <td class="p-4 align-middle">{{ formatDate(terrain.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
