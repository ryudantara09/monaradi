<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
  amount: '' as string | number,
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

const isValid = computed(() =>
  formData.value.customerId && formData.value.terrainId && Number(formData.value.amount) > 0
);

async function handleSubmit() {
  if (!isValid.value) return;
  saving.value = true;
  try {
    await createContract({
      contractNumber: formData.value.contractNumber || undefined,
      type: 'sale',
      startDate: formData.value.date || undefined,
      notes: formData.value.notes || undefined,
      parties: [{ customerId: formData.value.customerId, role: 'buyer' }],
      terrainIds: [formData.value.terrainId],
    });
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

      <!-- Terrain Selection -->
      <div class="form-section">
        <h2 class="form-section-title">Terrain à vendre *</h2>
        <div v-if="terrains.length === 0" class="related-items-empty">
          <span>🗺️</span>
          <p>Aucun terrain disponible</p>
          <RouterLink to="/terrains/nouveau" class="btn btn-secondary btn-sm">+ Ajouter un terrain</RouterLink>
        </div>
        <div v-else>
          <select class="input" v-model="formData.terrainId" required>
            <option value="">-- Sélectionner un terrain --</option>
            <option v-for="t in terrains" :key="t.id" :value="t.id">
              {{ t.name }} {{ t.address ? `— ${t.address}` : '' }}
            </option>
          </select>
          <div v-if="selectedTerrain" style="margin-top:var(--space-sm);padding:var(--space-sm) var(--space-md);background:rgba(79,158,255,0.06);border-radius:var(--radius-md);border:1px solid rgba(79,158,255,0.15)">
            <span style="font-weight:600">🗺️ {{ selectedTerrain.name }}</span>
            <span v-if="selectedTerrain.areaSize" style="color:var(--color-text-muted);margin-left:var(--space-md)">
              {{ selectedTerrain.areaSize }} m²
            </span>
          </div>
        </div>
      </div>

      <!-- Amount -->
      <div class="form-section">
        <h2 class="form-section-title">Montant de la vente *</h2>
        <div class="form-group">
          <label class="form-label" for="amount">Montant (TND)</label>
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
