<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { fetchContracts } from '@/services/api';
import type { Contract } from '@/types';
import { Search, FileText, Plus, User, Calendar, Grid3x3, List, LandPlot } from '@/lib/icons';

const contracts = ref<Contract[]>([]);
const searchQuery = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const loading = ref(true);

onMounted(async () => {
  try {
    contracts.value = await fetchContracts();
  } catch (err) {
    console.error('Erreur chargement contrats:', err);
  } finally {
    loading.value = false;
  }
});

const filteredContracts = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return contracts.value;
  return contracts.value.filter(c =>
    c.contractNumber?.toLowerCase().includes(q) ||
    c.customer?.name?.toLowerCase().includes(q) ||
    c.parcels?.some(p => p.label?.toLowerCase().includes(q))
  );
});

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function formatPrice(price: number | null | undefined): string {
  if (!price && price !== 0) return '—';
  return price.toLocaleString('fr-FR', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 });
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Contrats de Vente</h1>
        <p class="page-subtitle">Historique des ventes de terrains</p>
      </div>
      <div class="page-actions">
        <RouterLink to="/contrats/nouveau" class="btn btn-primary">
          <Plus class="h-4 w-4" :stroke-width="1.5" />
          Nouvelle Vente
        </RouterLink>
      </div>
    </header>

    <!-- Search -->
    <div class="page-toolbar">
      <div class="search-wrapper">
        <Search class="search-icon h-4 w-4" :stroke-width="1.5" />
        <input
          type="text"
          class="input search-input"
          placeholder="Rechercher par client, parcelle ou N° contrat..."
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
      <p>Chargement des contrats...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredContracts.length === 0" class="empty-state">
      <FileText class="h-12 w-12 mb-4 text-muted-foreground opacity-50" :stroke-width="1.5" />
      <h2 class="empty-state-title">Aucun contrat de vente</h2>
      <p class="empty-state-text">Enregistrez votre première vente de terrain.</p>
      <RouterLink to="/contrats/nouveau" class="btn btn-primary btn-lg">
        <Plus class="h-4 w-4" :stroke-width="1.5" />
        Enregistrer une Vente
      </RouterLink>
    </div>

    <div v-else-if="viewMode === 'grid'" class="entity-grid">
      <RouterLink
        v-for="contract in filteredContracts"
        :key="contract.id"
        :to="`/contrats/${contract.id}`"
        class="entity-card"
      >
        <div class="entity-card-header">
          <div class="entity-card-avatar">
            <FileText class="h-5 w-5 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <div class="entity-card-info">
            <div class="entity-card-name">{{ contract.contractNumber || `#${contract.id.slice(0, 8)}` }}</div>
            <div class="entity-card-sub flex items-center gap-1">
              <Calendar class="h-3.5 w-3.5" :stroke-width="1.5" />
              {{ formatDate(contract.createdAt) }}
            </div>
          </div>
        </div>

        <div class="entity-card-meta" style="justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap;">
          <span class="entity-card-meta-item flex items-center gap-1">
            <User class="h-3.5 w-3.5" :stroke-width="1.5" />
            {{ contract.customer?.name || 'Acheteur non défini' }}
          </span>
          <span class="entity-card-meta-item" style="font-weight:600;color:var(--foreground)">
            {{ formatPrice(contract.saleAmount) }}
          </span>
        </div>

        <div class="entity-card-stats">
          <div class="mini-stat">
            <span class="mini-stat-value">{{ contract.parcels?.length || 0 }}</span>
            <span class="mini-stat-label">Parcelles</span>
          </div>
          <div class="mini-stat" style="align-items:flex-start;flex:1">
            <span class="mini-stat-label" style="text-transform:none;font-size:0.75rem;letter-spacing:0;color:var(--muted-foreground)">
              {{ contract.parcels?.length ? contract.parcels.map((parcel) => parcel.label || '—').join(', ') : 'Aucune parcelle liée' }}
            </span>
          </div>
        </div>
      </RouterLink>
    </div>

    <div v-else class="content-section">
      <table class="table">
        <thead>
          <tr>
            <th>N° contrat</th>
            <th>Acheteur</th>
            <th>Parcelles</th>
            <th>Montant</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contract in filteredContracts" :key="contract.id">
            <td>
              <RouterLink :to="`/contrats/${contract.id}`" class="table-link" style="font-weight:600">
                {{ contract.contractNumber || `#${contract.id.slice(0, 8)}` }}
              </RouterLink>
            </td>
            <td>{{ contract.customer?.name || '—' }}</td>
            <td>
              <template v-if="contract.parcels?.length">
                <span v-for="(parcel, index) in contract.parcels" :key="parcel.id || index" class="inline-flex items-center gap-1">
                  <LandPlot class="h-3.5 w-3.5 text-muted-foreground" :stroke-width="1.5" />
                  {{ parcel.label || '—' }}{{ index < contract.parcels.length - 1 ? ', ' : '' }}
                </span>
              </template>
              <span v-else class="text-muted-foreground">—</span>
            </td>
            <td>{{ formatPrice(contract.saleAmount) }}</td>
            <td>{{ formatDate(contract.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
