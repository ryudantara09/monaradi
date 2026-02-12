<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createTerrain, fetchCustomers } from '@/services/api';

const router = useRouter();
const saving = ref(false);
const customers = ref<any[]>([]);

onMounted(async () => {
  try {
    customers.value = await fetchCustomers();
  } catch (err) {
    console.error('Erreur chargement données:', err);
  }
});

const formData = ref({
  name: '',
  address: '',
  areaSize: '' as string | number,
  latitude: '' as string | number,
  longitude: '' as string | number,
  mapReference: '',
  notes: '',
});

async function handleSubmit() {
  if (!formData.value.name.trim()) return;
  saving.value = true;

  try {
    await createTerrain({
      name: formData.value.name,
      address: formData.value.address || undefined,
      areaSize: formData.value.areaSize ? Number(formData.value.areaSize) : undefined,
      latitude: formData.value.latitude ? Number(formData.value.latitude) : undefined,
      longitude: formData.value.longitude ? Number(formData.value.longitude) : undefined,
      mapReference: formData.value.mapReference || undefined,
      notes: formData.value.notes || undefined,
    } as any);
    router.push('/terrains');
  } catch (error) {
    console.error('Erreur création terrain:', error);
    alert('Erreur lors de la création du terrain');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Ajouter un terrain</h1>
        <p class="page-subtitle">Enregistrer un nouveau terrain</p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit" style="display:flex;flex-direction:column;gap:var(--space-lg);max-width:800px">
      <div class="form-section">
        <h2 class="form-section-title">Informations générales</h2>
        <div class="form-group">
          <label class="form-label" for="name">Nom du terrain *</label>
          <input type="text" id="name" class="input" v-model="formData.name" placeholder="ex : Terrain Lac 1" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="address">Adresse</label>
          <input type="text" id="address" class="input" v-model="formData.address" placeholder="Adresse complète" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="areaSize">Superficie (m²)</label>
            <input type="number" id="areaSize" class="input" v-model="formData.areaSize" step="0.01" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label" for="mapReference">Référence cadastrale</label>
            <input type="text" id="mapReference" class="input" v-model="formData.mapReference" placeholder="N° plan" />
          </div>
        </div>
      </div>

      <!-- Owner - REMOVED as per requirements -->
      <!-- GeoLoc -->
      <div class="form-section">
        <h2 class="form-section-title">Localisation GPS</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="latitude">Latitude</label>
            <input type="number" id="latitude" class="input" v-model="formData.latitude" step="any" placeholder="36.8065" />
          </div>
          <div class="form-group">
            <label class="form-label" for="longitude">Longitude</label>
            <input type="number" id="longitude" class="input" v-model="formData.longitude" step="any" placeholder="10.1815" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2 class="form-section-title">Informations supplémentaires</h2>
        <div class="form-group">
          <label class="form-label" for="notes">Notes</label>
          <textarea id="notes" class="input textarea" v-model="formData.notes" placeholder="Notes supplémentaires..." rows="4" />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="router.push('/terrains')">Annuler</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Enregistrement...' : '+ Créer Terrain' }}
        </button>
      </div>
    </form>
  </div>
</template>
