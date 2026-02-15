<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { fetchParcels } from '@/services/api';
import { Search, Square, MapPin, User, Grid3x3, List } from '@/lib/icons';

const parcels = ref<any[]>([]);
const searchQuery = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const loading = ref(true);

onMounted(async () => {
  try {
    parcels.value = await fetchParcels();
  } catch (err) {
    console.error('Erreur chargement parcelles:', err);
  } finally {
    loading.value = false;
  }
});

const filteredParcels = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return parcels.value;
  return parcels.value.filter(p =>
    p.label.toLowerCase().includes(q) ||
    p.terrain?.name?.toLowerCase().includes(q) ||
    p.customer?.name?.toLowerCase().includes(q)
  );
});

function formatPrice(price: number): string {
  if (!price) return '—';
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 });
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: 'Disponible',
    SOLD: 'Vendue',
    RESERVED: 'Réservée',
  };
  return labels[status] || status;
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: '#10b981',
    SOLD: '#ef4444',
    RESERVED: '#f59e0b',
  };
  return colors[status] || '#6b7280';
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Parcelles</h1>
        <p class="page-subtitle">Vue d'ensemble de toutes les parcelles</p>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="search-wrapper">
        <Search class="search-icon h-4 w-4" :stroke-width="1.5" />
        <input
          type="text"
          class="input search-input"
          placeholder="Rechercher parcelles..."
          v-model="searchQuery"
        />
      </div>
      <div class="toolbar-actions">
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
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des parcelles...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredParcels.length === 0" class="empty-state">
      <Square class="h-12 w-12 mb-4 text-muted-foreground opacity-50" :stroke-width="1.5" />
      <h2 class="empty-state-title">Aucune parcelle</h2>
      <p class="empty-state-text">Les parcelles sont créées à l'intérieur des terrains.</p>
      <RouterLink to="/terrains" class="btn btn-primary">
        Aller aux Terrains
      </RouterLink>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="entity-grid">
      <div
        v-for="parcel in filteredParcels"
        :key="parcel.id"
        class="entity-card cursor-pointer"
        @click="$router.push(`/parcelles/${parcel.id}`)"
      >
        <div class="entity-card-header">
          <div class="entity-card-avatar">
            <Square class="h-5 w-5 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <div class="entity-card-info">
            <div class="entity-card-name">{{ parcel.label }}</div>
            <div class="entity-card-sub" v-if="parcel.terrain">
              <RouterLink :to="`/terrains/${parcel.terrain.id}`" class="table-link flex items-center gap-1" @click.stop>
                <MapPin class="h-3 w-3" :stroke-width="1.5" />
                {{ parcel.terrain.name }}
              </RouterLink>
            </div>
          </div>
          <span
            class="status-badge"
            :style="{ background: `${statusColor(parcel.status)}22`, color: statusColor(parcel.status) }"
          >
            {{ statusLabel(parcel.status) }}
          </span>
        </div>

        <div class="entity-card-stats">
          <div class="mini-stat">
            <span class="mini-stat-value">{{ parcel.areaSqm?.toLocaleString('fr-FR') }} m²</span>
            <span class="mini-stat-label">Surface</span>
          </div>
           <div class="mini-stat">
            <span class="mini-stat-value">{{ formatPrice(parcel.totalPrice) }}</span>
            <span class="mini-stat-label">Prix Total</span>
          </div>
        </div>

        <div class="entity-card-meta" style="margin-top: var(--space-sm); border-top: 1px solid var(--border); padding-top: var(--space-sm);">
          <div v-if="parcel.customer" class="entity-card-meta-item flex items-center gap-1">
             <RouterLink :to="`/clients/${parcel.customer.id}`" class="table-link flex items-center gap-1" @click.stop>
                <User class="h-3 w-3" :stroke-width="1.5" />
                {{ parcel.customer.name }}
             </RouterLink>
          </div>
          <span v-else class="entity-card-meta-item text-muted-foreground">
            — Pas d'acheteur
          </span>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="content-section">
      <table class="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Terrain</th>
            <th>Surface</th>
            <th>Prix Total</th>
            <th>Statut</th>
            <th>Acheteur</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="parcel in filteredParcels" :key="parcel.id">
            <td>
              <RouterLink :to="`/parcelles/${parcel.id}`" class="table-link" style="font-weight: 600">
                {{ parcel.label }}
              </RouterLink>
            </td>
            <td>
              <RouterLink v-if="parcel.terrain" :to="`/terrains/${parcel.terrain.id}`" class="table-link">
                {{ parcel.terrain.name }}
              </RouterLink>
              <span v-else>—</span>
            </td>
            <td>{{ parcel.areaSqm?.toLocaleString('fr-FR') }} m²</td>
            <td>{{ formatPrice(parcel.totalPrice) }}</td>
            <td>
              <span
                class="status-badge"
                :style="{ background: `${statusColor(parcel.status)}22`, color: statusColor(parcel.status) }"
              >
                {{ statusLabel(parcel.status) }}
              </span>
            </td>
            <td>
              <RouterLink v-if="parcel.customer" :to="`/clients/${parcel.customer.id}`" class="table-link flex items-center gap-1">
                <User class="h-3 w-3 inline" :stroke-width="1.5" />
                {{ parcel.customer.name }}
              </RouterLink>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
