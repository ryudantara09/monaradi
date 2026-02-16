<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  LandPlot,
  Square,
  Users,
  FileText,
  FolderOpen,
  Plus,
} from '@/lib/icons';
import {
  fetchTerrains,
  fetchParcels,
  fetchCustomers,
  fetchContracts,
  fetchDocuments,
} from '@/services/api';
import type { Terrain, Customer, Contract } from '@/types';

interface DashboardItem {
  id: string;
  name: string;
  to: string;
}

interface DashboardCard {
  key: string;
  title: string;
  total: number;
  listRoute: string;
  createRoute: string;
  createLabel: string;
  icon: object;
  items: DashboardItem[];
}

const loading = ref(true);

const terrains = ref<Terrain[]>([]);
const parcels = ref<any[]>([]);
const customers = ref<Customer[]>([]);
const contracts = ref<Contract[]>([]);
const documents = ref<any[]>([]);

onMounted(async () => {
  try {
    const [terrainsData, parcelsData, customersData, contractsData, documentsData] = await Promise.all([
      fetchTerrains(),
      fetchParcels(),
      fetchCustomers(),
      fetchContracts(),
      fetchDocuments(),
    ]);

    terrains.value = terrainsData;
    parcels.value = parcelsData;
    customers.value = customersData;
    contracts.value = contractsData;
    documents.value = documentsData;
  } catch (err) {
    console.error('Erreur chargement tableau de bord:', err);
  } finally {
    loading.value = false;
  }
});

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string | undefined): T[] {
  return [...items].sort(
    (a, b) => new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime(),
  );
}

const dashboardCards = computed<DashboardCard[]>(() => {
  const terrainItems: DashboardItem[] = sortByDateDesc(terrains.value, t => t.createdAt)
    .slice(0, 8)
    .map(t => ({
      id: t.id,
      name: t.name,
      to: `/terrains/${t.id}`,
    }));

  const parcelItems: DashboardItem[] = sortByDateDesc(parcels.value, p => p.createdAt)
    .slice(0, 8)
    .map(p => ({
      id: p.id,
      name: p.label || 'Parcelle sans nom',
      to: `/parcelles/${p.id}`,
    }));

  const customerItems: DashboardItem[] = sortByDateDesc(customers.value, c => c.createdAt)
    .slice(0, 8)
    .map(c => ({
      id: c.id,
      name: c.name,
      to: `/clients/${c.id}`,
    }));

  const contractItems: DashboardItem[] = sortByDateDesc(contracts.value, c => c.createdAt)
    .slice(0, 8)
    .map(c => ({
      id: c.id,
      name: c.contractNumber || `#${c.id.slice(0, 8)}`,
      to: `/contrats/${c.id}`,
    }));

  const documentItems: DashboardItem[] = sortByDateDesc(documents.value, d => d.createdAt || d.uploadedAt)
    .slice(0, 8)
    .map(d => ({
      id: d.id,
      name: d.name || 'Document sans nom',
      to: '/documents',
    }));

  return [
    {
      key: 'terrains',
      title: 'Terrains',
      total: terrains.value.length,
      listRoute: '/terrains',
      createRoute: '/terrains/nouveau',
      createLabel: 'Créer nouveau terrain',
      icon: LandPlot,
      items: terrainItems,
    },
    {
      key: 'parcelles',
      title: 'Parcelles',
      total: parcels.value.length,
      listRoute: '/parcelles',
      createRoute: '/terrains',
      createLabel: 'Créer nouvelle parcelle',
      icon: Square,
      items: parcelItems,
    },
    {
      key: 'clients',
      title: 'Clients',
      total: customers.value.length,
      listRoute: '/clients',
      createRoute: '/clients/nouveau',
      createLabel: 'Créer nouveau client',
      icon: Users,
      items: customerItems,
    },
    {
      key: 'contrats',
      title: 'Contrats',
      total: contracts.value.length,
      listRoute: '/contrats',
      createRoute: '/contrats/nouveau',
      createLabel: 'Créer nouveau contrat',
      icon: FileText,
      items: contractItems,
    },
    {
      key: 'documents',
      title: 'Documents',
      total: documents.value.length,
      listRoute: '/documents',
      createRoute: '/documents',
      createLabel: 'Créer nouveau document',
      icon: FolderOpen,
      items: documentItems,
    },
  ];
});
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Tableau de bord</h1>
      <p class="text-muted-foreground mt-1">Aperçu de votre système de gestion foncière</p>
    </div>

    <div v-if="loading" class="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
      Chargement des cartes du tableau de bord...
    </div>

    <div v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <div
        v-for="card in dashboardCards"
        :key="card.key"
        class="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col"
      >
        <div class="p-4 border-b space-y-3">
          <div class="flex items-center justify-between gap-3">
            <RouterLink
              :to="card.listRoute"
              class="text-base font-semibold hover:text-primary transition-colors"
            >
              {{ card.title }}
            </RouterLink>
            <div class="h-9 w-9 rounded-lg border bg-muted/40 flex items-center justify-center">
              <component :is="card.icon" class="h-4 w-4 text-muted-foreground" :stroke-width="1.5" />
            </div>
          </div>

          <div class="text-2xl font-bold leading-none">{{ card.total }}</div>
        </div>

        <div class="p-4 flex-1">
          <div v-if="card.items.length" class="space-y-2">
            <RouterLink
              v-for="item in card.items"
              :key="`${card.key}-${item.id}`"
              :to="item.to"
              class="block rounded-md px-2 py-2 hover:bg-muted/60 transition-colors no-underline"
            >
              <span class="block text-base font-semibold leading-tight w-full truncate">{{ item.name }}</span>
            </RouterLink>
          </div>
          <div v-else class="text-sm text-muted-foreground">
            Aucun élément existant.
          </div>
        </div>

        <div class="p-4 border-t">
          <RouterLink
            :to="card.createRoute"
            class="flex items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm font-medium hover:bg-muted/60 hover:border-primary/50 transition-colors"
          >
            <Plus class="h-4 w-4" :stroke-width="1.5" />
            {{ card.createLabel }}
          </RouterLink>
          <p
            v-if="card.key === 'parcelles'"
            class="mt-2 text-xs text-muted-foreground"
          >
            La création de parcelles se fait depuis un terrain.
          </p>
          <p
            v-if="card.key === 'documents'"
            class="mt-2 text-xs text-muted-foreground"
          >
            La création de documents se fait via les écrans de gestion de documents existants.
          </p>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
