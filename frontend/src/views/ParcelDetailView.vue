<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { fetchParcel, deleteParcel } from '@/services/api';

const route = useRoute();
const router = useRouter();
const parcel = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  const id = route.params.id as string;
  try {
    parcel.value = await fetchParcel(id);
  } catch (err) {
    console.error('Erreur chargement parcelle:', err);
  } finally {
    loading.value = false;
  }
});

async function handleDelete() {
  if (!confirm('Supprimer cette parcelle ?')) return;
  try {
    await deleteParcel(parcel.value.id);
    router.go(-1); // Go back
  } catch (err) {
    alert('Erreur suppression');
  }
}

function formatTND(val: number) {
  return val ? val.toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND' : '—';
}
</script>

<template>
  <div v-if="loading" class="p-8 text-center">Chargement...</div>
  <div v-else-if="!parcel" class="p-8 text-center">Parcelle introuvable</div>
  <div v-else class="animate-fade-in space-y-6">
    <header class="page-header">
      <div class="page-header-left">
        <RouterLink to="/terrains" class="back-link">← Retour</RouterLink>
        <h1 class="page-title">{{ parcel.label }}</h1>
        <div class="flex gap-2">
           <span class="badge" :class="parcel.status === 'SOLD' ? 'badge-error' : 'badge-success'">
             {{ parcel.status === 'SOLD' ? 'Vendu' : 'Disponible' }}
           </span>
        </div>
      </div>
      <div class="page-header-right">
        <button @click="handleDelete" class="btn btn-danger">Supprimer</button>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- General Info -->
      <div class="card">
        <h2 class="card-title">Informations</h2>
        <div class="space-y-4">
          <div class="info-row">
            <span class="label">Surface</span>
            <span class="value">{{ parcel.areaSqm }} m²</span>
          </div>
          <div class="info-row">
            <span class="label">Prix / m²</span>
            <span class="value">{{ formatTND(parcel.pricePerSqm) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Prix Total</span>
            <span class="value font-bold text-accent">{{ formatTND(parcel.totalPrice) }}</span>
          </div>
        </div>
      </div>

      <!-- Relations -->
      <div class="card">
        <h2 class="card-title">Relations</h2>
        <div class="space-y-4">
          <div class="info-row">
            <span class="label">Terrain</span>
            <span class="value">
              <RouterLink v-if="parcel.terrain" :to="`/terrains/${parcel.terrain.id}`" class="link">
                {{ parcel.terrain.name }}
              </RouterLink>
              <span v-else>—</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Client / Propriétaire</span>
            <span class="value">
              <RouterLink v-if="parcel.customer" :to="`/clients/${parcel.customer.id}`" class="link">
                {{ parcel.customer.name }}
              </RouterLink>
              <span v-else>{{ parcel.ownerName || '—' }}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Contrat</span>
            <span class="value">
              <RouterLink v-if="parcel.contract" :to="`/contrats/${parcel.contract.id}`" class="link">
                Voir Contrat
              </RouterLink>
              <span v-else>—</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}
.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--color-text-primary);
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--color-border);
}
.info-row:last-child {
  border-bottom: none;
}
.label {
  color: var(--color-text-muted);
}
.value {
  font-weight: 500;
}
.link {
  color: var(--color-primary);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-success {
  background-color: rgba(16, 185, 129, 0.2);
  color: rgb(52, 211, 153);
}
.badge-error {
  background-color: rgba(239, 68, 68, 0.2);
  color: rgb(248, 113, 113);
}
</style>
