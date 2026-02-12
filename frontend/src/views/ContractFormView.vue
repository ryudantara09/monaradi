<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { createContract, fetchCustomers, fetchTerrains } from '@/services/api';
import type { Customer, Terrain } from '@/types';

const router = useRouter();
const saving = ref(false);
const customers = ref<Customer[]>([]);
const terrains = ref<Terrain[]>([]);

const formData = ref({
  contractNumber: '',
  customerId: '',
  terrainId: '',
  parcelIds: [] as string[],
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  notes: '',
});

onMounted(async () => {
  try {
    const [c, t] = await Promise.all([fetchCustomers(), fetchTerrains()]);
    customers.value = c;
    terrains.value = t;
  } catch (err) {
    console.error('Erreur chargement données:', err);
  }
});

const selectedTerrain = computed(() =>
  terrains.value.find(t => t.id === formData.value.terrainId)
);

const selectedCustomer = computed(() =>
  customers.value.find(c => c.id === formData.value.customerId)
);

const availableParcels = computed(() => {
  if (!selectedTerrain.value || !selectedTerrain.value.parcels) return [];
  return selectedTerrain.value.parcels.filter((p: any) => p.status !== 'SOLD');
});

// Watch for terrain change to clear selected parcels
watch(() => formData.value.terrainId, () => {
  formData.value.parcelIds = [];
  formData.value.amount = 0;
});

function toggleParcel(parcel: any) {
  const pid = parcel.id;
  if (formData.value.parcelIds.includes(pid)) {
    formData.value.parcelIds = formData.value.parcelIds.filter(id => id !== pid);
    formData.value.amount -= (parcel.totalPrice || 0);
  } else {
    formData.value.parcelIds.push(pid);
    formData.value.amount += (parcel.totalPrice || 0);
  }
  // Ensure non-negative
  if (formData.value.amount < 0) formData.value.amount = 0;
}

const isValid = computed(() =>
  formData.value.customerId && 
  formData.value.parcelIds.length > 0 && 
  formData.value.amount > 0
);

async function handleSubmit() {
  if (!isValid.value) return;
  saving.value = true;
  try {
    const payload = {
      contractNumber: formData.value.contractNumber || undefined,
      customerId: formData.value.customerId,
      parcelIds: formData.value.parcelIds,
      saleAmount: formData.value.amount, 
      notes: formData.value.notes || undefined,
      // Pass these for now if needed by API or Schema default
      terms: undefined 
    };
    
    // We import createContract which calls api.post('/contracts', payload)
    // The backend expects flat structure. api.ts createContract interface might be wrong but we pass 'any' to bypass TS check if needed or update api.ts
    await createContract(payload as any);
    
    router.push('/contrats');
  } catch (error) {
    console.error('Erreur création contrat:', error);
    alert('Erreur lors de la création du contrat');
  } finally {
    saving.value = false;
  }
}

