<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { fetchTerrains } from '@/services/api';
import type { Terrain } from '@/types';
import { LandPlot, Search, Grid3x3, List, User, Square, Plus } from '@/lib/icons';

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
        <RouterLink to="/terrains/nouveau" class="btn btn-primary">
          <Plus class="h-4 w-4" :stroke-width="1.5" />
          Ajouter Terrain
        </RouterLink>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" :stroke-width="1.5" />
        <input
          type="text"
          class="input pl-9"
          placeholder="Rechercher terrains..."
          v-model="searchQuery"
        />
      </div>
      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          <Grid3x3 class="h-4 w-4" :stroke-width="1.5" />
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          <List class="h-4 w-4" :stroke-width="1.5" />
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des terrains...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTerrains.length === 0" class="empty-state">
      <LandPlot class="h-12 w-12 mb-4 text-muted-foreground opacity-50" :stroke-width="1.5" />
      <h2 class="empty-state-title">Aucun terrain</h2>
      <p class="empty-state-text">Commencez par ajouter votre première parcelle ou propriété.</p>
      <RouterLink to="/terrains/nouveau" class="btn btn-primary btn-lg">
        <Plus class="h-4 w-4" :stroke-width="1.5" />
        Ajouter Premier Terrain
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
             <div class="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
               <LandPlot class="h-5 w-5 text-muted-foreground" :stroke-width="1.5" />
             </div>
             <div>
                <div class="font-semibold leading-none tracking-tight text-foreground">{{ terrain.name }}</div>
                <div class="text-sm text-muted-foreground mt-1">{{ terrain.address || 'Pas d\'adresse' }}</div>
             </div>
          </div>
        </div>

        <div class="flex gap-4 text-sm text-muted-foreground">
          <span v-if="(terrain as any).owner" class="flex items-center gap-1">
            <User class="h-3.5 w-3.5" :stroke-width="1.5" />
            {{ (terrain as any).owner.name }}
          </span>
          <span v-if="terrain.areaSize" class="flex items-center gap-1">
            <Square class="h-3.5 w-3.5" :stroke-width="1.5" />
            {{ formatArea(terrain) }}
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
    <div v-else class="content-section">
      <table class="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Propriétaire</th>
            <th>Surface</th>
            <th>Statut</th>
            <th>Créé le</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="terrain in filteredTerrains" :key="terrain.id">
            <td>
              <RouterLink :to="`/terrains/${terrain.id}`" class="table-link" style="font-weight: 600">
                {{ terrain.name }}
              </RouterLink>
            </td>
            <td>{{ (terrain as any).owner?.name || '—' }}</td>
            <td>{{ formatArea(terrain) }}</td>
            <td>
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="(terrain._count?.contracts || 0) > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'"
              >
                {{ (terrain._count?.contracts || 0) > 0 ? 'Vendu' : 'Non vendu' }}
              </span>
            </td>
            <td>{{ formatDate(terrain.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
