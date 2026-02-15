<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { fetchCustomers } from '@/services/api';
import type { Customer } from '@/types';
import { Search, User, Mail, Phone, Users, Plus } from '@/lib/icons';

const customers = ref<Customer[]>([]);
const searchQuery = ref('');
const loading = ref(true);

onMounted(async () => {
  try {
    customers.value = await fetchCustomers();
  } catch (err) {
    console.error('Erreur chargement clients:', err);
  } finally {
    loading.value = false;
  }
});

const filteredCustomers = computed(() => {
  return customers.value.filter(c => {
    const q = searchQuery.value.toLowerCase();
    return !q ||
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q);
  });
});
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Clients</h1>
        <p class="page-subtitle">Gérer vos relations clients</p>
      </div>
      <div class="page-actions">
        <RouterLink to="/clients/nouveau" class="btn btn-primary">
          <Plus class="h-4 w-4" :stroke-width="1.5" />
          Ajouter Client
        </RouterLink>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="search-wrapper">
        <Search class="search-icon h-4 w-4" :stroke-width="1.5" />
        <input
          type="text"
          class="input search-input"
          placeholder="Rechercher clients..."
          v-model="searchQuery"
        />
      </div>
      <div class="toolbar-actions">
        <div class="filter-tabs">
          <div class="filter-tab active">
            Tous les clients ({{ customers.length }})
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des clients...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCustomers.length === 0" class="empty-state">
      <Users class="h-12 w-12 mb-4 text-muted-foreground opacity-50" :stroke-width="1.5" />
      <h2 class="empty-state-title">Aucun client</h2>
      <p class="empty-state-text">
        Ajoutez des particuliers ou des entités juridiques pour gérer vos relations clients.
      </p>
      <RouterLink to="/clients/nouveau" class="btn btn-primary btn-lg">
        <Plus class="h-4 w-4" :stroke-width="1.5" />
        Ajouter Premier Client
      </RouterLink>
    </div>

    <!-- Grid -->
    <div v-else class="entity-grid">
      <RouterLink
        v-for="customer in filteredCustomers"
        :key="customer.id"
        :to="`/clients/${customer.id}`"
        class="entity-card"
      >
        <div class="entity-card-header">
          <div class="entity-card-avatar">
            <User class="h-5 w-5 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <div class="entity-card-info">
            <div class="entity-card-name">{{ customer.name }}</div>
            <div class="entity-card-sub" v-if="customer.idNumber">
              CIN: {{ customer.idNumber }}
            </div>
          </div>
        </div>
        <div class="entity-card-meta">
          <span v-if="customer.email" class="entity-card-meta-item flex items-center gap-1">
            <Mail class="h-3.5 w-3.5" :stroke-width="1.5" />
            {{ customer.email }}
          </span>
          <span v-if="customer.phone" class="entity-card-meta-item flex items-center gap-1">
            <Phone class="h-3.5 w-3.5" :stroke-width="1.5" />
            {{ customer.phone }}
          </span>
        </div>
        <div class="entity-card-stats">
          <div class="mini-stat">
            <span class="mini-stat-value">{{ (customer as any)._count?.purchasedParcels || 0 }}</span>
            <span class="mini-stat-label">Parcelles</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-value">{{ customer._count?.contractParties || 0 }}</span>
            <span class="mini-stat-label">Contrats</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-value">{{ customer._count?.transactionParties || 0 }}</span>
            <span class="mini-stat-label">Transactions</span>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
