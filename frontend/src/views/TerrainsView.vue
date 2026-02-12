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
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Terrains</h1>
        <p class="page-subtitle">Gérez vos parcelles et propriétés foncières</p>
      </div>
      <div class="page-actions">
        <RouterLink to="/terrains/nouveau" class="btn btn-primary">
          + Ajouter Terrain
        </RouterLink>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="input search-input"
          placeholder="Rechercher terrains..."
          v-model="searchQuery"
        />
      </div>
      <div class="toolbar-actions">
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >⊞</button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >☰</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des terrains...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTerrains.length === 0" class="empty-state">
      <span class="empty-state-icon">🗺️</span>
      <h2 class="empty-state-title">Aucun terrain</h2>
      <p class="empty-state-text">Commencez par ajouter votre première parcelle ou propriété.</p>
      <RouterLink to="/terrains/nouveau" class="btn btn-primary btn-lg">
        + Ajouter Premier Terrain
      </RouterLink>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="entity-grid">
      <RouterLink
        v-for="terrain in filteredTerrains"
        :key="terrain.id"
        :to="`/terrains/${terrain.id}`"
        class="entity-card"
      >
        <div class="entity-card-header">
          <div class="entity-card-avatar">🗺️</div>
          <div class="entity-card-info">
            <div class="entity-card-name">{{ terrain.name }}</div>
            <div class="entity-card-sub">{{ terrain.address || 'Pas d\'adresse' }}</div>
          </div>
          <span 
            class="status-badge"
            :style="{ background: (terrain._count?.contracts || 0) > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: (terrain._count?.contracts || 0) > 0 ? '#ef4444' : '#10b981' }"
          >
            {{ (terrain._count?.contracts || 0) > 0 ? 'Vendu' : 'Non vendu' }}
          </span>
        </div>
        <div class="entity-card-meta">
          <span v-if="(terrain as any).owner" class="entity-card-meta-item">
            👤 {{ (terrain as any).owner.name }}
          </span>
          <span v-if="terrain.areaSize" class="entity-card-meta-item">
            📐 {{ formatArea(terrain) }}
          </span>
        </div>
        <div class="entity-card-stats">
          <div class="mini-stat">
            <span class="mini-stat-value">{{ terrain.parcels?.length || 0 }}</span>
            <span class="mini-stat-label">Parcelles</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-value">{{ terrain.parcels?.filter((p: any) => p.status === 'SOLD').length || 0 }}</span>
            <span class="mini-stat-label">Vendues</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-value">{{ terrain._count?.contracts || 0 }}</span>
            <span class="mini-stat-label">Contrats</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-value">{{ terrain._count?.documents || 0 }}</span>
            <span class="mini-stat-label">Documents</span>
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
              <RouterLink :to="`/terrains/${terrain.id}`" class="table-link">
                {{ terrain.name }}
              </RouterLink>
            </td>
            <td>{{ (terrain as any).owner?.name || '—' }}</td>
            <td>{{ formatArea(terrain) }}</td>
            <td>
              <span 
                class="status-badge"
                :style="{ background: (terrain._count?.contracts || 0) > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: (terrain._count?.contracts || 0) > 0 ? '#ef4444' : '#10b981' }"
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