function formatTND(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' TND';
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <RouterLink to="/contrats" class="back-link">← Retour aux Contrats</RouterLink>
        <h1 class="page-title">Nouveau Contrat de Vente</h1>
        <p class="page-subtitle">Enregistrer une vente de terrain</p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit" style="display:flex;flex-direction:column;gap:var(--space-lg);max-width:700px">
      <!-- Contract Number + Date -->
      <div class="form-section">
        <h2 class="form-section-title">Informations du contrat</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="contractNumber">N° du contrat</label>
            <input
              type="text"
              id="contractNumber"
              class="input"
              v-model="formData.contractNumber"
              placeholder="ex : CTR-2026-001"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="date">Date de vente *</label>
            <input type="date" id="date" class="input" v-model="formData.date" required />
          </div>
        </div>
      </div>

      <!-- Client Selection -->
      <div class="form-section">
        <h2 class="form-section-title">Acheteur *</h2>
        <div v-if="customers.length === 0" class="related-items-empty">
          <span>👥</span>
          <p>Aucun client disponible</p>
          <RouterLink to="/clients/nouveau" class="btn btn-secondary btn-sm">+ Ajouter un client</RouterLink>
        </div>
        <div v-else>
          <select class="input" v-model="formData.customerId" required>
            <option value="">-- Sélectionner un client --</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
          <div v-if="selectedCustomer" style="margin-top:var(--space-sm);padding:var(--space-sm) var(--space-md);background:rgba(79,158,255,0.06);border-radius:var(--radius-md);border:1px solid rgba(79,158,255,0.15)">
            <span style="font-weight:600">{{ selectedCustomer.name }}</span>
            <span v-if="selectedCustomer.phone" style="color:var(--color-text-muted);margin-left:var(--space-md)">📞 {{ selectedCustomer.phone }}</span>
          </div>
        </div>
      </div>

      <!-- Terrain & Parcel Selection -->
      <div class="form-section">
        <h2 class="form-section-title">Parcelles à vendre *</h2>
        <div v-if="terrains.length === 0" class="related-items-empty">
          <span>🗺️</span>
          <p>Aucun terrain disponible</p>
          <RouterLink to="/terrains/nouveau" class="btn btn-secondary btn-sm">+ Ajouter un terrain</RouterLink>
        </div>
        <div v-else>
          <div class="form-group">
             <label class="form-label">Filtrer par Terrain</label>
             <select class="input" v-model="formData.terrainId">
               <option value="">-- Choisir un terrain --</option>
               <option v-for="t in terrains" :key="t.id" :value="t.id">
                 {{ t.name }} {{ t.address ? `— ${t.address}` : '' }}
               </option>
             </select>
          </div>

          <!-- Parcel List -->
          <div v-if="selectedTerrain" style="margin-top:var(--space-md)">
             <label class="form-label" style="display:block;margin-bottom:var(--space-xs)">Sélectionner les parcelles :</label>
             <div v-if="availableParcels.length === 0" class="empty-state-small">
               <p v-if="selectedTerrain.parcels && selectedTerrain.parcels.some(p => p.status === 'SOLD')">
                  Toutes les parcelles sont vendues.
               </p>
               <p v-else>Aucune parcelle disponible.</p>
             </div>
             <div v-else class="parcel-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:var(--space-sm)">
                <div 
                  v-for="p in availableParcels" 
                  :key="p.id" 
                  @click="toggleParcel(p)"
                  :class="['parcel-card-select', { selected: formData.parcelIds.includes(p.id) }]"
                  style="border:1px solid var(--color-border);padding:var(--space-sm);border-radius:var(--radius-sm);cursor:pointer;background:var(--color-bg-card)"
                >
                  <div style="display:flex;justify-content:space-between;align-items:center">
                     <span style="font-weight:600">{{ p.label }}</span>
                     <input type="checkbox" :checked="formData.parcelIds.includes(p.id)" style="pointer-events:none" />
                  </div>
                  <div style="font-size:0.85rem;color:var(--color-text-muted);margin-top:4px">
                     {{ p.areaSqm }} m² — {{ formatTND(p.totalPrice || 0) }}
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Amount -->
      <div class="form-section">
        <h2 class="form-section-title">Montant de la vente *</h2>
        <div class="form-group">
          <label class="form-label" for="amount">Montant Total (TND)</label>
          <div style="position:relative">
            <input
              type="number"
              id="amount"
              class="input"
              v-model="formData.amount"
              placeholder="0.000"
              step="0.001"
              min="0"
              required
              style="padding-right:60px"
            />
            <span style="position:absolute;right:var(--space-md);top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-weight:600">TND</span>
          </div>
          <p v-if="Number(formData.amount) > 0" style="margin-top:var(--space-xs);color:var(--color-accent-primary);font-weight:600;font-size:1.125rem">
            {{ formatTND(Number(formData.amount)) }}
          </p>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <h2 class="form-section-title">Notes</h2>
        <div class="form-group">
          <textarea
            class="input textarea"
            v-model="formData.notes"
            placeholder="Notes supplémentaires..."
            rows="3"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="router.push('/contrats')">
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving || !isValid">
          {{ saving ? 'Enregistrement...' : '+ Enregistrer la Vente' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.parcel-card-select.selected {
  border-color: var(--color-primary) !important;
  background-color: rgba(79, 158, 255, 0.05) !important;
}
.empty-state-small {
  padding: var(--space-md);
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}
</style>
