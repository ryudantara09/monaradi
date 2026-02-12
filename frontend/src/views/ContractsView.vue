<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { fetchContracts } from '@/services/api';
import type { Contract } from '@/types';

const contracts = ref<Contract[]>([]);
const searchQuery = ref('');
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
    c.parties?.some(p => p.customer?.name.toLowerCase().includes(q)) ||
    c.terrains?.some(t => t.terrain?.name.toLowerCase().includes(q))
  );
});

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
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
          + Nouvelle Vente
        </RouterLink>
      </div>
    </header>

    <!-- Search -->
    <div class="page-toolbar">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="input search-input"
          placeholder="Rechercher par client, terrain ou N° contrat..."
          v-model="searchQuery"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des contrats...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredContracts.length === 0" class="empty-state">
      <span class="empty-state-icon">📜</span>
      <h2 class="empty-state-title">Aucun contrat de vente</h2>
      <p class="empty-state-text">Enregistrez votre première vente de terrain.</p>
      <RouterLink to="/contrats/nouveau" class="btn btn-primary btn-lg">
        + Enregistrer une Vente
      </RouterLink>
    </div>

    <!-- Table -->
    <div v-else class="content-section">
      <table class="table">
        <thead>
          <tr>
            <th>N° contrat</th>
            <th>Acheteur</th>
            <th>Terrain</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contract in filteredContracts" :key="contract.id">
            <td>
              <RouterLink :to="`/contrats/${contract.id}`" class="table-link">
                {{ contract.contractNumber || `#${contract.id.slice(0, 8)}` }}
              </RouterLink>
            </td>
            <td>
              <template v-if="contract.parties?.length">
                <span v-for="(party, i) in contract.parties" :key="i">
                  {{ party.customer?.name || '—' }}{{ i < contract.parties.length - 1 ? ', ' : '' }}
                </span>
              </template>
              <span v-else style="color:var(--color-text-muted)">—</span>
            </td>
            <td>
              <template v-if="contract.terrains?.length">
                <span v-for="(ct, i) in contract.terrains" :key="i">
                  🗺️ {{ ct.terrain?.name || '—' }}{{ i < contract.terrains.length - 1 ? ', ' : '' }}
                </span>
              </template>
              <span v-else style="color:var(--color-text-muted)">—</span>
            </td>
            <td>{{ formatDate(contract.startDate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
