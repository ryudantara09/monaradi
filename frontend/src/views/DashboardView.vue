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
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Tableau de bord</h1>
        <p class="page-subtitle">Aperçu de votre système de gestion foncière</p>
      </div>
      <div class="page-actions">
        <RouterLink to="/terrains/nouveau" class="btn btn-primary">
          + Ajout Rapide
        </RouterLink>
      </div>
    </header>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <RouterLink to="/terrains" class="stat-card" style="text-decoration:none;color:inherit">
        <div class="stat-icon terrain">🗺️</div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.terrains }}</span>
          <span class="stat-label">Terrains</span>
        </div>
      </RouterLink>

      <RouterLink to="/clients" class="stat-card" style="text-decoration:none;color:inherit">
        <div class="stat-icon client">👥</div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.customers }}</span>
          <span class="stat-label">Clients</span>
        </div>
      </RouterLink>

      <RouterLink to="/contrats" class="stat-card" style="text-decoration:none;color:inherit">
        <div class="stat-icon contrat">📜</div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.activeContracts }}</span>
          <span class="stat-label">Contrats Actifs</span>
        </div>
      </RouterLink>

      <div class="stat-card">
        <div class="stat-icon projet">📐</div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.contracts }}</span>
          <span class="stat-label">Total Contrats</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des données...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="dashboard-content">
      <!-- Activity Feed -->
      <div class="content-section">
        <div class="section-header">
          <h2 class="section-title">Activité Récente</h2>
        </div>

        <div v-if="activities.length === 0" class="empty-state">
          <span class="empty-state-icon">📋</span>
          <p class="empty-state-title">Aucune activité récente</p>
          <p class="empty-state-text">Commencez par ajouter un terrain ou un client</p>
        </div>

        <div v-else class="activity-feed">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <span class="activity-icon">{{ activity.icon }}</span>
            <div class="activity-content">
              <span class="activity-action">{{ activity.action }}</span>
              <span class="activity-name">{{ activity.name }}</span>
            </div>
            <span class="activity-time">{{ formatDate(activity.date) }}</span>
          </div>
        </div>
      </div>

      <!-- Side Content -->
      <div class="side-content">
        <div class="content-section" style="padding: var(--space-lg)">
          <h2 class="section-title" style="margin-bottom: var(--space-md)">Actions Rapides</h2>
          <div class="quick-actions">
            <RouterLink to="/terrains/nouveau" class="quick-action">
              <span class="quick-action-icon">🗺️</span>
              <span class="quick-action-label">Ajouter Terrain</span>
            </RouterLink>
            <RouterLink to="/clients/nouveau" class="quick-action">
              <span class="quick-action-icon">👤</span>
              <span class="quick-action-label">Ajouter Client</span>
            </RouterLink>
            <RouterLink to="/contrats/nouveau" class="quick-action">
              <span class="quick-action-icon">📜</span>
              <span class="quick-action-label">Nouveau Contrat</span>
            </RouterLink>
          </div>
        </div>

        <div class="content-section" style="padding: var(--space-lg)">
          <h2 class="section-title" style="margin-bottom: var(--space-md)">Résumé</h2>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            <div style="display:flex;justify-content:space-between;font-size:0.875rem">
              <span style="color:var(--color-text-muted)">Terrains enregistrés</span>
              <span style="font-weight:600">{{ stats.terrains }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.875rem">
              <span style="color:var(--color-text-muted)">Clients actifs</span>
              <span style="font-weight:600">{{ stats.customers }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.875rem">
              <span style="color:var(--color-text-muted)">Contrats actifs</span>
              <span style="font-weight:600;color:var(--color-accent-success)">{{ stats.activeContracts }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.875rem">
              <span style="color:var(--color-text-muted)">Total contrats</span>
              <span style="font-weight:600">{{ stats.contracts }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
