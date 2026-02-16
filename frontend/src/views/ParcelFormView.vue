<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createParcel, fetchTerrains } from '@/services/api';

const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const submitError = ref<string | null>(null);
const terrains = ref<any[]>([]);

const formData = ref({
  label: '',
  terrainId: '',
  areaSqm: '' as string | number,
  pricePerSqm: '' as string | number,
  ownerName: '',
});

const estimatedTotal = computed(() => {
  return (Number(formData.value.areaSqm) || 0) * (Number(formData.value.pricePerSqm) || 0);
});

onMounted(async () => {
  try {
    terrains.value = await fetchTerrains();
  } catch (error) {
    console.error('Erreur chargement terrains:', error);
    submitError.value = 'Impossible de charger les terrains.';
  } finally {
    loading.value = false;
  }
});

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0,
  });
}

function parseApiError(error: any, fallback: string): string {
  return error?.response?.data?.error || fallback;
}

async function handleSubmit() {
  submitError.value = null;

  if (!formData.value.label.trim()) {
    submitError.value = 'Le nom de la parcelle est requis.';
    return;
  }

  if (!formData.value.terrainId) {
    submitError.value = 'Veuillez sélectionner un terrain.';
    return;
  }

  saving.value = true;
  try {
    const created = await createParcel({
      label: formData.value.label.trim(),
      terrainId: formData.value.terrainId,
      areaSqm: Number(formData.value.areaSqm) || 0,
      pricePerSqm: Number(formData.value.pricePerSqm) || 0,
      ownerName: formData.value.ownerName.trim() || null,
      status: 'AVAILABLE',
      geometry: [[0, 0]],
    });

    router.push(`/parcelles/${created.id}`);
  } catch (error) {
    console.error('Erreur création parcelle:', error);
    submitError.value = parseApiError(error, 'Erreur lors de la création de la parcelle.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Ajouter une parcelle</h1>
        <p class="page-subtitle">Créer une parcelle directement depuis la vue Parcelles</p>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>Chargement des terrains...</p>
    </div>

    <form
      v-else
      @submit.prevent="handleSubmit"
      style="display:flex;flex-direction:column;gap:var(--space-lg);max-width:800px"
    >
      <div class="form-section">
        <h2 class="form-section-title">Informations de la parcelle</h2>
        <div class="form-group">
          <label class="form-label" for="label">Nom de la parcelle *</label>
          <input
            id="label"
            type="text"
            class="input"
            v-model="formData.label"
            placeholder="ex : Parcelle A1"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="terrainId">Terrain lié *</label>
          <select id="terrainId" class="input" v-model="formData.terrainId" required>
            <option value="">Sélectionner un terrain</option>
            <option v-for="terrain in terrains" :key="terrain.id" :value="terrain.id">
              {{ terrain.name }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="areaSqm">Surface (m²)</label>
            <input
              id="areaSqm"
              type="number"
              class="input"
              v-model="formData.areaSqm"
              step="0.01"
              placeholder="0"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="pricePerSqm">Prix / m² (TND)</label>
            <input
              id="pricePerSqm"
              type="number"
              class="input"
              v-model="formData.pricePerSqm"
              step="0.01"
              placeholder="0"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="ownerName">Nom du propriétaire (optionnel)</label>
          <input
            id="ownerName"
            type="text"
            class="input"
            v-model="formData.ownerName"
            placeholder="Nom du propriétaire"
          />
        </div>

        <div class="form-group" style="margin-top:var(--space-xs);">
          <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:var(--color-text-muted);padding:var(--space-xs) 0;">
            <span>Prix total estimé :</span>
            <span style="font-weight:700;color:var(--color-text-primary)">
              {{ formatPrice(estimatedTotal) }}
            </span>
          </div>
        </div>

        <div
          v-if="submitError"
          style="margin-top:var(--space-sm);padding:var(--space-sm) var(--space-md);border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.08);border-radius:var(--radius-md);color:#ef4444;font-size:0.875rem;white-space:pre-wrap;"
        >
          {{ submitError }}
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="router.push('/parcelles')">Annuler</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Enregistrement...' : '+ Créer Parcelle' }}
        </button>
      </div>
    </form>
  </div>
</template>